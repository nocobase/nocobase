/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { afterAll, describe, expect, it } from 'vitest';

import workflowStats from '../collections/workflowStats';
import workflowVersionStats from '../collections/workflowVersionStats';

describe.each([workflowStats, workflowVersionStats])('$name executed database values', (options) => {
  const db = new Database({ dialect: 'postgres' });
  const { model } = db.collection(options);

  afterAll(() => db.close());

  it.each([
    { value: 0, executed: 0 },
    { value: 1, executed: 1 },
    { value: 42, executed: 42 },
    { value: '0', executed: 0 },
    { value: '1', executed: 1 },
    { value: '42', executed: 42 },
    { value: Number.MAX_SAFE_INTEGER, executed: Number.MAX_SAFE_INTEGER },
    { value: String(Number.MAX_SAFE_INTEGER), executed: Number.MAX_SAFE_INTEGER },
    { value: '9007199254740992', executed: '9007199254740992' },
    { value: '10000000000000001', executed: '10000000000000001' },
  ])('reads $value as executed=$executed', ({ value, executed }) => {
    const stats = model.build({}, { raw: true, isNewRecord: false });
    // Simulate a driver returning string bigint values without connecting to KingBase.
    stats.setDataValue('executed', value);

    expect(stats.getDataValue('executed')).toBe(value);
    expect(stats.executed).toBe(executed);
    expect(stats.get('executed')).toBe(executed);
    expect(stats.get()).toMatchObject({ executed });
    const data: { executed: number | string } = JSON.parse(JSON.stringify(stats));
    expect(data.executed).toBe(executed);
    expect(Boolean(data.executed)).toBe(executed !== 0);
  });
});
