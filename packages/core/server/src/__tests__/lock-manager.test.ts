/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Mutex, withTimeout } from 'async-mutex';

import { Application } from '../application';

function sleep(ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('lock manager', () => {
  describe.skip('mutex example', () => {
    it('mutex', async () => {
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

    it.skip('with timeout', async () => {
      const lock = withTimeout(new Mutex(), 200);
      const r1 = await lock.acquire();
      expect(lock.isLocked()).toBe(true);
      const l2 = lock.acquire();
      await sleep(100);
      expect(lock.isLocked()).toBe(true);
      setTimeout(async () => {
        expect(lock.isLocked()).toBe(false);
        const r2 = await l2;
        expect(lock.isLocked()).toBe(true);
        await r2();
        expect(lock.isLocked()).toBe(false);
      }, 150);
      await sleep(300);
    });
  });

  describe('local lock', () => {
    let app: Application;

    beforeEach(() => {
      app = new Application({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
        resourcer: {
          prefix: '/api',
        },
        acl: false,
        dataWrapping: false,
        registerActions: false,
      });
    });

    afterEach(async () => {
      return app.destroy();
    });

    it('base api', async () => {
      expect(app.lockManager).toBeDefined();
    });

    it('acquire and release', async () => {
      const order = [];
      const r1 = await app.lockManager.acquire('test');
      order.push(1);
      setTimeout(async () => {
        order.push(2);
        await r1();
        order.push(3);
      }, 200);
      order.push(4);
      const r2 = await app.lockManager.acquire('test');
      order.push(5);
      await r2();
      order.push(6);
      expect(order).toEqual([1, 4, 2, 3, 5, 6]);
    });

    it('acquire and release with timeout', async () => {
      const order = [];
      const r1 = await app.lockManager.acquire('test', 200);
      order.push(1);
      setTimeout(async () => {
        order.push(2);
        await r1();
        order.push(3);
      }, 400);
      order.push(4);
      const r2 = await app.lockManager.acquire('test', 200);
      order.push(5);
      await sleep(300);
      await r2();
      order.push(6);
      expect(order).toEqual([1, 4, 5, 2, 3, 6]);
    });

    it('runExclusive', async () => {
      const order = [];
      setTimeout(async () => {
        await app.lockManager.runExclusive('test', async () => {
          order.push(1);
          await sleep(100);
          order.push(2);
        });
      }, 100);
      order.push(3);
      await app.lockManager.runExclusive('test', async () => {
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
        await app.lockManager.runExclusive(
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
      await app.lockManager.runExclusive(
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
  });
});
