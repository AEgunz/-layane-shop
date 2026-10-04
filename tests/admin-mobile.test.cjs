const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the actual reload callback with mobile notification behavior.
function setup({delivery = async () => {}, lastSeen = 'previous', failApi = false} = {}) {
  const source = fs.readFileSync('app/studio.tsx', 'utf8');
  const callback = source.match(/const reload = useCallback\([\s\S]*?\}, \[\]\);/);
  assert.ok(callback);
  const result = {data: null, errors: [], alerts: [], lastSeen};
  const data = {orders: [{id: 'new-order', customer: 'Test', city: 'Test', total: 100}]};
  class MobileNotification {
    static permission = 'granted';
    constructor() { throw new TypeError('Illegal constructor on mobile'); }
  }
  const context = {
    useCallback: fn => fn,
    api: async () => { if (failApi) throw Error('Unauthorized'); return data; },
    setData: value => {result.data = value;},
    setError: value => {result.errors.push(value);},
    setLoginErr() {}, playNotificationChime() {},
    safeLocalStorageGet: () => result.lastSeen,
    safeLocalStorageSet: (key, value) => {result.lastSeen = value;},
    showOrderNotification: async id => {result.alerts.push(id); await delivery();},
    window: {Notification: MobileNotification}, Notification: MobileNotification,
  };
  const code = ts.transpileModule(callback[0] + '\nglobalThis.reload = reload;', {
    compilerOptions: {target: ts.ScriptTarget.ES2022},
  }).outputText;
  vm.runInNewContext(code, context);
  return {reload: context.reload, result, data};
}

test('successful login loads admin with a new order on mobile', async () => {
  const {reload, result, data} = setup();
  assert.equal(await reload(), data);
  assert.equal(result.data, data);
  assert.deepEqual(result.alerts, ['new-order']);
  await reload(true);
  assert.deepEqual(result.alerts, ['new-order']);
});

test('blocked notification delivery cannot block admin data', async () => {
  const {reload, result, data} = setup({delivery: async () => {throw Error('blocked');}});
  assert.equal(await reload(), data);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.data, data);
  assert.deepEqual(result.errors, ['']);
});

test('first visit is silent and failed authentication still shows an error', async () => {
  const first = setup({lastSeen: null});
  await first.reload();
  assert.deepEqual(first.result.alerts, []);
  const denied = setup({failApi: true});
  await denied.reload();
  assert.equal(denied.result.data, null);
  assert.deepEqual(denied.result.errors, ['Unauthorized']);
});
