/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Mutex, tryAcquire } from 'async-mutex';

import { LockManager, LockAcquireError } from '../lock-manager';

function sleep(ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('lock manager', () => {
  describe.skip('mutex example', () => {
    it('acquire and release', async () => {
      const order = [];
      const lock = new Mutex();
      const release1 = await lock.acquire();
      order.push(1);
      expect(release1).toBeDefined();
      expect(lock.isLocked()).toBe(true);
      setTimeout(async () => {
        order.push(2);
        await lock.release();
        order.push(3);
        expect(lock.isLocked()).toBe(true);
      }, 200);
      order.push(4);
      const release2 = await lock.acquire();
      order.push(5);
      expect(lock.isLocked()).toBe(true);
      await release2();
      order.push(6);
      expect(lock.isLocked()).toBe(false);
      expect(order).toEqual([1, 4, 2, 3, 5, 6]);
    });

    it('tryAcquire', async () => {
      const order = [];
      const lock = new Mutex();
      const l1 = tryAcquire(lock);
      expect(l1.isLocked()).toBe(false);
      const release1 = await lock.acquire();
      expect(lock.isLocked()).toBe(true);
      const l2 = tryAcquire(lock);
      await expect(async () => {
        const r2 = await l2.acquire();
      }).rejects.toThrow();
      await release1();
    });
  });

  describe('local lock', () => {
    const lockManager = new LockManager();

    it('acquire and release', async () => {
      const order = [];
      const r1 = await lockManager.acquire('test');
      order.push(1);
      setTimeout(async () => {
        order.push(2);
        await r1();
        order.push(3);
      }, 200);
      order.push(4);
      const r2 = await lockManager.acquire('test');
      order.push(5);
      await r2();
      order.push(6);
      expect(order).toEqual([1, 4, 2, 3, 5, 6]);
    });

    it('acquire and release with timeout', async () => {
      const order = [];
      const r1 = await lockManager.acquire('test', 200);
      order.push(1);
      setTimeout(async () => {
        order.push(2);
        await r1();
        order.push(3);
      }, 400);
      order.push(4);
      const r2 = await lockManager.acquire('test', 200);
      order.push(5);
      await sleep(300);
      await r2();
      order.push(6);
      expect(order).toEqual([1, 4, 5, 2, 3, 6]);
    });

    it('runExclusive', async () => {
      const order = [];
      setTimeout(async () => {
        await lockManager.runExclusive('test', async () => {
          order.push(1);
          await sleep(100);
          order.push(2);
        });
      }, 100);
      order.push(3);
      await lockManager.runExclusive('test', async () => {
        order.push(4);
        await sleep(400);
        order.push(5);
      });
      order.push(6);
      await sleep(200);
      expect(order).toEqual([3, 4, 5, 1, 6, 2]);
    });

    it('runExclusive with timeout', async () => {
      const order = [];
      setTimeout(async () => {
        await lockManager.runExclusive(
          'test',
          async () => {
            order.push(1);
            await sleep(200);
            order.push(2);
          },
          200,
        );
      }, 100);
      order.push(3);
      await lockManager.runExclusive(
        'test',
        async () => {
          order.push(4);
          await sleep(400);
          order.push(5);
        },
        200,
      );
      order.push(6);
      await sleep(200);
      expect(order).toEqual([3, 4, 5, 1, 6, 2]);
    });

    it('tryAcquire', async () => {
      const release = await lockManager.acquire('test');
      await expect(lockManager.tryAcquire('test')).rejects.toThrowError(LockAcquireError);
      await release();
      const lock = await lockManager.tryAcquire('test');
      expect(lock.acquire).toBeTypeOf('function');
      expect(lock.runExclusive).toBeTypeOf('function');

      const order = [];
      const r1 = await lock.acquire(200);
      order.push(1);
      setTimeout(async () => {
        order.push(2);
        await r1();
        order.push(3);
      }, 100);
      const r2 = await lock.acquire(200);
      order.push(4);
      await sleep(300);
      await r2();
      expect(order).toEqual([1, 2, 3, 4]);
    });

    it('tryAcquire: only one concurrent caller wins (TOCTOU race)', async () => {
      // Simulate two nodes calling tryAcquire at the same time (single-process,
      // like createMockCluster). Only one should succeed; the other must throw.
      const results: Array<'acquired' | 'skipped'> = [];
      await Promise.all(
        [0, 1].map(async () => {
          try {
            const lock = await lockManager.tryAcquire('race-test');
            const release = await lock.acquire(1000);
            results.push('acquired');
            await release();
          } catch (e) {
            if (e instanceof LockAcquireError) {
              results.push('skipped');
            } else {
              throw e;
            }
          }
        }),
      );
      expect(results.filter((r) => r === 'acquired').length).toBe(1);
      expect(results.filter((r) => r === 'skipped').length).toBe(1);
    });

    it('tryAcquire: waits up to timeout ms before throwing when lock is held', async () => {
      // Acquire the lock manually so it is held during the tryAcquire call.
      const holdRelease = await lockManager.acquire('wait-test');

      // Release the lock after 100 ms — tryAcquire with timeout=200 should
      // succeed because the lock becomes available within the window.
      setTimeout(() => holdRelease(), 100);
      const lock = await lockManager.tryAcquire('wait-test', 200);
      const release = await lock.acquire(1000);
      await release();
    });

    it('tryAcquire: throws LockAcquireError when timeout expires before lock is released', async () => {
      const holdRelease = await lockManager.acquire('timeout-test');
      // Lock is held; tryAcquire with a very short timeout should fail.
      await expect(lockManager.tryAcquire('timeout-test', 50)).rejects.toThrowError(LockAcquireError);
      await holdRelease();
    });

    it('tryAcquire: subsequent call succeeds after previous lock is released', async () => {
      const lock1 = await lockManager.tryAcquire('seq-test');
      const release = await lock1.acquire(1000);
      await release();
      // After release, a second tryAcquire on the same key should succeed
      const lock2 = await lockManager.tryAcquire('seq-test');
      const release2 = await lock2.acquire(1000);
      await release2();
    });
  });
});
