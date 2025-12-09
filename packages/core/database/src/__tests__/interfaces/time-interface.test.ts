/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import dayjs from 'dayjs';
import record from 'packages/core/client/src/schema-component/antd/table-v2/demos/new-demos/record';
import { TimeInterface } from '../../interfaces/time-interface';

describe('TimeInterface', () => {
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
      db.collection({
        name: 'tests',
        fields: [
          {
            name: 'time',
            type: 'time',
          },
        ],
      });
      await db.sync();
      await db.getRepository('tests').create({
        values: {
          time: '12:34:56',
        },
      });
      const record = await db.getRepository('tests').findOne();
      const interfaceInstance = new TimeInterface();
      const value = await interfaceInstance.toValue(record.get('time'));
      expect(value).toEqual('12:34:56');
    });

    it('should return dayjs', async () => {
      const time = dayjs('2024-01-01T12:34:56Z');
      const interfaceInstance = new TimeInterface();
      const value = await interfaceInstance.toValue(time);
      expect(value).toEqual(time.format('HH:mm:ss'));
    });

    it('should return format', async () => {
      const time = dayjs('2024-01-01T12:34:56Z').format('HH:mm:ss');
      const interfaceInstance = new TimeInterface();
      const value = await interfaceInstance.toValue(time);
      expect(value).toEqual(time);
    });
  });
});
