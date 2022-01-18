/**
 * This module is used to list the routes that have been loaded into an Express
 * app instance.
 */
const util = require('util');

/**
 * @typedef {Object} Route
 * @property {string} route - The full path of the route.
 * @property {string} method - The method for which the route is valid.
 */


/**
 * Scrubs a string representation of a regex to make it human readable.
 * @param {string} re - The string representation of the regex to be cleaned.
 */
function scrubRegex(re) {
    return re.toString()
        .replace('/^', '')              // Strip leading pattern
        .replace('?$/i', '')            // Strip trailing pattern 1
        .replace('\\/?(?=\\/|$)/i', '') // Strip trailing pattern 2
        .replace(/\\\//g, '/');         // Fix the slashes
}

/**
 * Recursively walks routes or routers in the stack and returns the results.
 * @param {Layer[]} stack - The stack of the current Router() or Express() object
 * @param {string[]} path - The array of paths that make up the full path
 */
function findRoutes(stack, path) {
    const basePath = path || [];

    return stack
        // Only include layers that have a route, or are of type "router"
        .filter(layer => layer.route
            || layer.name === 'router'
            || (layer.name === '<anonymous>' && layer.regexp))
        /*
            If we have a route, return it, otherwise, we have a router object, and need to
            return its child routes instead.  We will use recursion for this.
        */
        .flatMap(layer => {
            if (layer.route) {
                return {
                    route: layer.route,
                    basePath
                };
            }
            if (layer.name === '<anonymous>') {
                return {
                    route: { path: scrubRegex(layer.regexp), methods: { all: true } },
                    basePath
                };
            }

            return findRoutes(layer.handle.stack, [...basePath, scrubRegex(layer.regexp)]);
        });
}

/**
 * Returns an array of routes from an Express application.
 * @param {Object} app - The Express application instance.
 * @returns {Route[]} - An array of Route objects.
 */
function getRoutes(app) {
    /*
        We will gather all of our routes and then iterate over the "methods" available
        to each.
    */
    return findRoutes(app._router.stack)
        .flatMap(
            r => Object.keys(r.route.methods).map(
                method => ({
                    method,
                    route: `${r.basePath.join('')}${r.route.path}`
                })
            )
        );
}

/**
 * Prints the routes from an Express application.
 * @param {Object} app - The Express application instance.
 * @param {function} [logger] - The function to use to perform the printing.  Default: console.log.
 */
function printRoutes(app, logger) {
    (logger || console.log)(util.inspect(getRoutes(app), false, 2, true));
}

module.exports = {
    getRoutes,
    printRoutes
};
