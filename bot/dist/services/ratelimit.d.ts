interface RateLimitResult {
    blocked: boolean;
    tempBlocked: boolean;
    reason?: string;
}
export declare function checkRateLimit(userId: string): Promise<RateLimitResult>;
export declare function resetRateLimits(userId: string): Promise<void>;
export {};
//# sourceMappingURL=ratelimit.d.ts.map