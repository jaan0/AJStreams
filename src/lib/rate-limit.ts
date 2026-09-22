import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// Rate limit configurations
export const rateLimiters = {
    // Chat messages: 10 per minute
    message: redis ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: '@upstash/ratelimit/message',
    }) : null,

    // Video sync: 30 per minute
    videoSync: redis ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1 m'),
        analytics: true,
        prefix: '@upstash/ratelimit/video-sync',
    }) : null,

    // Chat toggle: 5 per minute
    chatToggle: redis ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: '@upstash/ratelimit/chat-toggle',
    }) : null,

    // Party end: 3 per minute
    partyEnd: redis ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 m'),
        analytics: true,
        prefix: '@upstash/ratelimit/party-end',
    }) : null,

    // Create party: 5 per 5 minutes
    createParty: redis ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '5 m'),
        analytics: true,
        prefix: '@upstash/ratelimit/create-party',
    }) : null,

    // Update party: 20 per minute
    updateParty: redis ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        analytics: true,
        prefix: '@upstash/ratelimit/update-party',
    }) : null,
};

export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
    // If Redis is not configured (development), allow all requests
    if (!limiter) {
        return { success: true };
    }

    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    return {
        success,
        limit,
        remaining,
        reset,
    };
}
