const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;
  vm.runInNewContext(code, {exports, require: name => dependencies[name] ?? require(name),
    console, ...globals}, {filename: file});
  return exports;
}

for (const serialized of [true, false]) {
  test(`homepage renders the selected published page (serialized=${serialized})`, async () => {
    const saved = {id: 'selected', slug: 'my-product', name: 'Saved product',
      images: ['one.jpg', 'two.jpg', 'three.jpg', 'four.jpg'], cta: 'اطلب الآن', price: 199};
    let selectedId = 'selected';
    const requests = [];
    const rows = [
      {id: 'other', slug: 'other', status: 'published', data: {id: 'other'}},
      {id: 'selected', slug: saved.slug, status: 'published', data: serialized ? JSON.stringify(saved) : saved},
      {id: 'draft', slug: 'draft', status: 'draft', data: {id: 'draft'}},
    ];
    const store = load('lib/store.ts', {'@/app/chatgpt-auth': {}, 'next/headers': {}}, {
      process: {env: {SUPABASE_URL: 'https://storage.example', SUPABASE_KEY: 'test-only'}},
      fetch: async (url, init) => {
        const parsed = new URL(url);
        requests.push({url: parsed, init});
        if (parsed.pathname.endsWith('/settings')) {
          return {json: async () => parsed.searchParams.get('key') === 'eq.main_home_page_id'
            ? [{value: selectedId}] : []};
        }
        assert.equal(parsed.pathname, '/rest/v1/pages');
        assert.equal(parsed.searchParams.get('select'), 'id,slug,data');
        assert.equal(parsed.searchParams.get('status'), 'eq.published');
        assert.equal(init.cache, 'no-store');
        assert.equal(parsed.searchParams.get('id'), `eq.${selectedId}`);
        assert.equal(parsed.searchParams.get('limit'), '1');
        return {ok: true, json: async () => rows.filter(row => row.status === 'published' && row.id === selectedId)};
      },
    });
    const home = load('app/page.tsx', {'@/lib/store': store, './storefront': {default: () => null}});
    const rendered = await home.default();
    assert.equal(JSON.stringify(rendered.props.page), JSON.stringify(saved));
    assert.ok(requests.some(request => request.url.pathname.endsWith('/pages')));
    // Switching the homepage setting must change what the next request renders.
    selectedId = 'other';
    assert.equal((await home.default()).props.page.id, 'other');
    // A draft cannot become the public homepage through the saved setting.
    selectedId = 'draft';
    assert.equal((await home.default()).type, 'main');
    selectedId = '';
    assert.equal((await home.default()).type, 'main');
  });
}
