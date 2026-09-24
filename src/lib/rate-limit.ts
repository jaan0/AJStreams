// In-memory rate limiter - no external service required
interface RateLimitEntry {
    count: number;
    windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimiterConfig {
    maxRequests: number;
    windowMs: number;
}

function createRateLimiter(config: RateLimiterConfig) {
    return {
        limit: (identifier: string) => {
            const key = identifier;
            const now = Date.now();
            const entry = rateLimitStore.get(key);

            if (!entry || now - entry.windowStart > config.windowMs) {
                // New window
                rateLimitStore.set(key, { count: 1, windowStart: now });
                return {
                    success: true,
                    limit: config.maxRequests,
                    remaining: config.maxRequests - 1,
                    reset: now + config.windowMs,
                };
            }

            if (entry.count >= config.maxRequests) {
                return {
                    success: false,
                    limit: config.maxRequests,
                    remaining: 0,
                    reset: entry.windowStart + config.windowMs,
                };
            }

            entry.count++;
            return {
                success: true,
                limit: config.maxRequests,
                remaining: config.maxRequests - entry.count,
                reset: entry.windowStart + config.windowMs,
            };
        },
    };
}

// Rate limit configurations
export const rateLimiters = {
    message:     createRateLimiter({ maxRequests: 10, windowMs: 60_000 }),
    videoSync:   createRateLimiter({ maxRequests: 30, windowMs: 60_000 }),
    chatToggle:  createRateLimiter({ maxRequests: 5,  windowMs: 60_000 }),
    partyEnd:    createRateLimiter({ maxRequests: 3,  windowMs: 60_000 }),
    createParty: createRateLimiter({ maxRequests: 5,  windowMs: 300_000 }),
    updateParty: createRateLimiter({ maxRequests: 20, windowMs: 60_000 }),
};

type Limiter = ReturnType<typeof createRateLimiter>;

export async function checkRateLimit(
    limiter: Limiter,
    identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
    try {
        return limiter.limit(identifier);
    } catch (error) {
        console.warn('Rate limit check failed, allowing request:', error);
        return { success: true };
    }
}
