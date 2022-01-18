# Express Landlord

Landlord simplifies interactions with tenant configuration data and tenant databases in a multitenant environment.  It allows developers to write code as if they were working in a single-tenant environment by automatically managing access to configuration and databases connections as part of the Express request lifecycle.  In short, it adds configuration data (`req.tenant.config`) and optionally a database connection (`req.tenant.db`) to each request, ensuring they are mapped to the correct tenant.

Landlord works by reading a bunch of configuration data and exposing only the appropriate parts of this data in the `req.tenant` object at runtime.  In the most common use case, loading config files from disk, Landlord uses the name of a given config file as the name of the tenant the data belongs to.  It subsequently uses the tenant name as the key in an internal hashtable full of configuration data, where the data in each file is loaded under the name of the tenant. On each request, the module looks up the correct configuration data by matching the incoming request's fully-qualified domain name (`req.hostname`) to the appropriate key in the hashtable.  This configuration data found at this key is then bound to `req.tenant.config`.

It takes a directory full of files like this:

```
/config/tenants/
    clientA.example.com.tenant.json
    clientB.example.com.tenant.json
    clientC.example.com.tenant.json
```

With configuration data like this:

```javascript
// clientA.example.com.tenant.json
{
    "name": "clienta.example.com",
    "param1": "value A",
    "arbitraryParam": "other value A"
}
```

```javascript
// clientB.example.com.tenant.json
{
    "name": "clientb.example.com",
    "param1": "value B",
    "arbitraryParam": "other value B"
}
```

And uses the incoming request's domain name to lookup and provide the tenant info to the request like this:

```javascript
// Request from req.hostname === 'clienta.example.com'
let val1 = req.tenant.config.param1;           // "value A"
let val2 = req.tenant.config.arbitraryParam;   // "other value A"
```

```javascript
// Request from req.hostname === 'clientb.example.com'
let val1 = req.tenant.config.param1;           // "value B"
let val2 = req.tenant.config.arbitraryParam;   // "other value B"
```

# Providers

Landlord can read from multiple types of data store, and can even be extended to read from custom sources.  Each type of store is represented by a `Provider`.  The FileSystem Provider loads data from config files, for example.  Landlord ships with `FileSystem` and `InMemoryData` Providers by default.

Example 1:

```javascript
// The FileSystem provider will load all files matching "xyz.tenant.json"
const express = require('express');
const { ExpressLandlord, providers } = require('express-landlord');

const app = express();

const landlord = new ExpressLandlord({
    providers: new providers.FileSystem({
        globs: './example/tenants/*.tenant.json'
    })
});

app.use(landlord.use());
```

Landlord can even combine data from *multiple* providers.  When multiple providers are configured and the same tenant appears in more than one of them, the data is merged.  This can be useful to store partial configurations, such as storing non-sensitive configuration data in one location, while database connections are stored in another, for instance.

Example 2:

```javascript
// Multiple providers can be loaded at once
const express = require('express');
const { ExpressLandlord, providers } = require('express-landlord');

const app = express();

const landlord = new ExpressLandlord({
    providers: [
        new providers.FileSystem({
            globs: './example/basic-configs/*.tenant.json'
        }),
        new providers.FileSystem({
            globs: './example/database-configs/*.tenant.json'
        })
    ]
});

app.use(landlord.use());
```

## Conflict resolution

When configurations are merged and the data in them conflicts, the source that was loaded last is preferred.  In other words, each subsequent provider is overlayed on top of the previously loaded configuration data.  This can be used to great effect to implemnent partial configuration files, or even to create a deafult config file for a specific tenant that gets augmented by a subsequently-loaded config.

```javascript
// Consider the following two config files:

// basic-configs/client.example.com.tenant.json
{
    "name": "Basic config",
    "version": "1.0"
}

// database-configs/client.example.com.tenant.json
{
    "name": "Secondary config",
    "connectionString": "server=foo;database=bar;"

}

// If the files were loaded in order, the result would be the following:
{
    "name": "Secondary config",
    "version": "1.0",
    "connectionString": "server=foo;database=bar;"
}
```

# Setting Defaults Values Across Tenants

