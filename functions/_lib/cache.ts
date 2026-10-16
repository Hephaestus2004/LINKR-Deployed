// functions/_lib/cache.ts
// Cloudflare edge caching, security headers, and cache purge helpers

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self' 'unsafe-inline' https: data: blob:; img-src 'self' https: data: blob:; connect-src 'self' https:;"
};

/**
 * Returns cache headers for active public profiles
 */
export function getProfileCacheHeaders(ttlSeconds = 300): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    'Cache-Control': `public, max-age=${ttlSeconds}, stale-while-revalidate=86400`,
    'Vary': 'Accept-Encoding'
  };
}

/**
 * Returns cache headers for redirects (short max-age, never 301)
 */
export function getRedirectHeaders(ttlSeconds = 120): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    'Cache-Control': `public, max-age=${ttlSeconds}, must-revalidate`
  };
}

/**
 * Returns headers for non-cached dynamic or admin responses
 */
export function getNoCacheHeaders(): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
  };
}
