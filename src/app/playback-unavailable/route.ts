import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
export function GET(req: NextRequest) {
    const nonce = req.nextUrl.searchParams.get('nonce') || '';
    if (!/^[a-f\d-]{36}$/i.test(nonce)) return new NextResponse('Invalid playback callback', { status: 400 });
    const scriptNonce = randomUUID();
    const message = JSON.stringify({ type: 'AJSTREAMS_SOURCE_UNAVAILABLE', nonce });
    return new NextResponse(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Source unavailable</title></head><body style="background:#08090b;color:white;font:16px system-ui;display:grid;place-content:center;text-align:center;height:90vh;padding:24px"><h1>This source is unavailable</h1><p>Choose another server or use Retry above.</p><script nonce="${scriptNonce}">parent.postMessage(${message},location.origin);</script></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${scriptNonce}'; style-src 'unsafe-inline'; frame-ancestors 'self'` } });
}
