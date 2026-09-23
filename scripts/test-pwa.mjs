import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const manifest = JSON.parse(await readFile(new URL('../public/manifest.json', import.meta.url), 'utf8'));
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.orientation, 'any');
assert.equal(manifest.scope, '/');
for (const icon of manifest.icons) {
  const image = await readFile(new URL(`../public${icon.src}`, import.meta.url));
  assert.equal(image.subarray(1, 4).toString(), 'PNG');
  assert.equal(`${image.readUInt32BE(16)}x${image.readUInt32BE(20)}`, icon.sizes, icon.src);
}
for (const screenshot of manifest.screenshots || []) await readFile(new URL(`../public${screenshot.src}`, import.meta.url));
assert(manifest.icons.some(icon => icon.sizes === '192x192'));
assert(manifest.icons.some(icon => icon.sizes === '512x512'));
console.log('PASS: standalone manifest and all declared image dimensions');

const listeners = {};
const stores = new Map();
let online = true;
let claims = 0;
let writes = 0;
let rejectWrites = false;
const key = request => typeof request === 'string' ? new URL(request, 'https://app.test').href : request.url;
const caches = {
  async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async addAll(paths) { for (const path of paths) store.set(key(path), new Response(path === '/offline.html' ? 'OFFLINE PAGE' : 'PUBLIC ASSET')); },
      async match(request) { return store.get(key(request))?.clone(); },
      async put(request, response) { if (rejectWrites) throw new Error('Storage full'); writes++; store.set(key(request), response.clone()); },
    };
  },
  async match(request) { for (const store of stores.values()) { const response = store.get(key(request)); if (response) return response.clone(); } },
  async keys() { return [...stores.keys()]; },
  async delete(name) { return stores.delete(name); },
};
const context = {
  URL, Response, caches,
  fetch: async () => { if (!online) throw new Error('Offline'); return new Response('NETWORK'); },
  self: { location: { origin: 'https://app.test' }, addEventListener: (name, listener) => { listeners[name] = listener; }, skipWaiting() {}, clients: { async claim() { claims++; } } },
};
vm.runInNewContext(await readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), context);
async function lifecycle(name) { let pending; listeners[name]({ waitUntil(promise) { pending = promise; } }); await pending; }
function dispatch(path, options = {}) {
  let response;
  const request = { url: new URL(path, 'https://app.test').href, method: 'GET', mode: 'cors', headers: new Headers(), ...options };
  listeners.fetch({ request, respondWith(promise) { response = promise; } });
  return response;
}
await lifecycle('install');
stores.set('ajstreams-api-v1', new Map());
stores.set('ajstreams-static-v1', new Map());
stores.set('unrelated-app-cache', new Map());
await lifecycle('activate');
assert.equal(claims, 1);
assert(!stores.has('ajstreams-api-v1'));
assert(!stores.has('ajstreams-static-v1'));
assert(stores.has('unrelated-app-cache'));
console.log('PASS: obsolete app caches removed; unrelated caches preserved');

for (const path of ['/api/auth/session', '/api/user/favorites', '/api/movies', '/api/watch-party', 'https://player.example/video']) assert.equal(dispatch(path), undefined, path);
assert.equal(dispatch('/account', { headers: new Headers({ RSC: '1' }) }), undefined);
assert.equal(dispatch('/api/auth/signup', { method: 'POST' }), undefined);
assert.equal(dispatch('/private-photo.jpg'), undefined);
console.log('PASS: account/API data, RSC payloads, external requests and writes bypass the cache');

const beforeNavigation = writes;
assert.equal(await (await dispatch('/account', { mode: 'navigate' })).text(), 'NETWORK');
assert.equal(writes, beforeNavigation);
online = false;
assert.equal(await (await dispatch('/account', { mode: 'navigate' })).text(), 'OFFLINE PAGE');
assert.equal(await (await dispatch('/icons/icon-192x192.png')).text(), 'PUBLIC ASSET');
assert.equal((await dispatch('/_next/static/missing.js')).type, 'error');
console.log('PASS: online navigation stays fresh; offline navigation and cached icons work');

online = true;
assert.equal(await (await dispatch('/_next/static/test.js')).text(), 'NETWORK');
online = false;
assert.equal(await (await dispatch('/_next/static/test.js')).text(), 'NETWORK');
online = true;
rejectWrites = true;
assert.equal(await (await dispatch('/_next/static/storage-full.js')).text(), 'NETWORK');
console.log('PASS: public asset caching and storage-full recovery');
