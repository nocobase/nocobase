import { describe, expect, it } from 'vitest';

import { availableCapabilities } from '../../shared/available-capabilities.js';
import type {
  FoundationCapability,
  FoundationProviderEntry,
  FoundationProviderInventory,
} from '../../shared/foundation.js';

const observation = (
  key: string,
  status: FoundationCapability['status'],
): FoundationCapability => ({
  key,
  status,
  facts: [],
  metrics: [],
  parts: [],
  packages: [],
  completeness: 'complete',
  issues: [],
});
const extension = (name: string): FoundationProviderEntry => ({
  name,
  displayName: 'Pro approval',
  version: '1.2.3',
  installed: true,
  kind: 'plugin',
  origin: 'unverified',
  registration: 'observed',
  evidence: ['serverRegistration'],
  categories: [],
});
const inventory = (
  entries: readonly FoundationProviderEntry[],
): FoundationProviderInventory => ({
  entries,
  complete: true,
  unreadable: [],
  serverRegistrationsComplete: true,
});

describe('runtime capability band', () => {
  it('grows and shrinks with injected plugins without a predefined capability key or category', () => {
    const observations = [observation('dataModeling', 'active')];
    const pro = extension('@nocobase/app-plugin-new-pro-capability');
    const thirdParty = extension('@vendor/new-extension');
    expect(availableCapabilities(observations, inventory([]))).toHaveLength(1);
    expect(
      availableCapabilities(
        observations,
        inventory(
          Array.from({ length: 17 }, (_, index) =>
            extension(`@vendor/extension-${index}`),
          ),
        ),
      ),
    ).toHaveLength(18);
    const items = availableCapabilities(
      observations,
      inventory([pro, thirdParty]),
    );
    expect(items.map(({ key }) => key)).toEqual([
      'dataModeling',
      `extension:${pro.name}`,
      `extension:${thirdParty.name}`,
    ]);
    expect(items[1]).toMatchObject({
      title: 'Pro approval',
      status: null,
      reason: 'unrecognizedExtension',
      packages: [{ name: pro.name, version: '1.2.3' }],
    });
    expect(availableCapabilities(observations, inventory([pro]))).toHaveLength(
      2,
    );
    expect(availableCapabilities(observations, inventory([]))).toHaveLength(1);
  });

  it('keeps recognized installed providers unused without counting unknown installed-only extensions or stale usage', () => {
    const installed = {
      ...extension('@vendor/installed'),
      registration: 'unknown' as const,
      evidence: ['manifest' as const],
    };
    const observations = [
      observation('dataModeling', 'active'),
      observation('permissions', 'active'),
      observation('knowledge', 'unused'),
    ];
    const clientOnly = {
      ...extension('@vendor/client-only'),
      categories: ['permissions'],
      evidence: ['clientContribution' as const],
    };
    const items = availableCapabilities(
      observations,
      inventory([installed, clientOnly]),
    );
    expect(items.map(({ key }) => key)).toEqual([
      'dataModeling',
      'permissions',
    ]);
    expect(items[1]).toMatchObject({
      status: 'unused',
      reason: 'installedNotUsed',
    });
  });

  it('shows installed Agents as unused until registered, then uses its configuration findings and removes it after uninstalling', () => {
    const agents: FoundationProviderEntry = {
      ...extension('@nocobase/app-plugin-agents'),
      origin: 'nocobase',
      registration: 'unknown',
      categories: ['aiAgents'],
      evidence: ['manifest'],
    };
    const unused = observation('aiAgents', 'unused');
    expect(availableCapabilities([unused], inventory([agents]))).toMatchObject([
      { key: 'aiAgents', status: 'unused', reason: 'installedNotUsed' },
    ]);
    const registered = {
      ...agents,
      registration: 'observed' as const,
      evidence: ['serverRegistration' as const],
    };
    expect(
      availableCapabilities(
        [observation('aiAgents', 'needsSetup')],
        inventory([registered]),
      )[0]?.status,
    ).toBe('needsSetup');
    expect(
      availableCapabilities(
        [observation('aiAgents', 'active')],
        inventory([registered]),
      )[0]?.status,
    ).toBe('active');
    expect(
      availableCapabilities(
        [observation('aiAgents', 'active')],
        inventory([agents]),
      )[0]?.status,
    ).toBe('unused');
    expect(
      availableCapabilities(
        [unused],
        inventory([{ ...agents, installed: false }]),
      ),
    ).toEqual([]);
  });

  it('does not guess an unused status when installed capability collection failed', () => {
    const agents: FoundationProviderEntry = {
      ...extension('@nocobase/app-plugin-agents'),
      registration: 'unknown',
      categories: ['aiAgents'],
      evidence: ['manifest'],
    };
    expect(
      availableCapabilities(
        [observation('aiAgents', null)],
        inventory([agents]),
      )[0]?.status,
    ).toBeNull();
  });

  it('keeps a registered but unused capability and counts several providers in one supported category once', () => {
    const providers = [extension('@vendor/one'), extension('@vendor/two')].map(
      (entry) => ({ ...entry, categories: ['mail'] }),
    );
    const items = availableCapabilities(
      [observation('mail', 'unused')],
      inventory(providers),
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe('unused');
  });
});
