/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

import agMaintenanceLeases from '../../collections/agMaintenanceLeases';
import { runWithMaintenanceLease } from '../maintenanceLease';

const databaseDescribe = process.env.DB_DIALECT && process.env.DB_DIALECT !== 'sqlite' ? describe : describe.skip;

databaseDescribe('agent gateway maintenance lease', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({});
    await db.clean({ drop: true });
    db.collection(agMaintenanceLeases);
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('allows only one owner to run the same maintenance task at a time', async () => {
    let notifyStarted: (() => void) | undefined;
    let releaseTask: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      notifyStarted = resolve;
    });
    const blocked = new Promise<void>((resolve) => {
      releaseTask = resolve;
    });

    const first = runWithMaintenanceLease(
      { db },
      {
        key: 'retention',
        ownerId: 'server-a',
        ttlMs: 60_000,
        task: async () => {
          notifyStarted?.();
          await blocked;
          return 'completed';
        },
      },
    );

    await started;
    const second = await runWithMaintenanceLease(
      { db },
      {
        key: 'retention',
        ownerId: 'server-b',
        ttlMs: 60_000,
        task: async () => 'must-not-run',
      },
    );

    expect(second).toEqual({ acquired: false });
    releaseTask?.();
    await expect(first).resolves.toEqual({ acquired: true, result: 'completed' });
    expect(await db.getRepository('agMaintenanceLeases').count()).toBe(0);
  });

  it('reclaims an expired lease', async () => {
    await db.getRepository('agMaintenanceLeases').create({
      values: {
        key: 'lease-recovery',
        ownerId: 'stopped-server',
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    await expect(
      runWithMaintenanceLease(
        { db },
        {
          key: 'lease-recovery',
          ownerId: 'replacement-server',
          ttlMs: 60_000,
          task: async () => 'recovered',
        },
      ),
    ).resolves.toEqual({ acquired: true, result: 'recovered' });
    expect(await db.getRepository('agMaintenanceLeases').count()).toBe(0);
  });
});
