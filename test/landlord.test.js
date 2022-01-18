const { expect, assert } = require('chai');
const { Landlord, providers } = require('../lib/landlord');
const { MockDBClient } = require('../example/mock-db-client');

describe('Landlord', () => {
    it('Landlord: can be created', () =>  {
        const landlord = new Landlord();
        expect(landlord instanceof Landlord).to.equal(true);
    });

    it('loadTenants(): can be called', () =>  {
        const tenants = Landlord.loadTenants({
            providers: new providers.FileSystem({
                globs: './example/tenants/*.tenant.json'
            })
        });
        expect(Object.keys(tenants)).to.have.length(7);
    });

    it('loadTenants(): validates parameters', () =>  {
        assert.throws(() => {
            Landlord.loadTenants({});
        });
        assert.throws(() => {
            Landlord.loadTenants({ providers: [{}] });
        });
    });

    it('loadTenants(): throws when no tenants are found', () =>  {
        assert.throws(() => {
            Landlord.loadTenants({
                providers: [
                    { loadTenants() { return []; } }
                ]
            });
        });
    });

    it('loadTenants(): accepts multiple glob patterns', () =>  {
        const tenants = Landlord.loadTenants({
            providers: new providers.FileSystem({
                globs: [
                    './example/tenants/127.0.0.1.tenant.json',
                    './example/tenants/_default_.tenant.json'
                ]
            })
        });
        expect(Object.keys(tenants)).to.have.length(2);
    });

    it('loadTenants(): accepts alternate log', () =>  {
        const logs = [];
        const log = (msg) => logs.push(msg);

        const tenants = Landlord.loadTenants({
            providers: new providers.FileSystem({
                globs: './example/tenants/*.tenant.json',
            }),
            log
        });

        expect(Object.keys(tenants)).to.have.length(7);
        expect(logs).to.have.length(23);
    });

    it('loadTenants(): properly merges defaults', () =>  {
        let tenants = Landlord.loadTenants({
            providers: new providers.FileSystem({
                globs: [
                    './example/tenants/127.0.0.1.tenant.json',
                    './example/tenants/_default_.tenant.json'
                ]
            })
        });

        // The "beta" key will only exist when the _default_file is loaded.
        expect(tenants['127.0.0.1'].config.features.beta).to.equal(true);

        tenants = Landlord.loadTenants({
            providers: new providers.FileSystem({
                globs: [
                    './example/tenants/127.0.0.1.tenant.json'
                ]
            })
        });

        expect(tenants['127.0.0.1'].config.features).not.to.have.property('beta');
    });

    it('loadTenants(): can use multiple providers and merge tenant data', () =>  {
        const tenants = Landlord.loadTenants({
            providers: [
                new providers.FileSystem({
                    globs: './example/tenants/*.tenant.json'
                }),
                new providers.FileSystem({
                    globs: './example/tenants2/*.tenant.json'
                })
            ]
        });
        expect(Object.keys(tenants)).to.have.length(7);
        expect(tenants['127.0.0.1'].config).to.have.property('location');
        // This value only gets overridden if the second provider overrides the first
        expect(tenants['127.0.0.1'].config.location).to.match(/overridden/);
    });

    it('Landlord: can attach and detach databases', () =>  {
        const client = new MockDBClient();
        const tenants = Landlord.loadTenants({
            providers: new providers.FileSystem({
                globs: './example/tenants/127.0.0.1.tenant.json'
            })
        });
        expect(Object.keys(tenants)).to.have.length(1);
        expect(tenants['127.0.0.1'].config.features).not.to.have.property('beta');

        Landlord.attachDatabases(tenants, {
            db: {
                factory: (config) => client.factory(config),
                finalizer: () => client.finalizer(),
                configPath: 'environment.knex'
            }
        });

        expect(tenants['127.0.0.1'].db).to.have.property('config');
        expect(tenants['127.0.0.1'].db.config).to.have.property('client');
        expect(tenants['127.0.0.1'].db.config.client).to.equal('sqlite3');

        Landlord.detachDatabases(tenants);

        expect(tenants['127.0.0.1'].db).to.equal(null);
    });

    it('Landlord: can attach and detach databases with alternate log', () =>  {
        const logs = [];
        const log = (msg) => logs.push(msg);
        const client = new MockDBClient();
        const tenants = Landlord.loadTenants({
            providers: new providers.FileSystem({
                globs: './example/tenants/127.0.0.1.tenant.json'
            }),
            log
        });
        expect(Object.keys(tenants)).to.have.length(1);
        expect(tenants['127.0.0.1'].config.features).not.to.have.property('beta');

        Landlord.attachDatabases(tenants, {
            db: {
                factory: (config) => client.factory(config),
                finalizer: () => client.finalizer(),
                configPath: 'environment.knex'
            },
            log
        });

        expect(tenants['127.0.0.1'].db).to.have.property('config');
        expect(tenants['127.0.0.1'].db.config).to.have.property('client');
        expect(tenants['127.0.0.1'].db.config.client).to.equal('sqlite3');

        Landlord.detachDatabases(tenants);

        expect(tenants['127.0.0.1'].db).to.equal(null);
        expect(logs).to.have.length(5);
    });
});
