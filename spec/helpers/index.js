// All - Each - spec - Each - All

const SchemaCache = require('parse-server/lib/Controllers/SchemaCache').default;
const DatabaseController = require('parse-server/lib/Controllers/DatabaseController');
const CacheController = require('parse-server/lib/Controllers/CacheController').CacheController;
const InMemoryCacheAdapter = require('parse-server/lib/Adapters/Cache/InMemoryCacheAdapter').default;
const TestAdapter = require('../../test/TestAdapter');

const SpecReporter = require('jasmine-spec-reporter').SpecReporter;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(new SpecReporter());

const cacheAdapter = new InMemoryCacheAdapter({});
const cacheController = new CacheController(cacheAdapter, 'appId');
const schemaCache = new SchemaCache(cacheController);
const databaseAdapter = new TestAdapter().getAdapter();
const database = new DatabaseController(databaseAdapter, schemaCache);

global.database = database;

beforeEach((done) => {
  database.performInitialization().then(done, done);
});

afterEach((done) => {
  const destroyAll = () => {
    database.deleteEverything().then(done, done);
  };
  databaseAdapter.getAllClasses()
    .then((allSchemas) => {
      allSchemas.forEach((schema) => {
        const className = schema.className;
        // 这里的asymmetricMatch是jasmine自定义的匹配规则函数，把左边当作参数传入
        expect(className).toEqual({
          asymmetricMatch: (name) => {
            if (!name.startsWith('_')) {
              return true;
            }
            // Other system classes will break Parse.com, so make sure that we don't save anything to _SCHEMA that will
            // break it.
            return ['_User', '_Installation', '_Role', '_Session', '_Product'].indexOf(name) >= 0;
          }
        });
      });
    })
    .then(destroyAll, destroyAll);
});
