import { cachingToken } from '@nocobase/app-server/caching';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';

import { collectDistributedStatus } from '../../server/status.js';

// An application that does not install the optional concurrency plugin: importing it fails.
vi.mock('@nocobase/app-plugin-concurrency/server', () => {
  throw new Error("Cannot find package '@nocobase/app-plugin-concurrency'");
});

it('serves the status without the optional concurrency plugin', async () => {
  const container = new ServiceContainer();
  container.singleton(cachingToken as never, () => ({
    describe: () => ({
      default: 'memory',
      adapter: 'memory',
      sharing: 'local',
      registered: true,
    }),
  }));
  const app = {
    container,
    config: { get: () => undefined },
  } as unknown as AppPluginApplication;

  const status = await collectDistributedStatus(app);

  expect(
    status.services.filter(({ available }) => available).map(({ key }) => key),
  ).toEqual(['caching']);
  expect(
    status.services.find(({ key }) => key === 'concurrency'),
  ).toMatchObject({ available: false });
});
