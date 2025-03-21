/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';
import { DataTypes } from 'sequelize';

describe('context field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('dataType', () => {
    it('case 1, string', async () => {
      const Test = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'context',
            name: 'clientIp',
            dataIndex: 'request.ip',
            dataType: 'string',
          },
        ],
      });
      const attribute = Test.model.rawAttributes['clientIp'];
      expect(attribute.type).toBeInstanceOf(DataTypes.STRING);
    });

    it('case 2, integer', async () => {
      const Test = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'context',
            name: 'userId',
            dataIndex: 'state.currentUser.id',
            dataType: 'integer',
          },
        ],
      });
      const attribute = Test.model.rawAttributes['userId'];
      expect(attribute.type).toBeInstanceOf(DataTypes.INTEGER);
    });

    it('case 3, json', async () => {
      const Test = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'context',
            name: 'ua',
            dataIndex: 'userAgent',
            dataType: 'json',
          },
        ],
      });
      const attribute = Test.model.rawAttributes['ua'];
      expect(attribute.type).toBeInstanceOf(DataTypes.JSON);
    });
  });

  describe('create and update', () => {
    it('case 1', async () => {
      const Test = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'context',
            name: 'clientIp',
            dataIndex: 'request.ip',
            dataType: 'string',
          },
        ],
      });
      await db.sync();
      const t1 = await Test.repository.create({
        values: {},
        context: {
          request: {
            ip: '11.22.33.44',
          },
        },
      });
      expect(t1.get('clientIp')).toBe('11.22.33.44');
      const [t2] = await Test.repository.update({
        filterByTk: t1.get('id') as any,
        values: {},
        context: {
          request: {
            ip: '11.22.33.55',
          },
        },
      });
      expect(t2.get('clientIp')).toBe('11.22.33.55');
      const t3 = await Test.repository.findOne();
      expect(t3.get('clientIp')).toBe('11.22.33.55');
    });

    it('case 2, createOnly = true', async () => {
      const Test = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'context',
            name: 'clientIp',
            dataIndex: 'request.ip',
            dataType: 'string',
            createOnly: true,
          },
        ],
      });
      await db.sync();
      const t1 = await Test.repository.create({
        values: {},
        context: {
          request: {
            ip: '11.22.33.44',
          },
        },
      });
      expect(t1.get('clientIp')).toBe('11.22.33.44');
      const [t2] = await Test.repository.update({
        filterByTk: t1.get('id') as any,
        values: {},
        context: {
          request: {
            ip: '11.22.33.55',
          },
        },
      });
      expect(t2.get('clientIp')).toBe('11.22.33.44');
      const t3 = await Test.repository.findOne();
      expect(t3.get('clientIp')).toBe('11.22.33.44');
    });
  });
});
