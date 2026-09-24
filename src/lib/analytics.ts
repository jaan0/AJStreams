import { z } from 'zod';

// Strip query strings, share codes and unknown paths before storing telemetry.
export function analyticsPath(value: string): string {
    const path = value.split(/[?#]/)[0];
    if (/^\/watch-party\//.test(path)) return '/watch-party/[room]';
    if (/^\/(movie|watch\/movie)\/[a-f\d]{24}$/i.test(path)) return path;
    if (/^\/watch\/tv\/\d+(\/\d+\/\d+)?$/.test(path)) return path;
    if (/^\/(about|account|affiliates|api|blog|careers|contact|cookies|developers|faq|help|licenses|movies|my-list|partners|press|privacy|profile|terms|watch-parties)?$/.test(path)) return path;
    if (path === '/categories/all/GENRES') return path;
    return '/other';
}
export const analyticsBatch = z.object({
    consent: z.literal(true),
    session: z.string().uuid(),
    events: z.array(z.object({
        id: z.string().uuid(),
        view: z.string().uuid(),
        type: z.enum(['pageview', 'engagement', 'click']),
        path: z.string().max(250),
        referrer: z.string().max(250).optional(),
        width: z.number().int().min(1).max(10000),
        height: z.number().int().min(1).max(10000),
        x: z.number().min(0).max(1).optional(),
        y: z.number().min(0).max(1).optional(),
        scroll: z.number().min(0).max(100).optional(),
        seconds: z.number().min(0).max(300).optional(),
        target: z.enum(['link', 'button', 'other']).optional(),
    })).min(1).max(25),
});
export function referrerHost(value?: string) {
    try { return value ? new URL(value).hostname.slice(0, 200) : 'Direct / unknown'; }
    catch { return 'Direct / unknown'; }
}
