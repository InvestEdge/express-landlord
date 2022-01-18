const { expect, assert } = require('chai');
const { providers } = require('../lib/landlord');

describe('InMemoryData Landlord configuration provider', () => {
    it('InMemoryData: can be created', () =>  {
        const provider = new providers.InMemoryData({
            tenants: {
                name: 'localhost',
                config: {}
            }
        });
        expect(provider instanceof providers.InMemoryData).to.equal(true);
    });

    it('InMemoryData: validates parameters', () =>  {
        assert.throws(() => {
            // eslint-disable-next-line no-new
            new providers.InMemoryData({});
        });
    });

    it('loadTenants(): does not throw when no data is provided', () =>  {
        const client = new providers.InMemoryData({ tenants: [] });
        assert.doesNotThrow(() => {
            client.loadTenants();
        });
    });

    it('loadTenants(): validates tenant data is correctly formed', () =>  {
        const client = new providers.InMemoryData({
            tenants: [{ name: 'test' }]
        });
        assert.throws(() => {
            client.loadTenants();
        });
    });

    it('loadTenants(): can load multiple data elements', () =>  {
        const provider = new providers.InMemoryData({
            tenants: [
                { name: 'localhost', config: {} },
                { name: 'other-host', config: {} },
                { name: 'another-host', config: { someval: 1 } }
            ]
        });
        const tenants = provider.loadTenants();
        expect(tenants instanceof Array).to.equal(true);
        expect(tenants).to.have.length(3);
        expect(tenants[2]).to.have.property('config');
        expect(tenants[2].config).to.have.property('someval');
    });

    it('loadTenants(): can load a single data element', () =>  {
        const provider = new providers.InMemoryData({
            tenants:
                { name: 'localhost', config: { someval: 1 } }
        });
        const tenants = provider.loadTenants();
        expect(tenants instanceof Array).to.equal(true);
        expect(tenants).to.have.length(1);
        expect(tenants[0]).to.have.property('config');
        expect(tenants[0].config).to.have.property('someval');
    });
});
