// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';

describe('App initialization transaction', () => {
  let harness: Harness;
  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({ id: 'test', name: 'Test', driver: 'fake' });
  });
  afterEach(() => harness.close());
  it('rolls back creation and publishes no app.created event when initialization fails', async () => {
    const admin = await harness.as('admin', 'admin');
    await expect(
      harness.services.releases.createApp(
        admin,
        { id: 'shop', name: 'Shop', environmentId: 'test' },
        {
          initialize: async (connection, appId) => {
            expect(
              await connection.query
                .selectFrom('relApps')
                .select('id')
                .where('id', '=', appId)
                .executeTakeFirst(),
            ).toMatchObject({ id: 'shop' });
            throw new Error('Application initialization failed');
          },
        },
      ),
    ).rejects.toThrow('Application initialization failed');
    expect(await harness.services.releases.findApp('shop')).toBeNull();
    expect(harness.events.some((event) => event.type === 'app.created')).toBe(
      false,
    );
    const app = await harness.services.releases.createApp(admin, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'test',
    });
    expect(app.app.id).toBe('shop');
    expect(
      harness.events.filter((event) => event.type === 'app.created'),
    ).toHaveLength(1);
  });
});
