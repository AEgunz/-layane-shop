const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const webpush = require('web-push');
const crypto = require('node:crypto');

function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022},
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: name => dependencies[name] ?? require(name),
    URL, Uint8Array, AbortSignal, Response, setTimeout, console: {error() {}}, ...globals,
  }, {filename: file});
  return exports;
}

function worker() {
  const handlers = {}, notifications = [], cached = new Map();
  const cache = {match: async k => cached.get(k), put: async (k,v) => cached.set(k,v), keys: async () => [...cached.keys()], delete: async k => cached.delete(k)};
  vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), {
    URL, Response, caches: {open: async () => cache},
    self: {location: {origin: 'https://shop.example'}, addEventListener: (n, fn) => handlers[n] = fn,
      registration: {showNotification: async (title, options) => notifications.push({title, ...options})},
      clients: {matchAll: async () => [], openWindow: async path => path}},
  });
  return {notifications, dispatch: (type, event) => new Promise((resolve, reject) => {
    handlers[type]({...event, waitUntil: promise => promise.then(resolve, reject)});
  })};
}

test('first order alerts on mobile through the service worker', async () => {
  const w = worker();
  await w.dispatch('message', {data: {type: 'ORDER_NOTIFICATION', id: 'first-order'}});
  assert.equal(w.notifications.length, 1);
  assert.equal(w.notifications[0].tag, 'order-first-order');
});

test('simultaneous foreground and background pushes only alert once', async () => {
  const w = worker();
  await Promise.all([
    w.dispatch('push', {data: {json: () => ({tag: 'order-123'})}}),
    w.dispatch('message', {data: {type: 'ORDER_NOTIFICATION', id: '123'}}),
  ]);
  assert.equal(w.notifications.length, 1);
});

test('test notifications remain repeatable, malformed payload still displays', async () => {
  const w = worker();
  for (let i=0; i<2; i++) await w.dispatch('push', {data: {json: () => ({tag: 'layane-push-test'})}});
  await w.dispatch('push', {data: {json: () => {throw Error('invalid');}}});
  assert.equal(w.notifications.length, 3);
});

test('click opens admin when the app is closed', async () => {
  const w = worker();
  assert.equal(await w.dispatch('notificationclick', {notification: {close() {}}}), '/admin');
});

function server(fetch, overrides = {}, configured = true) {
  const keys = webpush.generateVAPIDKeys();
  const env = configured ? {VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey, VAPID_SUBJECT: 'https://shop.example'} : {};
  const storage = {putPushSetting: async () => {}, deletePushSetting: async () => {}, listPushSubscriptions: async () => [], orderWasSaved: async () => true, ...overrides};
  return load('lib/push.ts', {'./push-storage': storage}, {process: {env}, fetch});
}
function subscription() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return {endpoint: 'https://fcm.googleapis.com/fcm/send/test', keys: {p256dh: ecdh.getPublicKey().toString('base64url'), auth: crypto.randomBytes(16).toString('base64url')}};
}
const payload = {title: 'Test', body: 'New order', tag: 'order-123'};

test('real encrypted Web Push request uses fetch with VAPID', async () => {
  let sent;
  const p = server(async (url, init) => { sent = {url, ...init}; return new Response('', {status: 201}); });
  await p.sendPush(subscription(), payload);
  assert.match(sent.headers.Authorization, /^vapid /i);
  assert.equal(sent.headers['Content-Encoding'], 'aes128gcm');
  assert.ok(sent.body.byteLength > 0);
  assert.equal(sent.redirect, 'error');
});

test('expired push subscriptions are deleted; transient failures retained', async () => {
  const removed = [];
  const sub = subscription();
  for (const status of [410, 503]) {
    const p = server(async () => new Response('', {status}), {deletePushSetting: async key => removed.push(key)});
    await assert.rejects(p.sendPush(sub, payload));
  }
  assert.equal(removed.length, 1);
});

test('arbitrary endpoints are rejected without a network request', async () => {
  let requests = 0;
  const p = server(async () => { requests++; });
  for (const endpoint of ['http://localhost/x', 'https://fcm.googleapis.com.evil.example/x', 'https://127.0.0.1/x']) {
    await assert.rejects(p.sendPush({...subscription(), endpoint}, payload));
  }
  assert.equal(requests, 0);
});

test('missing configuration is explicit and never silently enabled', () => {
  assert.throws(() => server(null, {}, false).pushConfig(), /VAPID_PUBLIC_KEY/);
});

test('unsaved order does not push; delivery failures do not break checkout', async () => {
  let requests = 0;
  const sub = subscription();
  const p = server(async () => {requests++; throw Error('offline');}, {
    orderWasSaved: async () => false,
    listPushSubscriptions: async () => [{value: JSON.stringify(sub)}],
  });
  await p.notifyNewOrder('123');
  assert.equal(requests, 0);
  const failing = server(async () => {requests++; throw Error('offline');}, {
    listPushSubscriptions: async () => [{value: JSON.stringify(sub)}],
  });
  await failing.notifyNewOrder('123');
  assert.equal(requests, 1);
});

test('subscription API requires admin authorization before returning keys', async () => {
  const routes = load('app/api/push/route.ts', {
    '@/lib/store': {admin: async () => {throw Error('AUTH');}, error: () => new Response('', {status: 401})},
    '@/lib/push': {pushConfig: () => {throw Error('must not read config');}},
  });
  assert.equal((await routes.GET()).status, 401);
});
