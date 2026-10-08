import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { createMailProviderRegistry } from '../../server/registry.js';
import { mailPushWebhookRoutes } from '../../server/routes/push-webhook.js';
import {
  mailProviderRegistryToken,
  mailRuntimeToken,
  mailStoreToken,
} from '../../server/tokens.js';
import type { MailProviderDefinition, MailStore } from '../../server/types.js';

const SECRET = 'push-webhook-secret-that-is-at-least-32-characters';

describe('Mail push webhook route', () => {
  it('rejects a missing URL secret without parsing the payload', async () => {
    const parse = vi.fn(() => ({
      ok: true as const,
      value: { notifications: [] },
    }));
    const { router } = await createRouter({ parse });

    const response = await router.request(
      '/mail/webhooks/test/company/wrong-secret',
      { method: 'POST' },
    );

    expect(response.status).toBe(401);
    expect(parse).not.toHaveBeenCalled();
  });

  it('echoes a Provider validation challenge as plain text', async () => {
    const { router } = await createRouter({
      parse: ({ query }) => ({
        ok: true,
        value: {
          challengeResponse: query.validationToken,
          notifications: [],
        },
      }),
    });

    const response = await router.request(
      `/mail/webhooks/test/company/${SECRET}?validationToken=opaque%20challenge`,
      { method: 'POST' },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    await expect(response.text()).resolves.toBe('opaque challenge');
  });

  it('validates client state and schedules one incremental sync per account', async () => {
    const schedulePushSyncBatch = vi.fn(async () => undefined);
    const { router } = await createRouter(
      {
        parse: () => ({
          ok: true,
          value: {
            notifications: [
              {
                providerSubscriptionId: 'subscription-1',
                clientState: SECRET,
              },
              {
                providerSubscriptionId: 'subscription-1',
                clientState: SECRET,
              },
            ],
          },
        }),
      },
      schedulePushSyncBatch,
    );

    const response = await router.request(
      `/mail/webhooks/test/company/${SECRET}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: [] }),
      },
    );

    expect(response.status).toBe(202);
    expect(schedulePushSyncBatch).toHaveBeenCalledTimes(1);
    expect(schedulePushSyncBatch).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'account-1' }),
    ]);
  });

  it('rejects a mismatched Provider client state', async () => {
    const schedulePushSyncBatch = vi.fn(async () => undefined);
    const { router } = await createRouter(
      {
        parse: () => ({
          ok: true,
          value: {
            notifications: [
              {
                providerSubscriptionId: 'subscription-1',
                clientState: 'wrong-state',
              },
            ],
          },
        }),
      },
      schedulePushSyncBatch,
    );

    const response = await router.request(
      `/mail/webhooks/test/company/${SECRET}`,
      { method: 'POST' },
    );

    expect(response.status).toBe(401);
    expect(schedulePushSyncBatch).not.toHaveBeenCalled();
  });

  it('rejects an oversized body even without a content-length header', async () => {
    const parse = vi.fn(() => ({
      ok: true as const,
      value: { notifications: [] },
    }));
    const { router } = await createRouter({ parse });

    const response = await router.request(
      `/mail/webhooks/test/company/${SECRET}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: 'x'.repeat(1_000_000) }),
      },
    );

    expect(response.status).toBe(413);
    expect(parse).not.toHaveBeenCalled();
  });
});

async function createRouter(
  push: NonNullable<MailProviderDefinition['push']>,
  schedulePushSyncBatch = vi.fn(async () => undefined),
): Promise<{ readonly router: Hono }> {
  const registry = createMailProviderRegistry().register({
    type: 'test',
    label: 'Test',
    capabilities: {
      receive: true,
      send: false,
      incrementalSync: true,
      pushNotifications: true,
      folders: false,
      labels: false,
      drafts: false,
      moveMessage: false,
      aliases: false,
    },
    push,
    createAdapter: async () => {
      throw new Error('Not used by webhook parsing.');
    },
  });
  const activeAccount = {
    id: 'account-1',
    userId: 'user-1',
    provider: { type: 'test', name: 'company' },
    address: 'user@example.com',
    credentialReference: 'credential-1',
    scopes: [],
    status: 'active' as const,
  };
  const store = {
    findPushSubscription: async () => ({
      accountId: 'account-1',
      provider: { type: 'test', name: 'company' },
      providerSubscriptionId: 'subscription-1',
      configurationFingerprint: 'fingerprint',
      renewAfter: '2099-01-01T00:00:00.000Z',
      expiresAt: '2099-01-02T00:00:00.000Z',
      updatedAt: '2026-09-07T00:00:00.000Z',
    }),
    getAccount: async () => activeAccount,
    findActiveAccountsForPush: async () => [activeAccount],
  } as unknown as MailStore;
  const container = new ServiceContainer();
  container.instance(mailProviderRegistryToken, registry);
  container.instance(mailStoreToken, store);
  container.instance(mailRuntimeToken, {
    start: () => undefined,
    scheduleAutomaticSync: () => undefined,
    createAutomaticSyncRuns: async () => 0,
    schedulePushSync: async () => false,
    schedulePushSyncBatch,
    kick: () => undefined,
    publishPending: async () => undefined,
    close: async () => undefined,
  });
  const config = new AppConfig();
  config.get = <TValue>(): TValue =>
    ({
      automaticSyncIntervalMs: 300_000,
      syncBatchSize: 100,
      pushWebhookSecret: SECRET,
      providers: { company: { type: 'test' } },
    }) as TValue;
  const contribution = await mailPushWebhookRoutes.createRouter({
    appName: 'test',
    publicBasePath: '/test',
    config,
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  });
  const router = new Hono();
  router.route('/', contribution);
  return { router };
}
