// @vitest-environment node
import { createTestApp } from '@nocobase/app-testing/server';
import { JobsBackendNotRegisteredError } from '@nocobase/jobs';
import { expect, it } from 'vitest';
import { createStandaloneServer } from './fixtures/indexing-app/server/standalone.js';

it('does not degrade a selected unregistered indexing backend into unavailable indexing', async () => {
  const starting = createTestApp({
    createServer: createStandaloneServer,
    config: {
      jobs: {
        default: 'memory',
        memory: { adapter: 'memory' },
        commercial: {
          adapter: 'redis',
          connection: { host: '127.0.0.1', port: 1 },
        },
      },
      knowledge: { jobs: 'commercial' },
    },
  });
  try {
    await expect(starting).rejects.toThrow(JobsBackendNotRegisteredError);
  } finally {
    const started = await starting.catch(() => undefined);
    await started?.close();
  }
});
