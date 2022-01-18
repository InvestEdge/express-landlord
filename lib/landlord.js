/**
 * This module loads a bunch of configuration files from a directory.  It uses the names of these
 * files as the key in a hashtable full of configuration data.  On each request, the module looks
 * up one specific configuration by matching the incoming request's fully-qualified domain name to
 * the appropriate key in the hashtable.  This configuration is then bound to 'req.tenant'.
 */

/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const _ = require('lodash');
const FileSystem = require('./configuration-providers/file-system');
const InMemoryData = require('./configuration-providers/in-memory-data');

class Landlord {
    /**
     * Loads config files based on the options provided and returns a collection containing tenant configurations.
     * @param {Object} options
     * @param {string|Array} options.providers - List of globs to use to look up the configs.
     * @param {function} [options.log] - Function to use to log messages.
     * @returns {Object} - Object with each tenant as a property.
     */
    static loadTenants(options) {
        if (!options.providers) {
            throw new Error('landlord: Missing {options.providers}.');
        }

        const { log = console.log } = options;
        const providers = Array.isArray(options.providers) ? options.providers : [options.providers];

        // Make sure each provider supports loading Tenants
        providers.forEach(provider => {
            if (typeof provider.loadTenants !== 'function') {
                throw new Error(`landlord: Provider ${typeof provider} missing {provider.loadTenants}.`);
            }
        });

        /*
            Providers will load in the order they were supplied.  If a tenant appears in more than one
            provider, each subsequent tenant config is layered on top of the first, overriding any duplicate
            values.  This could be used to load portions of configs from multiple locations and merge them.
        */
        const tenants = {};

        providers.forEach(provider => {
            provider.loadTenants(log).forEach(tenant => {
                if (tenant.name in tenants) {
                    // Overwrite the old tenant with the new one, since the new one take precedence
                    tenant.applyDefaults(tenants[tenant.name].config);
                    tenants[tenant.name] = tenant;
                    log(`landlord: Merged configurations from multiple providers ${tenant.name}.`);
                    return;
                }

                tenants[tenant.name] = tenant;
                log(`landlord: Loaded ${tenant.name}.`);
            });
        });

        if (Object.keys(tenants).length === 0) {
            throw new Error('landlord: No configs were found.');
        }

        /*
            If a default configuration was supplied, apply it to all tenants.
        */
        const defaultConfig = tenants._default_ ? tenants._default_.config : null;
        if (!defaultConfig) {
            return tenants;
        }

        log('landlord: Found defaults ...');
        Object.values(tenants).forEach(tenant => {
            tenant.applyDefaults(defaultConfig);
        });
        log('landlord: Defaults applied.');

        return tenants;
    }

    /**
     * Attaches any available tenant databases in a provided collection of tenants, ignoring tenants that don't have connection info.
     * @param {Object} tenants - The collection of tenants to operate on.
     * @param {Object} options
     * @param {function} [options.db.factory=null] - A function that returns a db client.
     * @param {function} [options.db.finalizer=null] - A function that accepts a db client and cleans it up.
     * @param {string} [options.db.configPath=null] - The path in the config file where the database config is located.
     * @param {function} [options.log] - Function to use to log messages.
     */
    static attachDatabases(tenants, options) {
        const { log = console.log } = options;

        if (!options.db || !options.db.factory || !options.db.finalizer || !options.db.configPath) {
            log('landlord: Database connectivity was skipped.');
            return;
        }

        const { factory, finalizer, configPath } = options.db;
        let dbConfig = null;

        Object.values(tenants).forEach(tenant => {
            log(`landlord: Attaching ${tenant.name} ...`);
            /*
                _.get(object, path, default) will safely look for a key in an object and return null
                if it isn't found.
            */
            dbConfig = _.get(tenant.config, configPath);
            if (dbConfig) {
                tenant.attachDatabase(factory, finalizer, dbConfig);
                log(`landlord: Attached ${tenant.name}.`);
            } else {
                log(`landlord: Skipped ${tenant.name} (no db config).`);
            }
        });
    }

    /**
     * Cleans up database connections for the provided collection of tenants.
     * @param {Object} tenants - A tenant collection created by the loadTenants function.
     * @param {Object} [options]
     * @param {function} [options.log] - A function to use to log the results of the operation.
     */
    static detachDatabases(tenants, options) {
        const opts = options || {};
        const { log = console.log } = opts;

        log('landlord: Cleaning up...');
        Object.values(tenants).forEach(tenant => {
            log(`landlord: Cleaning up ${tenant.name} ...`);
            tenant.detachDatabase();
            log(`landlord: Cleaned ${tenant.name}.`);
        });
        log('landlord: All cleaned up.');
    }
}

/**
 * Expose the interface to the caller.
 */
module.exports = {
    Landlord,
    providers: {
        FileSystem,
        InMemoryData
    }
};
