const _ = require('lodash');

/**
 * Represents a single tenant in a multitenant environment.
 */
class Tenant {
    /**
     * Creates a new tenant instance.
     * @param {Object} config - Any object, which will be used as the configuration data
     */
    constructor(name, config) {
        if (!name || !config) {
            throw new Error('Missing tenant configuration.');
        }

        this._name = name;
        this._config = config;
        this._db = null;
        this._dbFinalizer = null;
    }

    /**
     * Gets the name of the tenant.
     */
    get name() {
        return this._name;
    }

    /**
     * Gets the configuration bound to the tenant.
     */
    get config() {
        return this._config;
    }

    /**
     * Gets the database bound to the tenant.
     */
    get db() {
        return this._db;
    }

    /**
     * Adds default values to the config object by merging the values of the config on top of the defaults.
     * @param {Object} defaultConfig - An object to use to provide default values in the config.
     */
    applyDefaults(defaultConfig) {
        this._config = _.merge({}, defaultConfig, this._config);
    }

    /**
     * Attaches a database to the tenant.
     * @param {function} factory - Function that returns an instance of the database client when passed the given config.
     * @param {function} finalizer - Function that takes an instance of the database client and cleans up after it.
     * @param {Object} config - The configuration to pass to the database client.
     */
    attachDatabase(factory, finalizer, config) {
        if (this._db) {
            throw new Error('tenant: Database already attached.');
        }

        this._db = factory(config);
        this._dbFinalizer = finalizer;
    }

    /**
     * Cleans up the database connection by calling the finalizer and passing in the database.
     */
    detachDatabase() {
        if (this._db && this._dbFinalizer) {
            this._dbFinalizer(this._db);
        }

        this._db = null;
        this._dbFinalizer = null;
    }
}

module.exports = Tenant;
