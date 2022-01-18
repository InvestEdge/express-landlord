/* eslint-disable global-require */
const express = require('express');
const { expect, assert } = require('chai');
const request = require('supertest');
const { MockDBClient } = require('../example/mock-db-client');
const { ExpressLandlord, providers } = require('../lib/express-landlord');

describe('ExpressLandlord - config tests', () => {
    /*
        We need to create a new instance of express() each time we run a test
        so we can test the landlord's pattern matching without worrying about
        cleaning up routes in between tests. This saves on a lot of boilerplate.
    */
    const loadApp = (options) => {
        const app = express();
        const landlord = new ExpressLandlord(options);

        // Load the configs from the tenant file
        app.use(landlord.use());

        // Respond with the tenant info
        app.get('/', (req, res) => {
            res.send(req.tenant);
        });

        return app;
    };

    it('ExpressLandlord: responds with the correct tenant', (done) =>  {
        const app = loadApp({
            providers: new providers.FileSystem({
                globs: './example/tenants/*.tenant.json'
            })
        });

        // The test suite uses 127.0.0.1 to connect
        request(app)
            .get('/')
            .end((err, res) => {
                expect(res.text).to.match(/"slug":"127\.0\.0\.1-config"/);
                done();
            });
    });

    it('ExpressLandlord: can use alternate names for the req variable', (done) =>  {
        const app = loadApp({
            providers: new providers.FileSystem({
                globs: './example/tenants/*.tenant.json'
            }),
            req: { path: 'clientConfig' }
        });

        app.get('/client', (req, res) => {
            res.send(req.clientConfig);
        });

        // The "beta" key won't exist because we did not load defaults
        request(app)
            .get('/client/')
            .end((err, res) => {
                expect(res.text).to.match(/"slug":"127\.0\.0\.1-config"/);
                done();
            });
    });
});

describe('ExpressLandlord - database tests', () => {
    /*
        We need to create a new instance of express() each time we run a test
        so we can test the landlord's pattern matching without worrying about
        cleaning up routes in between tests. This saves on a lot of boilerplate.
    */
    let _landlord = null;

    const loadApp = (options) => {
        const app = express();

        // We are using knex, and our tenant files have the config under the environment.knex key
        const opts = {
            req: { path: 'tenant' },
            ...options,
            db: {
                factory: (config) => new MockDBClient(config),
                finalizer: (db) => { db.finalizer(); },
                configPath: 'environment.knex'
            }
        };

        // We need to save this reference so we can cleanup connections when we tear down tests.
        _landlord = new ExpressLandlord(opts);

        // Load the configs from the tenant file
        app.use(_landlord.use());

        // Respond with the user info
        app.get('/users', async (req, res, next) => {
            const users = await req.tenant.db
                .getUsers();

            if (users instanceof Error) {
                next(users);
                return;
            }

            res.send(users);
        });

        return app;
    };

    // Make sure to free database connections.
    afterEach(() => {
        _landlord.cleanup();
    });

    it('ExpressLandlord: can connect to a tenant database', (done) =>  {
        const app = loadApp({
            providers: new providers.FileSystem({
                globs: './example/tenants/127.0.0.1.tenant.json'
            })
        });

        request(app)
            .get('/users')
            .end((err, res) => {
                expect(res.status).to.equal(200);
                expect(res.type).to.equal('application/json');
                expect(res.body).to.have.length(3);
                done();
            });
    });

    it('ExpressLandlord: can reject invalid tenants', (done) =>  {
        const app = loadApp({
            providers: new providers.FileSystem({
                globs: './example/tenants/customer1.tenant.json'
            })
        });

        request(app)
            .get('/users')
            .end((err, res) => {
                expect(res.status).to.equal(403);
                done();
            });
    });

    it('req.tenantHeader option works correctly', (done) =>  {
        const app = loadApp({
            providers: new providers.FileSystem({
                globs: './example/tenants/customer1.tenant.json'
            }),
            req: {
                tenantHeader: 'ip'
            }
        });

        request(app)
            .get('/users')
            .end((err, res) => {
                expect(res.status).to.equal(403);
                done();
            });
    });

    it('cleanup(): does not throw', () =>  {
        const landlord = new ExpressLandlord({});

        assert.doesNotThrow(() => {
            landlord.cleanup();
        });
    });
});
