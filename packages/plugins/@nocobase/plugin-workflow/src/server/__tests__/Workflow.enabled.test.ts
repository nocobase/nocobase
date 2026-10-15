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

import workflows from '../collections/workflows';

describe('workflow enabled database values', () => {
  const db = new Database({ dialect: 'postgres' });
  const { model } = db.collection(workflows);

  afterAll(() => db.close());

  it.each([
    { value: true, enabled: true },
    { value: false, enabled: false },
    { value: 1, enabled: true },
    { value: 0, enabled: false },
    { value: '1', enabled: true },
    { value: '0', enabled: false },
    { value: 2, enabled: false },
    { value: -1, enabled: false },
    { value: '2', enabled: false },
    { value: 'invalid', enabled: false },
    { value: '', enabled: false },
    { value: NaN, enabled: false },
    { value: null, enabled: false },
    { value: undefined, enabled: false },
    { value: {}, enabled: false },
    { value: [1], enabled: false },
  ])('reads $value as enabled=$enabled', ({ value, enabled }) => {
    const workflow = model.build({}, { raw: true, isNewRecord: false });
    // Inject the driver value directly to bypass Sequelize's boolean conversion during build.
    workflow.setDataValue('enabled', value);

    expect(workflow.getDataValue('enabled')).toBe(value);
    expect(workflow.enabled).toBe(enabled);
    expect(workflow.get('enabled')).toBe(enabled);
    expect(workflow.get()).toMatchObject({ enabled });
    expect(workflow.toJSON()).toMatchObject({ enabled });
  });
});
