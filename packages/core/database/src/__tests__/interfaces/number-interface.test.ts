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
});
