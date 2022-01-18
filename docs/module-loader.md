# Express Module Loader

The Loader enables a modular approach to Express development.  It provides a mechanism for loading modules (folders full of code) dynamically at runtime.  This means applications can be composed of many smaller applications instead of having to rely on a single large codebase.  This helps avoid the creation of bloated and untestable monolithic apps by favoring the development of smaller, more cohesive units of code. 

In technical terms, Express Module Loader finds modules that export Express middlewares or routers and loads them from the specified folder(s).  The folder name is used as the base of the url path for each router or middleware when registering it.  The goal is that the file system structure mirrors the basic route structure.

## Example 1:

Consider the following folder structure, where each JS file exports an Express Router():

```
/myapp/
    lions/
        routes.js
        --------------------------------
        const router = express.Router():
        router.get('/simba');
        router.get('/aslan');
        module.exports = router;

    tigers/
        routes.js
        --------------------------------
        const router = express.Router():
        router.get('/tony');
        router.get('/tigger');
        module.exports = router;

    bears/
        routes.js
        --------------------------------
        const router = express.Router():
        router.get('/pooh');
        router.get('/baloo');
        module.exports = router;
```

Instead of manually creating the routes, we can instead use the module loader.

```javascript
// Load the modules under /myapp
const { moduleLoader }  = require('express-landlord');

app.use(moduleLoader.use({
    globs: '**/*routes*.js',
    globOptions: { cwd: `${process.cwd()}/myapp` }
}));
```

The result would be the routes being configured like so:

```
http://localhost:3000/lions/
    /simba/
    /aslan/

http://localhost:3000/tigers/
    /tony/
    /tigger/

http://localhost:3000/bears/
    /pooh/
    /baloo/
```

## Example 2:

Consider a file named "/myapp/modules/compliance/routes.js", which exports a couple Express routes.

```javascript
const router = require('express').Router();

router.get('/accounts', (req, res) => {
    res.send(`${req.path}`);
});

router.get('/assets', (req, res) => {
    res.send(`${req.path}`);
});

module.exports = router;
```

This module is then loaded by the module loader.

```javascript
// Load the modules under /myapp/modules
const { moduleLoader }  = require('express-landlord');

app.use(moduleLoader.use({
    globs: '**/*routes*.js',
    globOptions:: { cwd: `${process.cwd()}/myapp/modules` }
}));
```

The following routes will be exposed by the application:

```
https://localhost/compliance/accounts
https://localhost/compliance/assets
```

# API

## **loader.use(options)**

`options.globs`

The module loader accepts a single string or an array containing globs. It also exposes all options accepted by the [`glob`](https://www.npmjs.com/package/glob) package, with the following exceptions which are always overridden.

```
nodir: true,
strict: true,
cwd: options.cwd || process.cwd()
```

`options.globOptions.cwd`

The current working directory defaults to process.cwd().

`options.globOptions.ignore`

A glob or array of globs to exclude from the set of configuration files.

### Examples:

```javascript
// Load files based on multiple patterns
const { moduleLoader }  = require('express-landlord');

app.use(moduleLoader.use({
    globs: [
        '**/*routes*.js',
        '**/*modules*.js'
    ],
    globOptions: { cwd: `${process.cwd()}/myapp/` }
}));
```

```javascript
// Ignore certain files - uses a pass-through option of the glob module
const { moduleLoader }  = require('express-landlord');

app.use(moduleLoader.use({
    globs: '**/*.js',
    {
        cwd: `${process.cwd()}/myapp/`,
        ignore: '**/*modules*.js'
    }
}));
```
