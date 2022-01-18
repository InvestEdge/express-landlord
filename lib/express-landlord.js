const httpError = require('http-errors');
const { Landlord, providers } = require('./landlord');

/**
 * A wrapper around the Landlord library for integrating Landlord with Express.
 */
class ExpressLandlord {
    /**
    * Creates the Landlord object.
    * @param {Object} options
    * @param {Object|Array} options.providers - One or more providers used to load configs.
    * @param {Object} [options.req] - Configuration for the Express req object.
    * @param {string} [options.req.path] - The path to be used in the req object ex: `tenant` yields `req.tenant`
    * @param {string} [options.req.tenantHeader] - The name of the `req.headers` value to use as the tenant name. Defaults to `req.hostname`.
    * @param {Object} options.db - Configuration for the tenant config file loader.
    * @param {function} [options.db.factory=null] - A function that returns a db client.
    * @param {function} [options.db.finalizer=null] -  A function that accepts a db client and cleans it up.
    * @param {string} [options.db.configPath=null] - The path in the config file where the database config is located.
    * @param {function} [options.log] - A function to use to log the results of the operation.
    * @returns {use~bindTenantToRequest} - Express middleware to load into the app.
    */
    constructor(options) {
        const opts = options;
        // Set the default req.path setting
        if (!opts.req) { opts.req = { }; }
        if (!opts.req.path) { opts.req.path = 'tenant'; }

        this._options = opts;
        this._tenants = {};
    }

    /**
     * Creates the Landlord Express middleware.
     */
    use() {
        this._tenants = Landlord.loadTenants(this._options);
        Landlord.attachDatabases(this._tenants, this._options);

        /*
            Return our middleware function
        */
        const {  _tenants: tenants, _options: options } = this;

        return function bindTenantToRequest(req, res, next) {
            const tenant = !options.req.tenantHeader
                ? req.hostname
                : req.header(options.req.tenantHeader);

            if (!tenants[tenant]) {
                next(httpError(403, 'Invalid tenant.'));
                return;
            }

            // Map a tenant onto the desired request variable
            req[options.req.path] = tenants[tenant];
            next();
        };
    }

    /**
     * Cleans up the tenants for this instance of Landlord by closing database connections.
     */
    cleanup() {
        if (Object.keys(this._tenants).length === 0) {
            return;
        }
        Landlord.detachDatabases(this._tenants, this._options);
    }
}

module.exports =  {
    ExpressLandlord,
    providers
};
