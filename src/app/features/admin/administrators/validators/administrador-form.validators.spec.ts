import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { passwordPolicyValidator } from './administrador-form.validators';

describe('passwordPolicyValidator', () => {
  it('returns null for an empty value (delegated to Validators.required)', () => {
    expect(passwordPolicyValidator(new FormControl(''))).toBeNull();
  });

  it('returns null for a password meeting every rule', () => {
    expect(passwordPolicyValidator(new FormControl('SegurA123456'))).toBeNull();
  });

  it('returns passwordPolicy when shorter than 12 characters', () => {
    expect(passwordPolicyValidator(new FormControl('Ab1defghi'))).toEqual({
      passwordPolicy: true,
    });
  });

  it('returns passwordPolicy when missing a lowercase letter', () => {
    expect(passwordPolicyValidator(new FormControl('SEGURA123456'))).toEqual({
      passwordPolicy: true,
    });
  });

  it('returns passwordPolicy when missing an uppercase letter', () => {
    expect(passwordPolicyValidator(new FormControl('segura123456'))).toEqual({
      passwordPolicy: true,
    });
  });

  it('returns passwordPolicy when missing a digit', () => {
    expect(passwordPolicyValidator(new FormControl('SeguraSegura'))).toEqual({
      passwordPolicy: true,
    });
  });

  it('accepts a password at exactly 72 ASCII bytes', () => {
    const password = `Aa1${'x'.repeat(69)}`;
    expect(password.length).toBe(72);
    expect(passwordPolicyValidator(new FormControl(password))).toBeNull();
  });

  it('rejects a password at 73 ASCII bytes', () => {
    const password = `Aa1${'x'.repeat(70)}`;
    expect(password.length).toBe(73);
    expect(passwordPolicyValidator(new FormControl(password))).toEqual({ passwordPolicy: true });
  });

  it('rejects a password under 72 characters but over 72 bytes due to multi-byte UTF-8 characters', () => {
    // 'á' is 2 bytes in UTF-8; 36 of them + "Aa1" = 39 chars but 3 + 72 = 75 bytes.
    const password = `Aa1${'á'.repeat(36)}`;
    expect(password.length).toBe(39);
    expect(passwordPolicyValidator(new FormControl(password))).toEqual({ passwordPolicy: true });
  });
});
