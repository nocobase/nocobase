/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import { SelectInterface } from '../../interfaces/select-interface';

describe('SelectInterface', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('toValue', () => {
    it('should return value', async () => {
      const options = {
        uiSchema: {
          enum: [
            { value: '1', label: 'Label1' },
            { value: '2', label: 'Label2' },
          ],
        },
      };

      const interfaceInstance = new SelectInterface(options);
      const value = await interfaceInstance.toValue('Label1');
      expect(value).toEqual('1');
    });
  });
});
