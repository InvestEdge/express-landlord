/* eslint-disable global-require */
const { expect, assert } = require('chai');
const request = require('supertest');

describe('Express Module Loader', () => {
    /*
        We need to create a new instance of express() each time we run a test
        so we can test the loader's pattern matching without worrying about
        cleaning up routes in between tests. This saves on a lot of boilerplate.
    */
    const loadApp = (globs, options) => {
        const app = require('express')();
        const loader = require('../lib/express-module-loader');

        app.use(loader.use({ globs, globOptions: options }));

        return app;
    };

    it('throws when it has no globs', () =>  {
        assert.throws(() => {
            loadApp(
                '',
            );
        });
    });

    it('throws when it finds nothing to load', () =>  {
        assert.throws(() => {
            loadApp(
                '**/*.invalid-filename',
            );
        });
    });

    it('can take a single glob pattern', () =>  {
        const app = loadApp(
            '**/*.js',
            { cwd: `${process.cwd()}/example/modules` }
        );

        request(app)
            .get('/api/another-test')
            .end((err, res) => {
                expect(res.status).to.equal(200);
            });
    });

    it('can take an array of glob patterns - 2/2', () =>  {
        const app = loadApp(
            ['api/*1.js', 'api/*2.js'],
            { cwd: `${process.cwd()}/example/modules` }
        );

        request(app)
            .get('/api/another-test')
            .end((err, res) => {
                expect(res.status).to.equal(200);
            });
    });

    it('can load all routes recursively', () => {
        const app = loadApp(
            ['**/*routes*.js'],
            { cwd: `${process.cwd()}/example/modules` }
        );

        // We have to interrogate the Express innards due to our route structure
        expect(app._router.stack.filter(l => l.name === 'router')).to.have.length(1);
        expect(app._router.stack.filter(l => l.name === 'router')[0].handle.stack).to.have.length(5);
    });

    it('can ignore specific routes - 1/2', () => {
        const app = loadApp(
            ['**/*routes*.js'],
            {
                cwd: `${process.cwd()}/example/modules`,
                ignore: 'admin/*.*'
            }
        );

        // Our ignore SHOULD exclude this route
        request(app)
            .get('/admin/secured')
            .end((err, res) => {
                expect(res.status).to.equal(404);
            });
    });

    it('can ignore specific routes - 2/2', () => {
        const app = loadApp(
            ['**/*routes*.js'],
            {
                cwd: `${process.cwd()}/example/modules`,
                ignore: 'admin/*.*'
            }
        );

        // Our ignore should NOT exclude this route
        request(app)
            .get('/api/another-test')
            .end((err, res) => {
                expect(res.status).to.equal(200);
            });
    });

    it('can specify cwd', () => {
        const app = loadApp(
            ['*.js'],
            {
                cwd: `${process.cwd()}/example/modules/api`
            }
        );

        request(app)
            .get('/another-test')
            .end((err, res) => {
                expect(res.status).to.equal(200);
            });
    });
});