If a tenant named `_default_` is provided, it will be used as the base configuration file that all other configs inherit from.  This can be useful to provide default values that are only overridden on an as-needed basis.

In the example below, we have a default file that contains 3 parameters.

```javascript
// _default_.tenant.json
{
    "param1": "value 1",
    "param2": "value 2",
    "param3": "value 3"
}
```

A tenant configuration file might only override one of them, and may have its own unique values.

```javascript
// mycustomer.mysite.com.tenant.json
{
    "param3": "OVERRIDDEN",
    "customParam": "CUSTOM"
}
```

When a request arrives for this tenant, the results will be merged.

```javascript
// When req.hostname == "mycustomer.mysite.com"
// req.tenant ==
{
    "param1": "value 1",
    "param2": "value 2",
    "param3": "OVERRIDDEN",
    "customParam": "CUSTOM"
}
```

# Database Connections

Landlord includes a mechanism to bind per-tenant databases to the Express request object.  To do so, it uses the per-tenant configuration data it has already loaded to create a database connection which is then bound to the request object. The resulting request object exposes both a `tenant.config` and a `tenant.db` property.

```javascript
req.tenant.config = { /* config file contents*/ }
req.tenant.db = { /* db connection */ }
```

The database connection is created based on connection properties stored in a node in the tenant configuration data.  For example, given a config file that looks the following:

```javascript
// tenants/customer1.example.com.tenant.json
{
    meta: {
        name: 'Tenant A'
        root: '/var/tenants/tenant-a.example.com/'
    },
    environment:
        url: 'https://tenant-a.example.com',
        knex: {
            host: 'localhost'
            database: 'myDatabase'
        }
    }
{
```

The resulting request object can be decorated like so:

```javascript
//req.tenant.config.environment:
{
    url: 'https://tenant-a.example.com',
    knex: {
        host: 'localhost',
        database: 'myDatabase'
    }
}


// req.tenant.config.db:
knex(req.config.environment.knex)
```

When binding a database connection to a tenant, a 'factory function' is used to create the database instance.  Using a factory allows Landlord to be compatible with almost any database client library.  The factory will be passed the database configuration when it is bound.  It should return whatever should be bound to `req.tenant.db` at runtime. 


`options.db.factory` is a callback that receives the value contained in `options.db.configPath` and returns a database client.  The instance retuned from this callback will be passed to `options.db.finalizer` when the tenant is being cleaned up in order to gracefully cleanup database connections.

## Example 1 (Using Knex):

```javascript
const express = require('express');
const knex = require('knex');
const { ExpressLandlord, providers } = require('express-landlord');

const app = express();

const landlord = new ExpressLandlord({
    providers: /* providers go here! */,
    db: {
        factory: knex,
        finalizer: (db) => { db.destroy() },
        configPath: 'envirnoment.knex' 
    }
});

app.use(landlord.use());
```

## Example 2 (Using Sequelize):

```javascript
const express = require('express');
const { Sequelize } = require('Sequelize');
const { ExpressLandlord, providers } = require('express-landlord');

const app = express();

const landlord = new ExpressLandlord({
    providers: /* providers go here! */,
    db: {
        factory: (config) => { return new Sequelize(config) },
        finalizer: (db) => { db.close() },
        configPath: 'envirnoment.sequelize' 
    }
});
```
## Closing connections and cleaning up

Before exiting an app, all database connections should be closed by calling `landlord.cleanup()`.  Failure to do so may cause the app to hang on to database connections and refuse to quit.  The proper way to clean things up gracefully is to implement a two-part cleanup routine with timeouts.

```javascript
const landlord = new ExpressLandlord(
    /* Options go here ... */
);
const app = express();
app.use(landlord.use());

/*
    ... yadda, yadda, yadda ...
*/

const server = app.listen(3000, () => {
    console.log(
        `Express server listening on http://localhost:${app.get('port')} ...`
    );
});

