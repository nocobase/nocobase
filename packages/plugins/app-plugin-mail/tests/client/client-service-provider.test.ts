import { defineClientPlugins } from '@nocobase/app-client/plugins';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import {
  apiClientToken,
  ClientApplication,
  createAppClientConfig,
  type ApiClient,
} from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';

import { MailClientServiceProvider } from '../../client/service-provider.js';
import { mailClientToken } from '../../client/runtime.js';

async function createApplication(): Promise<ClientApplication> {
  const runtime = await resolveAppRuntime(
    defineAppRuntime({
      packageName: '@test/mail-app',
      plugins: defineClientPlugins([]),
      createAppConfig: createAppClientConfig,
      serviceProviders: [MailClientServiceProvider],
    }),
  );
  return new ClientApplication({
    runtime,
    createRenderConfig: () => ({ routes: null }),
  });
}

describe('Mail client ServiceProvider', () => {
  it('owns a lazy client per application and preserves isolation across shutdown', async () => {
    const first = await createApplication();
    const second = await createApplication();
    await first.start();
    await second.start();
    try {
      expect(first.container.resolveIfCreated(mailClientToken)).toBeUndefined();
      expect(
        second.container.resolveIfCreated(mailClientToken),
      ).toBeUndefined();
      const firstApi = first.container.resolve(apiClientToken);
      const secondApi = second.container.resolve(apiClientToken);
      const firstRequest = vi
        .spyOn(firstApi, 'request')
        .mockImplementation((async () => ({
          data: [],
        })) as ApiClient['request']);
      const secondRequest = vi
        .spyOn(secondApi, 'request')
        .mockImplementation((async () => ({
          data: [],
        })) as ApiClient['request']);
      const firstMail = first.services.resolve(mailClientToken);
      const secondMail = second.services.resolve(mailClientToken);
      expect(firstMail).not.toBe(secondMail);
      expect(first.services.resolve(mailClientToken)).toBe(firstMail);
      await firstMail.listAccounts();
      expect(firstRequest).toHaveBeenCalledOnce();
      expect(secondRequest).not.toHaveBeenCalled();
      await first.shutdown();
      await secondMail.listAccounts();
      expect(secondRequest).toHaveBeenCalledOnce();
    } finally {
      await first.shutdown();
      await second.shutdown();
    }
  });
});
