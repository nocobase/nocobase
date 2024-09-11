/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mockDatabase } from '..';
import { Database } from '../../database';
import { BaseInterface } from '../../interfaces/base-interface';

describe('interface manager', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should register field interface', async () => {
    class TestInterface extends BaseInterface {
      toString(value: any) {
        return `test-${value}`;
      }
    }

    db.interfaceManager.registerInterfaceType('test', TestInterface);
    expect(db.interfaceManager.getInterfaceType('test')).toBe(TestInterface);
  });
});
