/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';
import { NumberInterface } from '../../interfaces/number-interface';

describe('number interface', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should handle bigint', async () => {
    const numberInterface = new NumberInterface({});
    const value = await numberInterface.toValue('12312312321312321321');
    expect(value).toBe('12312312321312321321');
  });

  it('toString should honor step precision and keep trailing zeros', () => {
    const ni = new NumberInterface({
      uiSchema: {
        'x-component-props': { step: 0.1 },
      },
    });
    expect(ni.toString(2)).toBe('2.0');
    expect(ni.toString(2.05)).toBe('2.1');
  });

  it('toString should support string step and scientific notation', () => {
    const ni1 = new NumberInterface({ uiSchema: { 'x-component-props': { step: '0.01' } } });
    expect(ni1.toString(2)).toBe('2.00');
  });

  it('toString should fallback for integer step', () => {
    const ni = new NumberInterface({ uiSchema: { 'x-component-props': { step: 1 } } });
    expect(ni.toString(2.6)).toBe('3');
  });
});
