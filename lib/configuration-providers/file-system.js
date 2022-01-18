/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const globResolver = require('glob-resolver');
const Tenant = require('../tenant');

class FileSystem {
    /**
     * Configures the FileSystem provider and returns an instance.
     * @param {Object} options
     * @param {string|Array} options.globs - List of globs to use to look up the configs.
     * @param {Object} [options.globOptions] - Options to pass to the globResolver
     */
    constructor(options) {
        if (!options.globs) {
            throw new Error('landlord: FileSystem provider - missing {options.globs}.');
        }

        this._options = options;
    }

    /**
     * Loads configs based on the options provided and returns a structure full of tenant configurations.
     * @param {function} log - A function to use to log messages; defaults to console.log.
     * @returns {Object} - Object with each tenant as a property.
     */
    loadTenants(log = console.log) {
        const { globs, globOptions } = this._options;

        const configs = globResolver(globs, globOptions).map(config => ({
            ...config,
            tenant: config.name.toLowerCase().replace('.tenant', '')
        }));

        if (configs.length === 0) {
            log('landlord: FileSystem provider - no files found matching the supplied pattern.');
        }

        const tenants = [];

        configs.forEach(config => {
            log(`landlord: FileSystem provider - found ${config.fullPath} ...`);
            tenants.push(new Tenant(config.tenant, require(config.fullPath)));
            log(`landlord: FileSystem provider - created ${config.tenant}`);
        });

        return tenants;
    }
}

module.exports = FileSystem;
