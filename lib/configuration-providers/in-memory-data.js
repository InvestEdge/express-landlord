const Tenant = require('../tenant');

class InMemoryData {
    /**
     * Used to configure Landlord directly in code.
     * @param {Object} options
     * @param {string|Array} options.tenants - Tenant data in the form { name, config }.
     */
    constructor(options) {
        if (!options.tenants) {
            throw new Error('express-landlord: InMemoryData provider - missing {options.tenants}.');
        }

        this._data = Array.isArray(options.tenants) ? options.tenants : [options.tenants];
        this._options = options;
    }

    /**
     * Loads configs based on the options provided and returns a structure full of tenant configurations.
     * @param {function} log - A function to use to log messages; defaults to console.log.
     * @returns {Object} - Object with each tenant as a property.
     */
    loadTenants(log = console.log) {
        if (this._data.length === 0) {
            log('express-landlord: InMemoryData provider - no data has been supplied.');
        }

        const tenants = [];

        this._data.forEach(tenantData => {
            const { name, config } = tenantData;

            if (!name || !config) {
                throw new Error('express-landlord: InMemoryData provider - missing {tenant.name} or {tenant.config}.');
            }

            log(`express-landlord: InMemoryData provider - found ${name} ...`);
            tenants.push(new Tenant(name, config));
            log(`express-landlord:  FileSystem provider - created ${name}`);
        });

        return tenants;
    }
}

module.exports = InMemoryData;
