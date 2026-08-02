import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isHoneypotFilled, isValidEmail } from '../src/validators.mjs';

test('isValidEmail accepts a well-formed address', () => {
  assert.equal(isValidEmail('demo@example.com'), true);
});

test('isValidEmail rejects missing @ sign', () => {
  assert.equal(isValidEmail('not-an-email'), false);
});

test('isValidEmail rejects non-string input', () => {
  assert.equal(isValidEmail(undefined), false);
  assert.equal(isValidEmail(null), false);
  assert.equal(isValidEmail(123), false);
});

test('isValidEmail rejects values longer than 254 characters', () => {
  const longLocal = 'a'.repeat(250);
  assert.equal(isValidEmail(`${longLocal}@example.com`), false);
});

test('isHoneypotFilled is false for empty or missing values', () => {
  assert.equal(isHoneypotFilled(''), false);
  assert.equal(isHoneypotFilled('   '), false);
  assert.equal(isHoneypotFilled(undefined), false);
});

test('isHoneypotFilled is true for any non-empty value', () => {
  assert.equal(isHoneypotFilled('I am a bot'), true);
});
