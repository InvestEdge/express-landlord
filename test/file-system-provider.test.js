const { expect, assert } = require('chai');
const { providers } = require('../lib/landlord');


describe('FileSystem Landlord configuration provider', () => {
    it('FileSystem: can be created', () =>  {
        const provider = new providers.FileSystem({
            globs: './example/tenants/*.tenant.json'
        });
        expect(provider instanceof providers.FileSystem).to.equal(true);
    });

    it('FileSystem: validates parameters', () =>  {
        assert.throws(() => {
            // eslint-disable-next-line no-new
            new providers.FileSystem({});
        });
    });

    it('loadTenants(): accepts one pattern', () =>  {
        const provider = new providers.FileSystem({
            globs: './example/tenants/*.tenant.json'
        });
        const tenants = provider.loadTenants();
        expect(tenants instanceof Array).to.equal(true);
        expect(tenants).to.have.length(7);
    });

    it('loadTenants(): accepts multiple patterns', () =>  {
        const provider = new providers.FileSystem({
            globs: [
                './example/tenants/_default_.tenant.json',
                './example/tenants/127.0.0.1.tenant.json'
            ]
        });
        const tenants = provider.loadTenants();
        expect(tenants instanceof Array).to.equal(true);
        expect(tenants).to.have.length(2);
    });

    it('loadTenants(): does not throw when it finds no configs', () =>  {
        const provider = new providers.FileSystem({
            globs: 'invalid-glob'
        });
        assert.doesNotThrow(() => {
            provider.loadTenants();
        });
    });
});
