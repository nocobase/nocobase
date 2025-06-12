/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import { Repository } from '@nocobase/database';

describe('belongs to array field', () => {
  let app: MockServer;
  let db: MockDatabase;
  let fieldRepo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-m2m-array', 'data-source-manager', 'field-sort', 'data-source-main', 'error-handler'],
    });
    db = app.db;
    fieldRepo = db.getRepository('fields');
    await db.getRepository('collections').create({
      values: {
        name: 'tags',
        fields: [
          {
            name: 'id',
            type: 'bigInt',
            unique: true,
          },
          {
            name: 'stringCode',
            type: 'string',
            unique: true,
          },
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
    });
    await db.getRepository('collections').create({
      values: {
        name: 'users',
        fields: [
          {
            name: 'id',
            type: 'bigInt',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          {
            name: 'username',
            type: 'string',
          },
          {
            name: 'tag_ids',
            type: 'set',
            dataType: 'array',
            elementType: 'string',
          },
        ],
      },
    });
    // @ts-ignore
    await db.getRepository('collections').load();
    await db.sync();
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  describe('association keys check', async () => {
    it('targetKey is required', async () => {
      await expect(
        db.sequelize.transaction(async (transaction) => {
          const field = await fieldRepo.create({
            values: {
              interface: 'mbm',
              collectionName: 'users',
              name: 'tags',
              type: 'belongsToArray',
              foreignKey: 'tag_ids',
              target: 'tags',
            },
            transaction,
          });
          await field.load({ transaction });
        }),
      ).rejects.toThrow(/Target key is required/);
    });

    it('foreign field must be an array or set field', async () => {
      await expect(
        db.sequelize.transaction(async (transaction) => {
          const field = await fieldRepo.create({
            values: {
              interface: 'mbm',
              collectionName: 'users',
              name: 'tags',
              type: 'belongsToArray',
              foreignKey: 'username',
              target: 'tags',
              targetKey: 'id',
            },
            transaction,
          });
          await field.load({ transaction });
        }),
      ).rejects.toThrow(/The type of foreign key "username" in collection "users" must be ARRAY, JSON or JSONB/);
    });

    it('element type of foreign field must be match the type of target field', async () => {
      if (db.sequelize.getDialect() !== 'postgres') {
        return;
      }
      await expect(
        db.sequelize.transaction(async (transaction) => {
          const field = await fieldRepo.create({
            values: {
              interface: 'mbm',
              collectionName: 'users',
              name: 'tags',
              type: 'belongsToArray',
              foreignKey: 'tag_ids',
              target: 'tags',
              targetKey: 'id',
            },
            transaction,
          });
          await field.load({ transaction });
        }),
      ).rejects.toThrow(
        /The element type "STRING" of foreign key "tag_ids" does not match the type "BIGINT" of target key "id" in collection "tags"/,
      );

      await expect(
        db.sequelize.transaction(async (transaction) => {
          const field = await fieldRepo.create({
            values: {
              interface: 'mbm',
              collectionName: 'users',
              name: 'tags',
              type: 'belongsToArray',
              foreignKey: 'tag_ids',
              target: 'tags',
              targetKey: 'stringCode',
            },
            transaction,
          });
          await field.load({ transaction });
        }),
      ).resolves.not.toThrow();
    });

    it('the name of foreign key must not be the same as the name of the field', async () => {
      await expect(
        db.sequelize.transaction(async (transaction) => {
          const field = await fieldRepo.create({
            values: {
              interface: 'mbm',
              collectionName: 'users',
              name: 'tag_ids_same',
              type: 'belongsToArray',
              foreignKey: 'tag_ids_same',
              target: 'tags',
              targetKey: 'stringCode',
            },
            transaction,
          });
          await field.load({ transaction });
        }),
      ).rejects.toThrow(/Naming collision/);
    });
  });
});
