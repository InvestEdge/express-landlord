const { expect } = require('chai');
const {
    Landlord,
    ExpressLandlord,
    providers,

    moduleLoader,
    routeReporter
} = require('../index');

describe('@ Assemble all modules into a library.', () => {
    it('can load all objects', () =>  {
        expect(new Landlord({}) instanceof Landlord).to.equal(true);
        expect(new ExpressLandlord({}) instanceof ExpressLandlord).to.equal(true);
        expect(new providers.FileSystem({ globs: [] }) instanceof providers.FileSystem).to.equal(true);
        expect(new providers.InMemoryData({ tenants: [] }) instanceof providers.InMemoryData).to.equal(true);

        expect(moduleLoader.use instanceof Function).to.equal(true);
        expect(routeReporter.getRoutes instanceof Function).to.equal(true);
    });
});
