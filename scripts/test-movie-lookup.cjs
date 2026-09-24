const fs = require('fs'), vm = require('vm'), ts = require('typescript'), assert = require('assert/strict');
const { NextRequest } = require('next/server');
function load(file, mocks = {}) {
 const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
 vm.runInNewContext(code, { module, exports: module.exports, require: id => mocks[id] || require(id), console }); return module.exports;
}
(async () => {
 const lookup = load('src/lib/movie-lookup.ts');
 assert.equal(lookup.movieLookup('invalid'), null);
 assert.equal(lookup.movieLookup('1372059.*'), null);
 assert.equal(lookup.movieLookup('507f1f77bcf86cd799439011')._id, '507f1f77bcf86cd799439011');
 const query = lookup.movieLookup('1372059');
 const matches = url => query.$or.some(q => typeof q.videoUrl === 'string' ? q.videoUrl === url : new RegExp(q.videoUrl.$regex, q.videoUrl.$options).test(url));
 assert(matches('https://bingr.one/watch/movie/1372059'));
 assert(matches('https://vidlink.pro/movie/1372059?autoplay=1'));
 assert(matches('https://multiembed.mov/?video_id=1372059&tmdb=1'));
 assert(!matches('https://bingr.one/watch/movie/13720590'));
 assert(!matches('https://bingr.one/watch/tv/1372059/1/1'));
 assert(!matches('https://multiembed.mov/?video_id=1372059&tmdb=1&s=1&e=1'));
 let called = false;
 let result = null;
 const api = load('src/app/api/movies/[id]/route.ts', { '@/lib/movie-lookup': lookup, '@/lib/mongodb': { __esModule: true, default: async () => {} }, '@/models/Movie': { __esModule: true, default: { findOne: async q => { called = true; assert.equal(q._id, undefined); return result; } } } });
 const request = new NextRequest('http://localhost:3002/api/movies/1372059');
 assert.equal((await api.GET(request, { params: { id: 'invalid' } })).status, 400); assert.equal(called, false);
 assert.equal((await api.GET(request, { params: { id: '1372059' } })).status, 404);
 result = { title: 'Test title' };
 assert.equal((await api.GET(request, { params: { id: '1372059' } })).status, 200);
 console.log('PASS: numeric/ObjectId validation, exact provider IDs, movie/TV separation, 400/404/200 responses');
 require('dotenv').config({ path: '.env.local', quiet: true }); require('dotenv').config({ path: '.env', quiet: true });
 const mongoose = require('mongoose'); await mongoose.connect(process.env.MONGODB_URI);
 try { const actual = await mongoose.connection.collection('movies').findOne(query, { projection: { title: 1 } }); console.log(actual ? 'PASS: 1372059 resolves in catalog: ' + actual.title : 'INFO: 1372059 is absent from this catalog; numeric page falls back to TMDB watch route.'); }
 finally { await mongoose.disconnect(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
