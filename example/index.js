/*
    This file configures the application instance used by the test suite.
*/

const express = require('express');
const { MockDBClient } = require('./mock-db-client');
const {
    routeReporter,
    moduleLoader,
    ExpressLandlord,
    providers
}  = require('../index');

/*
    Configure the providers for tenant configuration data and tenant database connections.

    Note that in addition to the FileSystem, we can also provide configuration data directly
    using the InMemoryData provider. This can be useful for setting a global _default_ tenant,
    for instance.

    Ex:
    new providers.InMemoryData({
        tenants: [
            {
                name: 'localhost',
                config: {
                    environment: {
                        knex: {
                            client: 'pg',
                            // ... etc ...
                        }
                    }
                }
            }
        ]
    })
*/
const landlord = new ExpressLandlord({
    providers: new providers.FileSystem({
        globs: ['./example/tenants/*.tenant.json', './example/tenants2/*.tenant.json']
    }),
    db: {
        factory: (config) => new MockDBClient().factory(config),
        finalizer: (db) => { db.finalizer(); },
        configPath: 'environment.knex'
    }
});


const app = express();

/*
    We always want to load Landlord and Doorman early in the middleware chain.
*/
app.use(landlord.use());

/*
    The loader module will take each folder under "modules" and expose it as a route
    in our application.  This allows us to work in a modular fashion instead of
    thinking of the app as one big set of routes.

    To see how routes are built, take a look at any file under the /modules folder.
*/
app.use(moduleLoader.use({
    globs: '**/*routes*.js',
    globOptions: { cwd: `${process.cwd()}/example/modules` }
}));

// catch undefined routes and respond with 404
// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
    res.status(404).send('Route not found!');
});

// catch server errors and respond with 500
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(`${req.url}: ${err.stack}`);
    res.status(err.status || 500).send(err.message || 'Application Error!');
});


const port = parseInt(process.env.PORT || '3000', 10);
app.set('port', port);

const server = app.listen(app.get('port'), () => {
    console.log(
        `Express server listening on http://localhost:${app.get('port')} -  try browsing one of these routes:`
    );

    /*
        The Route Printer is a nice convenience!
    */
    routeReporter.getRoutes(app).forEach(item => {
        if (item.method !== 'get') { return; }
        console.log(`http://localhost:${app.get('port')}${item.route}`);
    });
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

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = app;
