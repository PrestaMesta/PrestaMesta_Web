import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRateLimiter } from '../src/rate-limiter.mjs';

test('allows requests under the limit', () => {
  let currentTime = 0;
  const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 3, now: () => currentTime });

  assert.equal(limiter.isLimited('1.2.3.4'), false);
  assert.equal(limiter.isLimited('1.2.3.4'), false);
  assert.equal(limiter.isLimited('1.2.3.4'), false);
});

test('blocks requests once the limit is exceeded within the window', () => {
  let currentTime = 0;
  const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 2, now: () => currentTime });

  limiter.isLimited('1.2.3.4');
  limiter.isLimited('1.2.3.4');
  assert.equal(limiter.isLimited('1.2.3.4'), true);
});

test('resets once the window has passed', () => {
  let currentTime = 0;
  const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1, now: () => currentTime });

  limiter.isLimited('1.2.3.4');
  assert.equal(limiter.isLimited('1.2.3.4'), true);

  currentTime += 1001;
  assert.equal(limiter.isLimited('1.2.3.4'), false);
});

test('tracks different keys independently', () => {
  let currentTime = 0;
  const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1, now: () => currentTime });

  limiter.isLimited('1.1.1.1');
  assert.equal(limiter.isLimited('2.2.2.2'), false);
});
