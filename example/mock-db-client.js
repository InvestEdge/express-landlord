// A mock DB client for our tests
class MockDBClient {
    constructor() {
        this._config = null;
        this._users = [
            { name: 'Test 1' },
            { name: 'Test 2' },
            { name: 'Test 3' }
        ];

        return this;
    }

    factory(config) {
        this._config = config;
        return this;
    }

    finalizer() {
        this._config = null;
    }

    get config() {
        return this._config;
    }

    getUsers() {
        return this._users;
    }
}

module.exports = { MockDBClient };
