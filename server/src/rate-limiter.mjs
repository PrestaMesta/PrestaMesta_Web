/**
 * Minimal in-memory sliding-window rate limiter, scoped to a single process. Good enough for a
 * reference implementation of one low-traffic endpoint; a real deployment behind multiple
 * instances would need a shared store (e.g. Redis) instead.
 */
export function createRateLimiter({ windowMs, maxRequests, now = () => Date.now() }) {
  const requestsByKey = new Map();

  return {
    isLimited(key) {
      const currentTime = now();
      const timestamps = (requestsByKey.get(key) ?? []).filter(
        (timestamp) => currentTime - timestamp < windowMs,
      );
      timestamps.push(currentTime);
      requestsByKey.set(key, timestamps);
      return timestamps.length > maxRequests;
    },
  };
}
