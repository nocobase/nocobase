import {
  ServiceContainer,
  type ServiceToken,
} from '@nocobase/service-provider';
import { createAppPaths } from '@nocobase/app-server/config';
import {
  realtimeServiceToken,
  type RealtimeService,
} from '@nocobase/app-server/realtime';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { MailCoreProvider } from '../../server/providers/mail-core.js';
import {
  mailCredentialVaultToken,
  mailProviderRegistryToken,
  mailProviderAdapterResolverToken,
  mailRuntimeToken,
  mailServiceToken,
  mailStoreToken,
} from '../../server/tokens.js';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { mailOutboundAttachmentStorageToken } from '../../server/tokens.js';
import type { MailCredentialVault } from '../../server/types.js';

describe('@nocobase/app-plugin-mail', () => {
  it('registers the Provider Registry and lazy Mail runtime services', () => {
    const container = new ServiceContainer();
    const provider = new MailCoreProvider({
      appName: 'test',
      publicBasePath: '/test',
      config: { app: { name: 'test', publicBasePath: '/test' } },
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    });

    expect(provider.name).toBe('@nocobase/app-plugin-mail');
    provider.register();

    expect(container.has(mailProviderRegistryToken)).toBe(true);
    expect(container.has(mailProviderAdapterResolverToken)).toBe(true);
    expect(container.has(mailRuntimeToken)).toBe(true);
    expect(container.has(mailServiceToken)).toBe(true);
    expect(container.has(mailStoreToken)).toBe(true);
    expect(container.has(mailCredentialVaultToken)).toBe(true);
  });

  it('keeps a credential vault registered by another plugin', () => {
    const container = new ServiceContainer();
    const credentialVault = {} as MailCredentialVault;
    container.instance(mailCredentialVaultToken, credentialVault);
    const provider = new MailCoreProvider({
      appName: 'test',
      publicBasePath: '/test',
      config: { app: { name: 'test', publicBasePath: '/test' } },
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    });

    provider.register();

    expect(container.resolve(mailCredentialVaultToken)).toBe(credentialVault);
  });

  it.each([
    { early: true, configured: true },
    { early: false, configured: true },
    { early: true, configured: false },
    { early: false, configured: false },
  ])(
    'publishes from a service resolved before boot (early=%s, configured=%s)',
    async ({ early, configured }) => {
      const publishFor = vi.fn();
      const close = vi.fn();
      const container = new ServiceContainer();
      const provider = new MailCoreProvider({
        appName: 'test',
        publicBasePath: '/test',
        config: {
          get: () =>
            configured
              ? { automaticSyncIntervalMs: 300000, syncBatchSize: 100 }
              : undefined,
        } as never,
        paths: createAppPaths({ rootDir: '/missing' }),
        router: new Hono(),
        container,
      });
      provider.register();
      container.instance(realtimeServiceToken, {
        defineTopic: () => ({ publishFor, close }),
      } as unknown as RealtimeService);
      const logger = {
        child: () => logger,
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };
      container.instance(loggingToken, { getLogger: () => logger } as never);
      container.instance(userAdministrationServiceToken, {} as never);
      const dependencies = new Map<unknown, unknown>([
        [
          mailStoreToken,
          {
            getAccount: async () => ({
              id: 'account',
              userId: 'owner',
              status: 'active',
            }),
            getMessage: async () => ({
              id: 'message',
              accountId: 'account',
              providerMessageId: 'remote',
            }),
            updateMessageState: async () => ({
              id: 'message',
              accountId: 'account',
              note: 'note',
            }),
          },
        ],
        [mailProviderAdapterResolverToken, {}],
        [mailRuntimeToken, { close: async () => undefined }],
        [mailCredentialVaultToken, {}],
        [mailOutboundAttachmentStorageToken, {}],
      ]);
      const resolve = container.resolve.bind(container);
      vi.spyOn(container, 'resolve').mockImplementation(
        <T>(token: ServiceToken<T>): T =>
          dependencies.has(token)
            ? (dependencies.get(token) as T)
            : resolve(token),
      );
      if (!early) await provider.boot();
      const service = container.resolve(mailServiceToken);
      if (early) await provider.boot();
      await service.updateMessage(
        { actorId: 'owner' },
        { accountId: 'account', messageId: 'message', note: 'note' },
      );
      expect(publishFor).toHaveBeenCalledWith('owner', {
        kind: 'mail.changed',
      });
      await provider.shutdown();
      publishFor.mockClear();
      await service.updateMessage(
        { actorId: 'owner' },
        { accountId: 'account', messageId: 'message', note: 'note' },
      );
      expect(publishFor).not.toHaveBeenCalled();
    },
  );

  describe('background jobs', () => {
    const createRuntime = (
      sections: Record<string, unknown>,
      jobsService: boolean,
    ) => {
      const container = new ServiceContainer();
      const dependencies = new Map<unknown, unknown>([
        [mailStoreToken, {}],
        [mailProviderAdapterResolverToken, {}],
        [mailCredentialVaultToken, {}],
        [mailOutboundAttachmentStorageToken, {}],
      ]);
      const resolve = container.resolve.bind(container);
      vi.spyOn(container, 'resolve').mockImplementation(
        <T>(token: ServiceToken<T>): T =>
          dependencies.has(token)
            ? (dependencies.get(token) as T)
            : resolve(token),
      );
      const logger = { child: () => logger, warn: vi.fn() };
      container.instance(loggingToken, { getLogger: () => logger } as never);
      const getJobExecutor = vi.fn((_scope: string, _name?: string) => ({
        registerJob: vi.fn(),
        subscribe: vi.fn(() => () => undefined),
      }));
      if (jobsService)
        container.instance(jobExecutorServiceToken, {
          getJobExecutor,
        } as never);
      new MailCoreProvider({
        appName: 'test',
        publicBasePath: '/test',
        config: { get: (key: string) => sections[key] } as never,
        paths: createAppPaths({ rootDir: '/missing' }),
        router: new Hono(),
        container,
      }).register();
      return {
        getJobExecutor,
        resolveRuntime: () => container.resolve(mailRuntimeToken),
      };
    };

    it('requires the application jobs service', () => {
      const { resolveRuntime } = createRuntime({}, false);
      expect(resolveRuntime).toThrow(
        'Add JobExecutorServiceProvider from @nocobase/app-server/jobs',
      );
    });

    it('runs on its own scope of jobs.default when mail.jobs is left out', () => {
      const { getJobExecutor, resolveRuntime } = createRuntime(
        {
          mail: {},
          jobs: { default: 'memory', memory: { adapter: 'memory' } },
        },
        true,
      );
      resolveRuntime();
      expect(getJobExecutor).toHaveBeenCalledWith(
        '@nocobase/app-plugin-mail',
        undefined,
      );
    });

    it('runs on the jobs configuration mail.jobs names', () => {
      const { getJobExecutor, resolveRuntime } = createRuntime(
        {
          mail: { jobs: 'mail' },
          jobs: { default: 'memory', mail: { adapter: 'memory' } },
        },
        true,
      );
      resolveRuntime();
      expect(getJobExecutor).toHaveBeenCalledWith(
        '@nocobase/app-plugin-mail',
        'mail',
      );
    });

    it.each(['typo', 'default'])(
      'refuses to start when mail.jobs names "%s"',
      (name) => {
        const { getJobExecutor, resolveRuntime } = createRuntime(
          {
            mail: { jobs: name },
            jobs: { default: 'memory', memory: { adapter: 'memory' } },
          },
          true,
        );
        expect(resolveRuntime).toThrow(
          `mail.jobs names "${name}", which is not a jobs configuration.`,
        );
        expect(getJobExecutor).not.toHaveBeenCalled();
      },
    );
  });

  it('registers a user-scoped realtime topic for message changes', async () => {
    const close = vi.fn();
    const defineTopic = vi.fn(() => ({ publishFor: vi.fn(), close }));
    const container = new ServiceContainer();
    container.instance(realtimeServiceToken, {
      defineTopic,
    } as unknown as RealtimeService);
    const provider = new MailCoreProvider({
      appName: 'test',
      publicBasePath: '/test',
      config: { app: { name: 'test', publicBasePath: '/test' } },
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    });

    provider.register();
    await provider.boot();

    expect(defineTopic).toHaveBeenCalledWith('mail:messages', {
      audience: 'user',
    });

    await provider.shutdown();
    expect(close).toHaveBeenCalledOnce();
  });
});
