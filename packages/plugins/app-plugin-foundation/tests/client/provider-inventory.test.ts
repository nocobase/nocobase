import { describe, expect, it } from 'vitest';

import { withClientProviders } from '../../client/provider-inventory.js';
import type { FoundationProviderInventory } from '../../shared/foundation.js';

describe('browser-observed provider inventory', () => {
  it('includes client-only injected providers while preserving server evidence and category usage boundaries', () => {
    const inventory: FoundationProviderInventory = {
      entries: [
        {
          name: '@vendor/app-plugin-one',
          version: '1.2.3',
          installed: true,
          kind: 'plugin',
          origin: 'unverified',
          categories: [],
          registration: 'unknown',
          evidence: ['manifest'],
        },
      ],
      complete: true,
      unreadable: [],
    };
    const result = withClientProviders(inventory, [
      '@vendor/app-plugin-one',
      '@vendor/injected',
    ]);
    expect(result.entries).toHaveLength(2);
    expect(
      result.entries.find((entry) => entry.name === '@vendor/app-plugin-one'),
    ).toMatchObject({
      registration: 'observed',
      evidence: ['manifest', 'clientContribution'],
    });
    expect(
      result.entries.find((entry) => entry.name === '@vendor/injected'),
    ).toMatchObject({
      installed: false,
      version: null,
      registration: 'observed',
      categories: [],
      evidence: ['clientContribution'],
    });
    expect(inventory.entries[0]?.registration).toBe('unknown');
    expect(result.entries.some((entry) => 'status' in entry)).toBe(false);
  });
});
