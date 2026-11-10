import { beforeEach, expect, it } from 'vitest';
import { createTestApp } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';
import { events } from '../fixtures/module/plugin.js';
import { modulesServiceToken } from '../../server/index.js';
beforeEach(() => {
  events.length = 0;
});
it('runs a registered module and both connections without commercial management', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    connections: ['main', 'audit'],
  });
  try {
    expect(events).toEqual(['main:1', 'audit:1']);
    await expect(
      app.application.container
        .resolve(modulesServiceToken)
        .requireAvailable('fixture'),
    ).resolves.toBeUndefined();
  } finally {
    await app.close();
  }
  expect(events).toEqual(['main:1', 'audit:1', 'stop']);
});
it.each(['migrations', 'seeds'])(
  'blocks startup when a required connection skips %s',
  async (kind) => {
    await expect(
      createTestApp({
        createServer: createStandaloneServer,
        connections: ['main', 'audit'],
        config: {
          database: { connections: { audit: { [kind]: { autoRun: false } } } },
        },
      }),
    ).rejects.toThrow(
      kind === 'migrations' ? 'Database seeds failed' : 'requires completed',
    );
    expect(events).toEqual([]);
  },
);
