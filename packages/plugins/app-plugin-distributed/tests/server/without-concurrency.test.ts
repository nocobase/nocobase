import { cachingToken } from '@nocobase/app-server/caching';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import {
  collectDistributedStatus,
  importOptional,
} from '../../server/status.js';

// The concurrency package is present but fails while its module initializes.
vi.mock('@nocobase/app-plugin-concurrency/server', () => {
  throw new Error('concurrency failed to initialize');
});

function application(): AppPluginApplication {
  const container = new ServiceContainer();
  container.singleton(cachingToken as never, () => ({
    describe: () => ({
      default: 'memory',
      adapter: 'memory',
      sharing: 'local',
      registered: true,
    }),
  }));
  return {
    container,
    config: { get: () => undefined },
  } as unknown as AppPluginApplication;
}

function missing(name: string): Error {
  return Object.assign(
    new Error(`Cannot find package '${name}' imported from /app/server.js`),
    { code: 'ERR_MODULE_NOT_FOUND' },
  );
}

describe('the optional concurrency plugin', () => {
  it('logs a failure to load it and still serves the other services', async () => {
    const warn = vi.fn();

    const status = await collectDistributedStatus(application(), { warn });

    expect(
      status.services
        .filter(({ available }) => available)
        .map(({ key }) => key),
    ).toEqual(['caching']);
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'concurrency' }),
      'A service could not describe its backends.',
    );
  });

  it('is silent only when the package itself is not installed', async () => {
    const name = '@nocobase/app-plugin-concurrency';
    await expect(
      importOptional(() => Promise.reject(missing(name)), name),
    ).resolves.toBeUndefined();
    await expect(
      importOptional(() => Promise.reject(missing(`${name}/server`)), name),
    ).resolves.toBeUndefined();
    // A dependency the package lacks, or an error while it initializes, is reported.
    await expect(
      importOptional(() => Promise.reject(missing('ioredis')), name),
    ).rejects.toThrow("'ioredis'");
    await expect(
      importOptional(() => Promise.reject(new Error('boom')), name),
    ).rejects.toThrow('boom');
    await expect(
      importOptional(() => Promise.resolve({ ok: true }), name),
    ).resolves.toEqual({ ok: true });
  });
});
