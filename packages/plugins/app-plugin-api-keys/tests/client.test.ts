import { describe, expect, it } from 'vitest';

import apiKeys from '../client/plugin.js';
import {
  API_KEY_EXPIRY_CHOICES,
  expiryChoiceToSeconds,
  formatKeyHint,
  isExpired,
} from '../client/expiry.js';

describe('@nocobase/app-plugin-api-keys Client', () => {
  it('contributes no pages', () => {
    const registration = apiKeys();

    expect(registration.serviceProviders).toEqual([]);
    expect(registration.routes).toEqual([]);
  });

  it('offers only lifetimes Better Auth accepts', () => {
    // Better Auth validates expiresIn in whole days against a 1..365 window.
    for (const choice of API_KEY_EXPIRY_CHOICES) {
      const seconds = expiryChoiceToSeconds(choice);
      if (seconds === undefined) continue;
      const days = seconds / 86_400;
      expect(days).toBeGreaterThanOrEqual(1);
      expect(days).toBeLessThanOrEqual(365);
      expect(Number.isInteger(days)).toBe(true);
    }
    expect(expiryChoiceToSeconds('never')).toBeUndefined();
    expect(expiryChoiceToSeconds('30')).toBe(2_592_000);
  });

  it('shows only the part of a key that was stored in the clear', () => {
    expect(formatKeyHint({ start: 'nb_abc', prefix: 'nb_' })).toBe('nb_abc…');
    expect(formatKeyHint({ start: null, prefix: 'nb_' })).toBe('nb_…');
    expect(formatKeyHint({ start: null, prefix: null })).toBe('—');
  });

  it('treats a key with no expiry as current', () => {
    const now = new Date('2026-09-15T00:00:00.000Z');

    expect(isExpired(null, now)).toBe(false);
    expect(isExpired('2026-09-14T23:59:59.000Z', now)).toBe(true);
    expect(isExpired('2026-09-15T00:00:01.000Z', now)).toBe(false);
  });
});
