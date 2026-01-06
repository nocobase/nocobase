/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ConcurrencyMonitor } from '../interfaces/concurrency-monitor';
import { BaseConcurrencyMonitor } from '../base-concurrency-monitor';

describe('concurrency monitor', () => {
  beforeEach(async () => {});

  afterEach(async () => {});

  describe('monitor.idle', () => {
    it('should idle be false while CONCURRENCY is zero', async () => {
      const CONCURRENCY = 0;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      expect(concurrencyMonitor.idle()).toBeFalsy();
    });

    it('should idle be true while CONCURRENCY greater than zero and not running tasks', async () => {
      const CONCURRENCY = 1;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      expect(concurrencyMonitor.idle()).toBeTruthy();
    });

    it('should idle be true while CONCURRENCY greater than zero and running tasks count not greater than CONCURRENCY', async () => {
      const CONCURRENCY = 2;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      concurrencyMonitor.increase('task1');
      expect(concurrencyMonitor.idle()).toBeTruthy();
    });

    it('should idle be false while CONCURRENCY greater than zero and running tasks count not less than CONCURRENCY', async () => {
      const CONCURRENCY = 2;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      concurrencyMonitor.increase('task1');
      concurrencyMonitor.increase('task2');
      expect(concurrencyMonitor.idle()).toBeFalsy();
    });

    it('should not increase running tasks count by increase same task id many times', async () => {
      const CONCURRENCY = 2;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      concurrencyMonitor.increase('task1');
      concurrencyMonitor.increase('task1');
      concurrencyMonitor.increase('task1');
      expect(concurrencyMonitor.idle()).toBeTruthy();
    });
  });

  describe('monitor.increase', () => {
    it('should increase fail while CONCURRENCY is zero', async () => {
      const CONCURRENCY = 0;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      const result = concurrencyMonitor.increase('task1');
      expect(result).toBeFalsy();
    });

    it('should increase success while CONCURRENCY greater than zero', async () => {
      const CONCURRENCY = 1;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      const result = concurrencyMonitor.increase('task1');
      expect(result).toBeTruthy();
    });

    it('should increase fail if running tasks count will greater than CONCURRENCY after increase', async () => {
      const CONCURRENCY = 1;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      const result1 = concurrencyMonitor.increase('task1');
      expect(result1).toBeTruthy();
      const result2 = concurrencyMonitor.increase('task2');
      expect(result2).toBeFalsy();
    });

    it('should increase success if increase by same task id', async () => {
      const CONCURRENCY = 1;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      const result1 = concurrencyMonitor.increase('task1');
      const result2 = concurrencyMonitor.increase('task1');
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
    });
  });

  describe('monitor.reduce', () => {
    it('should reduce running tasks count and change idle state', async () => {
      const CONCURRENCY = 1;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      concurrencyMonitor.increase('task1');
      expect(concurrencyMonitor.idle()).toBeFalsy();
      concurrencyMonitor.reduce('task1');
      expect(concurrencyMonitor.idle()).toBeTruthy();
    });

    it('should reduce running tasks count and change increase checking', async () => {
      const CONCURRENCY = 1;
      const concurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);
      concurrencyMonitor.increase('task1');
      const result1 = concurrencyMonitor.increase('task2');
      expect(result1).toBeFalsy();
      concurrencyMonitor.reduce('task1');
      const result2 = concurrencyMonitor.increase('task2');
      expect(result2).toBeTruthy();
    });
  });
});
