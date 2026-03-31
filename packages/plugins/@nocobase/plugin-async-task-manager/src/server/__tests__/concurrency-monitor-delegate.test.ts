/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ConcurrencyMode, ConcurrencyMonitor } from '../interfaces/concurrency-monitor';
import { BaseConcurrencyMonitor } from '../base-concurrency-monitor';
import { ConcurrencyMonitorDelegate } from '../base-task-manager';

describe('concurrency monitor delegate', () => {
  class ConcurrencyMonitorHolder {
    private _concurrencyMonitor: ConcurrencyMonitor;
    constructor(
      mode: ConcurrencyMode,
      concurrency: number,
      processConcurrencyMonitor: ConcurrencyMonitor,
      appConcurrencyMonitor: ConcurrencyMonitor = new BaseConcurrencyMonitor(concurrency),
    ) {
      this._concurrencyMonitor = new ConcurrencyMonitorDelegate(mode, appConcurrencyMonitor, processConcurrencyMonitor);
    }

    get concurrencyMonitor(): ConcurrencyMonitor {
      return this._concurrencyMonitor;
    }
  }

  describe('in `process` mode', () => {
    it('Should all ConcurrencyMonitorHolder instance`s idle be false while CONCURRENCY is zero', () => {
      const CONCURRENCY_MODE: ConcurrencyMode = 'process';
      const CONCURRENCY = 0;
      const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

      const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
      const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

      expect(holder1.concurrencyMonitor.idle()).toBeFalsy();
      expect(holder2.concurrencyMonitor.idle()).toBeFalsy();
    });

    it('Should all ConcurrencyMonitorHolder instance`s idle be false while any instance make running tasks count not less than CONCURRENCY', () => {
      const CONCURRENCY_MODE: ConcurrencyMode = 'process';
      const CONCURRENCY = 1;
      const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

      const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
      const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

      holder1.concurrencyMonitor.increase('task1');
      expect(holder1.concurrencyMonitor.idle()).toBeFalsy();
      expect(holder2.concurrencyMonitor.idle()).toBeFalsy();
    });

    it('Should all ConcurrencyMonitorHolder instance`s idle be false while sum of all instance running tasks count not less than CONCURRENCY', () => {
      const CONCURRENCY_MODE: ConcurrencyMode = 'process';
      const CONCURRENCY = 2;
      const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

      const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
      const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

      holder1.concurrencyMonitor.increase('task1');
      holder2.concurrencyMonitor.increase('task2');
      expect(holder1.concurrencyMonitor.idle()).toBeFalsy();
      expect(holder2.concurrencyMonitor.idle()).toBeFalsy();
    });

    it('Should all ConcurrencyMonitorHolder instance`s increase fail while CONCURRENCY is zero', () => {
      const CONCURRENCY_MODE: ConcurrencyMode = 'process';
      const CONCURRENCY = 0;
      const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

      const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
      const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

      expect(holder1.concurrencyMonitor.increase('task1')).toBeFalsy();
      expect(holder2.concurrencyMonitor.increase('task2')).toBeFalsy();
    });

    it('Should ConcurrencyMonitorHolder instance`s increase fail while any instance make running tasks count not less than CONCURRENCY', () => {
      const CONCURRENCY_MODE: ConcurrencyMode = 'process';
      const CONCURRENCY = 1;
      const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

      const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
      const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

      expect(holder1.concurrencyMonitor.increase('task1')).toBeTruthy();
      expect(holder2.concurrencyMonitor.increase('task2')).toBeFalsy();
    });

    it('Should all ConcurrencyMonitorHolder instance`s increase be success while sum of all instance running tasks count not greater than CONCURRENCY', () => {
      const CONCURRENCY_MODE: ConcurrencyMode = 'process';
      const CONCURRENCY = 2;
      const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

      const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
      const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

      expect(holder1.concurrencyMonitor.increase('task1')).toBeTruthy();
      expect(holder2.concurrencyMonitor.increase('task2')).toBeTruthy();
    });

    describe('concurrency escape', () => {
      it('CONCURRENCY = 1', async () => {
        const CONCURRENCY_MODE: ConcurrencyMode = 'process';
        const CONCURRENCY = 1;
        const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

        const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
        const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

        const func = vitest.fn();

        await Promise.all([
          new Promise<void>((resolve) => {
            if (holder1.concurrencyMonitor.idle() && holder1.concurrencyMonitor.increase('task1')) {
              func();
            }
            resolve();
          }),
          new Promise<void>((resolve) => {
            if (holder2.concurrencyMonitor.idle() && holder2.concurrencyMonitor.increase('task2')) {
              func();
            }
            resolve();
          }),
        ]);

        expect(func).toBeCalledTimes(1);
      });

      it('CONCURRENCY = 2', async () => {
        const CONCURRENCY_MODE: ConcurrencyMode = 'process';
        const CONCURRENCY = 2;
        const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

        const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
        const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

        const func = vitest.fn();

        await Promise.all([
          new Promise<void>((resolve) => {
            if (holder1.concurrencyMonitor.idle() && holder1.concurrencyMonitor.increase('task1')) {
              func();
            }
            resolve();
          }),
          new Promise<void>((resolve) => {
            if (holder2.concurrencyMonitor.idle() && holder2.concurrencyMonitor.increase('task2')) {
              func();
            }
            resolve();
          }),
        ]);

        expect(func).toBeCalledTimes(2);
      });
    });
  });

  describe('in `app` mode', () => {
    it('Should different holder instance have own idle state', () => {
      const CONCURRENCY_MODE: ConcurrencyMode = 'app';
      const CONCURRENCY = 1;
      const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

      const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
      const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

      holder1.concurrencyMonitor.increase('task1');
      expect(holder1.concurrencyMonitor.idle()).toBeFalsy();
      expect(holder2.concurrencyMonitor.idle()).toBeTruthy();
    });

    it('Should different holder instance have own running tasks count', () => {
      const CONCURRENCY_MODE: ConcurrencyMode = 'app';

      const CONCURRENCY_1 = 1;
      const PROCESS_CONCURRENCY_MONITOR_1: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY_1);
      const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY_1, PROCESS_CONCURRENCY_MONITOR_1);
      const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY_1, PROCESS_CONCURRENCY_MONITOR_1);

      holder1.concurrencyMonitor.increase('task1');
      holder2.concurrencyMonitor.increase('task1');
      expect(holder1.concurrencyMonitor.idle()).toBeFalsy();
      expect(holder2.concurrencyMonitor.idle()).toBeFalsy();

      const CONCURRENCY_2 = 2;
      const PROCESS_CONCURRENCY_MONITOR_2: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY_2);
      const holder3 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY_2, PROCESS_CONCURRENCY_MONITOR_2);
      const holder4 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY_2, PROCESS_CONCURRENCY_MONITOR_2);

      holder3.concurrencyMonitor.increase('task1');
      holder4.concurrencyMonitor.increase('task2');
      expect(holder3.concurrencyMonitor.idle()).toBeTruthy();
      expect(holder4.concurrencyMonitor.idle()).toBeTruthy();

      holder3.concurrencyMonitor.increase('task3');
      expect(holder3.concurrencyMonitor.idle()).toBeFalsy();
      expect(holder4.concurrencyMonitor.idle()).toBeTruthy();

      holder4.concurrencyMonitor.increase('task4');
      expect(holder3.concurrencyMonitor.idle()).toBeFalsy();
      expect(holder4.concurrencyMonitor.idle()).toBeFalsy();

      const holder5 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY_2, PROCESS_CONCURRENCY_MONITOR_2);
      const holder6 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY_2, PROCESS_CONCURRENCY_MONITOR_2);

      holder5.concurrencyMonitor.increase('task1');
      holder6.concurrencyMonitor.increase('task1');
      expect(holder5.concurrencyMonitor.idle()).toBeTruthy();
      expect(holder6.concurrencyMonitor.idle()).toBeTruthy();

      holder5.concurrencyMonitor.increase('task1');
      holder6.concurrencyMonitor.increase('task1');
      expect(holder5.concurrencyMonitor.idle()).toBeTruthy();
      expect(holder6.concurrencyMonitor.idle()).toBeTruthy();

      holder5.concurrencyMonitor.increase('task2');
      holder6.concurrencyMonitor.increase('task2');
      expect(holder5.concurrencyMonitor.idle()).toBeFalsy();
      expect(holder6.concurrencyMonitor.idle()).toBeFalsy();
    });

    it('Should different holder instance have own increase check', () => {
      const CONCURRENCY_MODE: ConcurrencyMode = 'app';
      const CONCURRENCY = 1;
      const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

      const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
      const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

      expect(holder1.concurrencyMonitor.increase('task1')).toBeTruthy();
      expect(holder1.concurrencyMonitor.increase('task2')).toBeFalsy();

      expect(holder2.concurrencyMonitor.increase('task1')).toBeTruthy();
      expect(holder2.concurrencyMonitor.increase('task2')).toBeFalsy();
    });

    describe('concurrency escape', () => {
      it('CONCURRENCY = 1', async () => {
        const CONCURRENCY_MODE: ConcurrencyMode = 'app';
        const CONCURRENCY = 1;
        const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

        const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
        const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

        const func1 = vitest.fn();
        const func2 = vitest.fn();

        await Promise.all([
          new Promise<void>((resolve) => {
            if (holder1.concurrencyMonitor.idle() && holder1.concurrencyMonitor.increase('task1')) {
              func1();
            }
            resolve();
          }),
          new Promise<void>((resolve) => {
            if (holder1.concurrencyMonitor.idle() && holder1.concurrencyMonitor.increase('task2')) {
              func1();
            }
            resolve();
          }),
          new Promise<void>((resolve) => {
            if (holder2.concurrencyMonitor.idle() && holder2.concurrencyMonitor.increase('task1')) {
              func2();
            }
            resolve();
          }),
          new Promise<void>((resolve) => {
            if (holder2.concurrencyMonitor.idle() && holder2.concurrencyMonitor.increase('task2')) {
              func2();
            }
            resolve();
          }),
        ]);

        expect(func1).toBeCalledTimes(1);
        expect(func2).toBeCalledTimes(1);
      });

      it('CONCURRENCY = 2', async () => {
        const CONCURRENCY_MODE: ConcurrencyMode = 'app';
        const CONCURRENCY = 2;
        const PROCESS_CONCURRENCY_MONITOR: ConcurrencyMonitor = new BaseConcurrencyMonitor(CONCURRENCY);

        const holder1 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);
        const holder2 = new ConcurrencyMonitorHolder(CONCURRENCY_MODE, CONCURRENCY, PROCESS_CONCURRENCY_MONITOR);

        const func1 = vitest.fn();
        const func2 = vitest.fn();

        await Promise.all([
          new Promise<void>((resolve) => {
            if (holder1.concurrencyMonitor.idle() && holder1.concurrencyMonitor.increase('task1')) {
              func1();
            }
            resolve();
          }),
          new Promise<void>((resolve) => {
            if (holder1.concurrencyMonitor.idle() && holder1.concurrencyMonitor.increase('task2')) {
              func1();
            }
            resolve();
          }),
          new Promise<void>((resolve) => {
            if (holder2.concurrencyMonitor.idle() && holder2.concurrencyMonitor.increase('task1')) {
              func2();
            }
            resolve();
          }),
          new Promise<void>((resolve) => {
            if (holder2.concurrencyMonitor.idle() && holder2.concurrencyMonitor.increase('task2')) {
              func2();
            }
            resolve();
          }),
        ]);

        expect(func1).toBeCalledTimes(2);
        expect(func2).toBeCalledTimes(2);
      });
    });
  });
});
