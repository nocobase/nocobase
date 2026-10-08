import { createAppPaths } from '@nocobase/app-server/config';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import plugin from '../../server/plugin.js';
import {
  mailProviderRegistryToken,
  mailRuntimeToken,
} from '../../server/tokens.js';
import { gmailMailProviderDefinition } from '../../server/adapters/gmail/definition.js';
import { microsoftMailProviderDefinition } from '../../server/adapters/microsoft/definition.js';
import { imapSmtpMailProviderDefinition } from '../../server/adapters/imap-smtp/definition.js';

describe('Mail built-in providers', () => {
  it('registers all built-ins through the Mail plugin without configuration or external connections', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const container = new ServiceContainer();
    const app = {
      appName: 'test',
      publicBasePath: '/test',
      config: { app: { name: 'test', publicBasePath: '/test' } },
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    };
    const providers = plugin.serviceProviders.map(
      (Provider) => new Provider(app),
    );
    try {
      for (const provider of providers) await provider.register();
      for (const provider of providers) await provider.boot();

      const registry = container.resolve(mailProviderRegistryToken);
      expect(registry.definitions()).toEqual([
        gmailMailProviderDefinition,
        microsoftMailProviderDefinition,
        imapSmtpMailProviderDefinition,
      ]);
      expect(container.resolveIfCreated(mailRuntimeToken)).toBeUndefined();
      expect(fetch).not.toHaveBeenCalled();

      const custom = { ...gmailMailProviderDefinition, type: 'custom-mail' };
      registry.register(custom);
      expect(registry.definition('custom-mail')).toBe(custom);
      expect(registry.definition('gmail')).toBe(gmailMailProviderDefinition);
    } finally {
      for (const provider of providers.toReversed()) await provider.shutdown();
      fetch.mockRestore();
    }
  });
});
