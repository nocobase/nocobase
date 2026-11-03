import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';
import { AgentsProvider } from '../server/providers/agents.js';
import { agentsToken } from '../server/tokens.js';

function provider(vectors: unknown) {
  const container = new ServiceContainer();
  return {
    container,
    provider: new AgentsProvider({
      container,
      config: { get: () => ({ vectors }) },
    } as unknown as AppPluginApplication),
  };
}

it.each([undefined, { store: false }])(
  'accepts absent or explicitly disabled legacy configuration (%j)',
  (vectors) => {
    const h = provider(vectors);
    expect(() => h.provider.register()).not.toThrow();
    expect(h.container.has(agentsToken)).toBe(true);
  },
);

it('never reads disabled store connection settings', () => {
  const h = provider({
    store: false,
    get url() {
      throw new Error('Disabled connection must not be read');
    },
    get path() {
      throw new Error('Disabled path must not be read');
    },
  });
  expect(() => h.provider.register()).not.toThrow();
});

it.each([
  null,
  false,
  true,
  'pgvector',
  {},
  { store: 'sqlite-vec' },
  { store: 'pgvector' },
])(
  'rejects active or invalid legacy configuration before registering services (%j)',
  (vectors) => {
    const h = provider(vectors);
    expect(() => h.provider.register()).toThrow(
      /vector collections have been removed.*docs\/vectors-migration.md/,
    );
    expect(h.container.has(agentsToken)).toBe(false);
  },
);

it('does not include connection values in the upgrade error', () => {
  const h = provider({
    store: 'pgvector',
    url: 'postgres://fixture:private-value@invalid/fixture',
  });
  try {
    h.provider.register();
    throw new Error('Expected configuration rejection');
  } catch (error) {
    expect(String(error)).toContain('vector collections have been removed');
    expect(String(error)).not.toContain('private-value');
    expect(String(error)).not.toContain('postgres://');
  }
});
