import { describe, expect, it, vi } from 'vitest';
import { createMailProviderAdapterResolver } from '../../server/adapter-resolver.js';
import { createMailProviderRegistry } from '../../server/registry.js';
import type {
  MailAccount,
  MailProviderContext,
  MailProviderDefinition,
} from '../../server/types.js';

const account: MailAccount = {
  id: 'account',
  userId: 'alice',
  provider: { type: 'fixture', name: 'primary' },
  address: 'alice@example.com',
  credentialReference: 'private',
  scopes: [],
  status: 'active',
};
const context: MailProviderContext = {
  publicBasePath: '/app',
  credentials: {
    put: vi.fn(),
    get: vi.fn(),
    replace: vi.fn(),
    delete: vi.fn(),
    getOrRefresh: vi.fn(),
  },
};

describe('provider adapter resolution', () => {
  it('rejects an unregistered provider before attempting configuration lookup', async () => {
    const resolveConfig = vi.fn();
    const resolver = createMailProviderAdapterResolver({
      registry: createMailProviderRegistry(),
      context,
      resolveConfig,
    });
    await expect(resolver.resolve(account)).rejects.toThrow('not registered');
    expect(resolveConfig).not.toHaveBeenCalled();
  });

  it('validates resolved configuration before creating an adapter and propagates setup failure', async () => {
    const registry = createMailProviderRegistry();
    const capabilities = {
      receive: true,
      send: true,
      incrementalSync: false,
      pushNotifications: false,
      folders: false,
      labels: false,
      drafts: false,
      moveMessage: false,
      aliases: false,
    };
    const adapter = { identity: account.provider, capabilities };
    const validateConfig = vi.fn();
    const createAdapter = vi.fn<MailProviderDefinition['createAdapter']>(
      async () => adapter,
    );
    registry.register({
      type: 'fixture',
      label: 'Fixture',
      capabilities,
      validateConfig,
      createAdapter,
    });
    const config = { ...account.provider, enabled: false };
    const resolver = createMailProviderAdapterResolver({
      registry,
      context,
      resolveConfig: async () => config,
    });
    validateConfig.mockImplementationOnce(() => {
      throw new Error('Provider is disabled');
    });
    await expect(resolver.resolve(account)).rejects.toThrow(
      'Provider is disabled',
    );
    expect(createAdapter).not.toHaveBeenCalled();
    expect(await resolver.resolve(account)).toBe(adapter);
    expect(validateConfig).toHaveBeenCalledWith(config);
    expect(createAdapter).toHaveBeenCalledWith(context, config, account);
    const defaultResolver = createMailProviderAdapterResolver({
      registry,
      context,
    });
    expect(await defaultResolver.resolve(account)).toBe(adapter);
    expect(createAdapter).toHaveBeenLastCalledWith(
      context,
      account.provider,
      account,
    );
    createAdapter.mockRejectedValueOnce(new Error('Credential unavailable'));
    await expect(defaultResolver.resolve(account)).rejects.toThrow(
      'Credential unavailable',
    );
  });
});