// Close resources before we exit!
function cleanup() {
    console.log('Server shutting down...');
    server.close(() =>  {
        landlord.cleanup();
        console.log('Graceful exit.');
        process.exit(0);
    });

    // Force exit if the operations take too long
    setTimeout(() => {
        console.log('Forcing exit.');
        process.exit(0);
    }, 5000);
}
```


# API: ExpressLandlord

Landlord accepts a configuration object.  At a bare minimum, it must contain the providers it will use to load configurations.

The example below demonstrates all available options.  This example will load two specific configuration files.  It will then attempt to bind an instance of Knex to each tenant, based on the value found at 'environments.knex' in that tenant's configuration data.  It also overrides the default `req.tenant` property with `req.customer` instead.

```javascript
const options = {
    providers: providers: new providers.FileSystem({
        globs: [
            './example/tenants/127.0.0.1.tenant.json',
            './example/tenants/www.example.com.tenant.json'
        ]
    }),
    db: {
        factory: knex,
        finalizer: (db) => { db.destroy() },
        configPath: 'envirnoment.knex' 
    },
    req: {
        path: 'customer',
        tenantHeader: 'x-forwarded-for'
    },
    log: customLogger.log
}
```

## **new ExpressLandlord(options)**

`options.providers` *{string|string[]}*

A string or array containing the providers that will be used to load configuration data.

`[options.req.path]` *{string='tenant'}*

The name of the request variable is normally `req.tenant`. Setting this value sets it to something else.  

`[options.req.tenantHeader]` *{string=req.hostname}*

The name of the request header to use to lookup tenants.  Defaults to `req.hostname` if this value is not set.

`[options.log]` *void function(message)*

By default, all messages are logged to `console.log`.  This can be overridden by passing in your own logger.

`[options.db.factory]` *database function(config)*

The factory function that will be used to create database connections.  It takes a configuration object.  The value of the configuration object is the data stored in `req.tenant[options.db.configPath]`.

`[options.db.finalizer]` *function(database)*

The finalizer that will be used to tear down database connections.  It takes the connection that was originally created by the factory.

`[options.db.configPath]` *string*

The path in `req.tenant` to use as the configuration for the database.


## **landlord.use()**

Creates the middleware to add to Express.

## **landlord.cleanup()**

Calls the finalizer for each tenant.  

# API: FileSystem Provider (loading configuration data from files)

When using the `FileSystem` Provider, configuration data should be stored in plain JSON files.

It is assumed that they are named \<hostname\>.tenant.json.

Example:
```
    Your Site:    https://mycustomer.mysite.net
    Config File:  mycustomer.mysite.net.tenant.json
```

The configuration files can be loaded from one or more locations by passing in one or more globs.  They will be loaded in alphabetical order.

```javascript
const { ExpressLandlord, providers } = require('express-landlord');
const express = require('express');

const app = express();

const landlord = new ExpressLandlord({
    providers: new providers.FileSystem({
        globs: [
            './example/tenants/127.0.0.1.tenant.json',
            './example/tenants/www.example.com.tenant.json'
        ]
    })
});

// Echo back the tenant's config
app.use('/config', (req, res, next) => {
    res.send(req.tenant.config);
});
```

## **new providers.FileSystem(options)**

`options.globs` *{string|string[]}*

The globs to use to look up files.

`options.globOptions` *{Object}*

Additional options to pass to the [`globResolver`](docs/../glob-resolver.md).

# API: InMemoryData Provider (Loading configurations from memory)

The `InMemoryData` configuration provider is a way of loading data directly from memory.  This is primarily useful for development, but also has use cases for settings defaults in memory instead of loading defaults from a file.

Example:
```javascript

const landlord = new ExpressLandlord({
    providers: [
        new providers.InMemoryData({
            tenants: [
                {
                    name: '_default_',
                    featureFlags: {
                        alpha: false,
                        beta: false,
                        monthly: true
                    }
                }
            ]
        }),
        new providers.FileSystem({ globs: './example/tenants/*.tenant.json' })
    ]
});
```

## **new providers.InMemoryData(options)**

`options.tenants` *Tenant[]*

The array of tenant data to load.  Tenants are simply data structures with a `name` and a `config` property, eg:

```javascript
// Tenant:
{
    name: 'customer1.example.com',
    config: { someSetting: true }
}
```
