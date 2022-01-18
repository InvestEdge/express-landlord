/* eslint-disable global-require */
const { expect } = require('chai');

describe('Express Route Reporter', () => {
    /*
        We need to create a new instance of express() each time we run a test
        so we can test the loader's pattern matching without worrying about
        cleaning up routes in between tests. This saves on a lot of boilerplate.
    */
    const loadApp = () => {
        const express = require('express');
        const app = express();

        return app;
    };

    it('can display routes', () =>  {
        const app = loadApp();
        const reporter = require('../lib/express-route-reporter');

        app.use('/users', require('../example/modules/users/routes'));
        app.use('/api', require('../example/modules/api/api.routes1'));
        app.use('/api', require('../example/modules/api/api.routes2'));

        const routes = reporter.getRoutes(app);

        expect(routes.length).to.equal(6);
        expect(routes[0]).to.have.property('method', 'get');
        expect(routes[0]).to.have.property('route', '/users/');
        expect(routes[4]).to.have.property('method', 'post');
        expect(routes[4]).to.have.property('route', '/api/test2');
    });


    it('can display routes that are multiple levels deep', () =>  {
        const app = loadApp();
        const reporter = require('../lib/express-route-reporter');

        app.use('/modules/users', require('../example/modules/users/routes'));
        app.use('/modules/api', require('../example/modules/api/api.routes1'));
        app.use('/modules/api', require('../example/modules/api/api.routes2'));

        const routes = reporter.getRoutes(app);

        expect(routes.length).to.equal(6);
        expect(routes[0]).to.have.property('method', 'get');
        expect(routes[0]).to.have.property('route', '/modules/users/');
        expect(routes[1]).to.have.property('method', 'get');
        expect(routes[1]).to.have.property('route', '/modules/users/profile');
    });

    it('can print routes using a custom logger', () =>  {
        const app = loadApp();
        const reporter = require('../lib/express-route-reporter');

        app.use('/modules/users', require('../example/modules/users/routes'));
        app.use('/modules/api', require('../example/modules/api/api.routes1'));
        app.use('/modules/api', require('../example/modules/api/api.routes2'));

        let _message = '';
        const logger = (message) => {
            _message = message;
        };

        reporter.printRoutes(app, logger);

        expect(_message).to.have.lengthOf.at.least(1);
        expect(_message).to.match(/\/users\/profile/);
        expect(_message).to.match(/\/api\/test1/);
        expect(_message).to.match(/\/api\/test2/);
    });

    it('can handle anonymous routes and log to console', () =>  {
        const app = loadApp();
        const reporter = require('../lib/express-route-reporter');

        app.use('/', () => null);

        reporter.printRoutes(app);
    });
});
