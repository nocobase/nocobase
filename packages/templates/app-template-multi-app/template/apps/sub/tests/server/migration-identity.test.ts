import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { DEFAULT_ADMIN_CREDENTIALS } from '@nocobase/app-plugin-authentication/testing';
import {
  createMigrator,
  createSeeder,
  databaseManagerToken,
} from '@nocobase/db';
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
        packageName: 'app-template-reagents',
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
  ).toBe('app-template-reagents');
  const replay = await migrator.latest();
  expect(replay.executed).toEqual([]);
  expect(replay.warnings ?? []).toEqual([]);
  const settings = database.connection().repository('labSettings');
  await settings.updateOne({
    filter: { id: 'default' },
    values: { manager: 'Retained owner', revision: 7 },
  });
  const seeder = createSeeder({
    database,
    connection: 'main',
    sources: [
      {
        packageName: 'app-template-reagents',
        directory: path.resolve(
          import.meta.dirname,
          '../../database/main/seeds',
        ),
      },
    ],
  });
  expect(
    (await seeder.history()).find(
      (entry) => entry.name === '202611040201_lab_settings',
    )?.packageName,
  ).toBe('app-template-reagents');
  const seeded = await seeder.run();
  expect(seeded.executed).toEqual([]);
  expect(seeded.warnings ?? []).toEqual([]);
  expect(await settings.findOne({ filter: { id: 'default' } })).toMatchObject({
    manager: 'Retained owner',
    revision: 7,
  });
});
