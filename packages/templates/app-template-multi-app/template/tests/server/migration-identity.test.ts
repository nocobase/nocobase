import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { DEFAULT_ADMIN_CREDENTIALS } from '@nocobase/app-plugin-authentication/testing';
import { createMigrator, databaseManagerToken } from '@nocobase/db';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { trustedOrigins: ['http://localhost'] },
    secrets: {
      keys: [{ version: 1, key: randomBytes(32).toString('base64') }],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
    releases: { host: { enabled: false } },
  },
});

test('retains original task ownership and reuses executed history after package relocation', async ({
  app,
}) => {
  const database = app.container.resolve(databaseManagerToken);
  const migrator = createMigrator({
    database,
    connection: 'main',
    sources: [
      {
        packageName: 'app-example-multi-app',
        directory: path.resolve(
          import.meta.dirname,
          '../../database/main/migrations',
        ),
      },
    ],
  });
  const history = await migrator.history();
  expect(
    history.find((entry) => entry.name === '202610060001_create_device_code')
      ?.packageName,
  ).toBe('app-example-multi-app');
  const replay = await migrator.latest();
  expect(replay.executed).toEqual([]);
  expect(replay.warnings ?? []).toEqual([]);
});
