const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}, globals = {}) {
  const absolutePath = file.endsWith('.ts') || file.endsWith('.tsx') ? file : file + '.ts';
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(absolutePath, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;

  const requireResolver = name => {
    if (dependencies[name]) return dependencies[name];
    if (name.startsWith('@/')) {
      const targetRel = name.slice(2);
      const targetPath = path.join(__dirname, '..', targetRel);
      if (fs.existsSync(targetPath + '.ts')) return load(targetPath + '.ts', dependencies, globals);
      if (fs.existsSync(targetPath + '.tsx')) return load(targetPath + '.tsx', dependencies, globals);
      if (fs.existsSync(targetPath + '.js')) return load(targetPath + '.js', dependencies, globals);
    }
    return require(name);
  };

  vm.runInNewContext(code, {
    exports, require: requireResolver,
    URL, Headers, Response, process, console, setTimeout, clearTimeout, ...globals,
  }, {filename: absolutePath});
  return exports;
}

test('login API returns session and sets secure cookie when https', async () => {
  const route = load(path.join(__dirname, '../app/api/public/route.ts'), {
    '@/lib/store': {
      originCheck: () => true,
      getAdmins: async () => [{ username: 'admin', password: 'layane2026', role: 'full' }],
      brand: async () => ({ name: 'layane-shop' }),
      db: () => ({ prepare: () => ({ bind: () => ({ first: async () => null }) }) }),
    },
    '@/lib/push': {
      notifyNewOrder: async () => {}
    }
  });

  const req = {
    url: 'https://layane-shop.com/api/public',
    headers: new Map([['x-forwarded-proto', 'https']]),
    json: async () => ({ action: 'login', username: 'admin', password: 'layane2026' })
  };

  const res = await route.POST(req);
  assert.equal(res.status, 200);
  const data = JSON.parse(await res.text());
  assert.equal(data.ok, true);
  assert.ok(data.session.startsWith('logged_in:admin:'));

  const setCookie = res.headers.get('Set-Cookie');
  assert.ok(setCookie.includes('admin_session=logged_in:admin:'));
  assert.ok(setCookie.includes('SameSite=Lax'));
  assert.ok(setCookie.includes('Secure'));
});

test('session token in Authorization header is recognized by admin middleware', async () => {
  const store = load(path.join(__dirname, '../lib/store.ts'), {
    '@/app/chatgpt-auth': { getChatGPTUser: async () => null }
  }, {
    cookies: async () => ({ get: () => null }),
    headers: async () => ({
      get: name => name.toLowerCase() === 'authorization' ? 'Bearer logged_in:admin:%5B%22Overview%22%2C%22Landing%20pages%22%2C%22Orders%22%2C%22Analytics%22%2C%22Brand%20settings%22%5D' : null
    })
  });

  const user = await store.admin();
  assert.equal(user.displayName, 'Store Administrator');

  const perms = await store.getSessionPermissions();
  assert.equal(JSON.stringify(perms), JSON.stringify(['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings']));
});

test('session token in X-Session header fallback is recognized for mobile clients', async () => {
  const store = load(path.join(__dirname, '../lib/store.ts'), {
    '@/app/chatgpt-auth': { getChatGPTUser: async () => null }
  }, {
    cookies: async () => ({ get: () => null }),
    headers: async () => ({
      get: name => name.toLowerCase() === 'x-session' ? 'logged_in:admin:%5B%22Orders%22%5D' : null
    })
  });

  const user = await store.admin();
  assert.equal(user.displayName, 'Store Administrator');

  const perms = await store.getSessionPermissions();
  assert.equal(JSON.stringify(perms), JSON.stringify(['Orders']));
});
