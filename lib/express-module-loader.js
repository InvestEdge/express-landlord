/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */

/**
 * The module loader takes javascript modules that export anything usable as an Express
 * middleware and applies them to a Router, while deriving the path from the folder name.
 * The router is returned to the caller fully configured.
 */
const express = require('express');
const resolveGlobs = require('glob-resolver');

/**
 * Specifies a logging function.  The default is console.log.
 * @name logFunction
 * @function
 * @param {String} msg - The message to log.
*/


/**
    * Loads modules into the Express app, prefixing each module with the name of the
    * folder it came from.
    * @param {Object} options
    * @param {string|Array} options.globs - Glob(s) to use to find the files we want to load.
    * @param {string|Array} options.globOptions - Options to pass to the glob resolver.
    * @param {logFunction} options.log - A function to use to log messages
    */
function use(options) {
    const { globs, globOptions, log = console.log } = options;

    if (!globs) {
        throw new Error('express-module-loader: No globs were supplied.');
    }

    /*
        Convert the route globs to usable file metadata. After that, loop through each file,
        load the routes, and prefix each route's path with its directory name.
    */
    // eslint-disable-next-line no-use-before-define
    const modules = resolveGlobs(globs, globOptions);

    if (modules.length === 0) {
        throw new Error('express-module-loader: No files found matching the supplied pattern.');
    }

    /*
        Return an instance of a Router(), which the can be mounted like normal middleware and
        router objects.
    */
    const router = express.Router();

    modules.forEach(module => {
        log(`express-module-loader: Found ${module.fullPath} ...`);

        router.use(`/${module.dir}`, require(module.fullPath));

        log(`express-module-loader: Loaded ${module.fullPath}`);
    });

    return router;
}

module.exports = { use };
