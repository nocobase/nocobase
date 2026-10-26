import { randomBytes } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  config: {
    app: { sampleData: true, publicOrigin: 'http://localhost' },
    equipment: { samplePassword: randomBytes(24).toString('base64url') },
    auth: { secret: randomBytes(32).toString('hex') },
  },
});
test('fresh installation completes all synthetic assets, requests and stocktake observations', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken);
  const assets = await db
    .repository('equipmentAssets')
    .findMany({ limit: 200 });
  expect(assets).toHaveLength(100);
  expect(new Set(assets.map((row) => row.status)).size).toBe(5);
  expect(await db.repository('equipmentRequests').count()).toBeGreaterThan(0);
  expect(await db.repository('equipmentMaintenance').count()).toBeGreaterThan(
    0,
  );
  expect(await db.repository('equipmentStocktakes').count()).toBe(1);
  const items = await db.repository('equipmentStocktakeItems').findMany();
  expect(items.length).toBeGreaterThan(0);
  expect(items.every((row) => row.condition)).toBe(true);
});
