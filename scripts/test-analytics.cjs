const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const { NextRequest } = require('next/server');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  const full = path.resolve(file);
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const req = id => Object.hasOwn(mocks, id) ? mocks[id] : id.startsWith('@/') ? load('src/' + id.slice(2) + '.ts', mocks) : require(id);
  vm.runInNewContext(code, { module, exports: module.exports, require: req, process, console, URL, Date, Map, setTimeout, clearTimeout, Buffer }, { filename: full });
  return module.exports;
}
(async () => {
  const validation = load('src/lib/analytics.ts');
  assert.equal(validation.analyticsPath('/watch-party/private-code?token=secret'), '/watch-party/[room]');
  assert.equal(validation.analyticsPath('/account?email=private'), '/account');
  assert.equal(validation.analyticsPath('/some/private/email'), '/other');
  assert.equal(validation.referrerHost('https://example.com/private?email=secret'), 'example.com');
  assert.equal(validation.analyticsBatch.safeParse({ consent: false }).success, false);
  console.log('PASS: sensitive paths, query strings and referrers are sanitized');
  let writes = [];
  const mocks = { '@/lib/mongodb': { default: async () => {}, __esModule: true }, '@/models/AnalyticsEvent': { default: { bulkWrite: async rows => { writes.push(...rows); } }, __esModule: true }, '@/lib/analytics': validation };
  const post = load('src/app/api/analytics/route.ts', mocks).POST;
  const session = randomUUID(), view = randomUUID();
  const event = { id: randomUUID(), view, type: 'pageview', path: '/account?email=hidden', referrer: 'https://example.com/private', width: 390, height: 844 };
  const request = (body, origin = 'http://localhost:3002', headers = {}) => new NextRequest('http://localhost:3002/api/analytics', { method: 'POST', headers: { origin, 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 Chrome/120.0', ...headers }, body: JSON.stringify(body) });
  assert.equal((await post(request({ consent: true, session, events: [event] }, 'https://evil.test'))).status, 403);
  assert.equal((await post(request({ consent: false, session, events: [event] }))).status, 400);
  assert.equal((await post(request({ consent: true, session, events: [{ ...event, x: 4 }] }))).status, 400);
  assert.equal((await post(request({ consent: true, session, events: [event] }, undefined, { dnt: '1' }))).status, 204);
  assert.equal(writes.length, 0);
  assert.equal((await post(request({ consent: true, session, events: [event, { ...event, id: randomUUID(), path: '/admin' }] }))).status, 204);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].updateOne.update.$setOnInsert.path, '/account');
  assert.equal(writes[0].updateOne.update.$setOnInsert.referrer, 'example.com');
  assert.equal(writes[0].updateOne.update.$setOnInsert.device, 'Mobile');
  assert.equal(writes[0].updateOne.filter.eventId, event.id);
  console.log('PASS: origin, consent, DNT, bounds, admin exclusion, device bucket and idempotent writes');
  const oldUrl = process.env.UPSTASH_REDIS_REST_URL, oldToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = 'https://unavailable.test'; process.env.UPSTASH_REDIS_REST_TOKEN = 'test';
  class UnavailableLimiter { static slidingWindow() { return {}; } async limit() { throw new Error('Unavailable'); } }
  const fallbackPost = load('src/app/api/analytics/route.ts', { ...mocks, '@upstash/ratelimit': { Ratelimit: UnavailableLimiter }, '@upstash/redis': { Redis: { fromEnv: () => ({}) } } }).POST;
  assert.equal((await fallbackPost(request({ consent: true, session, events: [event] }))).status, 204);
  for (let i = 0; i < 59; i++) await fallbackPost(request({ consent: true, session, events: [event] }));
  assert.equal((await fallbackPost(request({ consent: true, session, events: [event] }))).status, 429);
  if (oldUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = oldUrl;
  if (oldToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = oldToken;
  console.log('PASS: shared limiter outage falls back to an enforced local rate limit');
  let role;
  let aggregateCalled = false;
  const adminMocks = { ...mocks, 'next-auth': { getServerSession: async () => role ? { user: { role } } : null }, '@/lib/auth': { authOptions: {} }, '@/models/AnalyticsEvent': { __esModule: true, default: { aggregate: () => { aggregateCalled = true; throw new Error('Should not execute'); } } } };
  const get = load('src/app/api/admin/analytics/route.ts', adminMocks).GET;
  assert.equal((await get(new NextRequest('http://localhost:3002/api/admin/analytics'))).status, 403);
  role = 'user';
  assert.equal((await get(new NextRequest('http://localhost:3002/api/admin/analytics'))).status, 403);
  role = 'admin';
  assert.equal((await get(new NextRequest('http://localhost:3002/api/admin/analytics?days=999'))).status, 400);
  assert.equal(aggregateCalled, false);
  console.log('PASS: admin API rejects guests, ordinary users and invalid ranges before database access');
  for (const admin of [false, true]) {
    const Bottom = load('src/components/BottomNav.tsx', { react: { ...React, useState: () => [false, () => {}] }, 'next/navigation': { usePathname: () => '/' }, 'next-auth/react': { useSession: () => ({ data: admin ? { user: { role: 'admin' } } : null }) }, 'next/link': { __esModule: true, default: props => React.createElement('a', props) }, './SearchModal': { __esModule: true, default: () => null } }).default;
    const html = renderToStaticMarkup(React.createElement(Bottom));
    assert.equal(html.includes('href="/admin"'), admin);
  }
  console.log('PASS: mobile Admin link renders only for admins');
  require('dotenv').config({ path: '.env.local', quiet: true });
  require('dotenv').config({ path: '.env', quiet: true });
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI);
  const name = 'analytics_test_' + randomUUID().replaceAll('-', '');
  const model = mongoose.model(name, new mongoose.Schema({}, { strict: false }), name);
  try {
    const base = { createdAt: new Date(), session: 'test-session', view: 'test-view', path: '/', device: 'Mobile', referrer: 'example.com', country: 'PK', region: 'SD', city: 'Karachi', browser: 'Chrome', os: 'Android' };
    await model.insertMany([{ ...base, type: 'pageview' }, { ...base, type: 'engagement', seconds: 30, scroll: 75 }, { ...base, type: 'click', x: 1, y: 0.5 }, { ...base, type: 'pageview', createdAt: new Date(Date.now() - 100 * 86400000) }]);
    adminMocks['@/models/AnalyticsEvent'] = { __esModule: true, default: model };
    const report = await (await load('src/app/api/admin/analytics/route.ts', adminMocks).GET(new NextRequest('http://localhost:3002/api/admin/analytics?days=7&path=/&device=Mobile'))).json();
    assert.equal(report.totals[0].views, 1);
    assert.equal(report.totals[0].sessions, 1);
    assert.equal(report.totals[0].seconds, 30);
    assert.equal(report.heat[0]._id.x, 19);
    assert.equal(report.depth[0].average, 75);
    assert.equal(report.countries[0]._id, 'PK');
    assert.equal(report.referrers[0]._id, 'example.com');
    console.log('PASS: real MongoDB aggregation counts, date exclusion, geography, referrers, scroll depth and heatmap edge bins');
  } finally { await model.collection.drop(); await mongoose.disconnect(); }
})().catch(err => { console.error(err); process.exitCode = 1; });

