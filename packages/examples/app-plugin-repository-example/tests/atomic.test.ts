// @vitest-environment node
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFixture } from './helpers.js';
import {
  ATOMIC_REPOSITORY,
  atomicRepository,
  atomicUpdate,
} from '../client/atomic.js';

describe('Atomic numeric updates through Repository HTTP', () => {
  let f: Awaited<ReturnType<typeof createFixture>>;
  beforeEach(async () => {
    f = await createFixture();
    await f.database
      .createSeeder({
        directory: path.resolve(import.meta.dirname, '../database/seeds'),
        packageName: '@nocobase/app-plugin-repository-example',
      })
      .run();
  });
  afterEach(async () => {
    await f.destroy();
  });
  it('increments, multiplies, guards deductions, and preserves SQL values under concurrent requests', async () => {
    const repo = atomicRepository(f.api);
    expect(
      (await repo.updateOne(atomicUpdate('demo-stock', { increment: 5 })))
        .record.value,
    ).toBe(125);
    expect(
      (await repo.updateOne(atomicUpdate('demo-wallet', { decrement: 500 })))
        .record.value,
    ).toBe(49500);
    expect(
      (await repo.updateOne(atomicUpdate('demo-points', { multiply: 2 })))
        .record.value,
    ).toBe(200);
    await expect(
      repo.updateOne(atomicUpdate('demo-wallet', { decrement: 50000 })),
    ).rejects.toMatchObject({ status: 404 });
    expect((await repo.findOne({ filter: { id: 'demo-wallet' } }))?.value).toBe(
      49500,
    );
    await Promise.all(
      Array.from({ length: 20 }, () =>
        repo.updateOne(atomicUpdate('demo-visits', { increment: 1 })),
      ),
    );
    expect((await repo.findOne({ filter: { id: 'demo-visits' } }))?.value).toBe(
      20,
    );
    const seeder = f.database.createSeeder({
      directory: path.resolve(import.meta.dirname, '../database/seeds'),
      packageName: '@nocobase/app-plugin-repository-example',
    });
    expect((await seeder.run()).executed).toEqual([]);
    expect((await repo.findOne({ filter: { id: 'demo-visits' } }))?.value).toBe(
      20,
    );
  });
  it('allows only one of two competing guarded deductions from the last unit', async () => {
    const repo = atomicRepository(f.api);
    await repo.updateOne(atomicUpdate('demo-stock', { decrement: 119 }));
    const results = await Promise.allSettled([
      repo.updateOne(atomicUpdate('demo-stock', { decrement: 1 })),
      repo.updateOne(atomicUpdate('demo-stock', { decrement: 1 })),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect((await repo.findOne({ filter: { id: 'demo-stock' } }))?.value).toBe(
      0,
    );
  });
  it('rejects unauthenticated actions and invalid fractional integer updates', async () => {
    for (const action of [
      'findMany',
      'findOne',
      'count',
      'exists',
      'createOne',
      'updateOne',
      'deleteOne',
    ]) {
      const response = await f.router.request(
        `/main/api/${ATOMIC_REPOSITORY}/${action}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        },
      );
      expect(response.status).toBe(401);
    }
    await expect(
      atomicRepository(f.api).updateOne(
        atomicUpdate('demo-stock', { increment: 1.5 }),
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(
      (await atomicRepository(f.api).findOne({ filter: { id: 'demo-stock' } }))
        ?.value,
    ).toBe(120);
  });
});
