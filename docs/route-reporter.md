# Express Route Reporter

The Route Reporter interrogates the routes that are configured in a given Express app instance. It can either return them as an array, or print them to the desired logger.

Consider a file named "/myapp/routes.js", which exports an Express `Router`.

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

In order to print the routes to the console, you would call the Route Reporter like so.

```javascript
const { routeReporter }  = require('express-landlord');

const app = require('express')();

app.use(require('/myapp/routes.js'));

routeReporter.printRoutes(app)
```

This would generate the following output on the console.

```javascript
[
  { method: 'get', route: '/accounts' },
  { method: 'get', route: '/assets' }
]
```

# API

## **routeReporter.printRoutes(app [, logger])**

`app`

A reference to the Express app instance.

[`logger`]

In order to use a custom logger, you can also pass a logging function as demonstrated below.

```javascript
const { routeReporter }  = require('express-landlord');
const app = require('express')();

app.use(require('/myapp/routes.js'));

routeReporter.printRoutes(app, (message) => {
    console.log(`${new Date()}: ${message}`);
});
```

##  **reporter.getRoutes(app)**

Instead of printing the routes, you can also get an array of them.

`app`

A reference to the Express app instance.

```javascript
const { routeReporter }  = require('express-landlord');
const app = require('express')();

app.use(require('/myapp/routes.js'));

// Do something with the routes
routeReporter.getRoutes(app).map(
    ...
);
```



