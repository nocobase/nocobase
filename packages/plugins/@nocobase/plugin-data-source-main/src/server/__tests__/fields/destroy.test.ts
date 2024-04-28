import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';

describe('destroy', () => {
  let db: Database;
  let app: Application;
  let Collection: DBCollection;
  let Field: DBCollection;

  beforeEach(async () => {
    app = await createApp({
      database: {
        tablePrefix: '',
      },
    });
    db = app.db;
    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');

    await Collection.repository.create({
      values: {
        name: 'a',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await Collection.repository.create({
      values: {
        name: 'b',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('destroy field', () => {
    it('should remove field in model when field destroyed', async () => {
      const collection = await Collection.repository.create({
        values: {
          name: 'test',
          fields: [
            { name: 'f1', type: 'string' },
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
        context: {},
      });

      expect(db.getCollection('test').model.rawAttributes.name).toBeDefined();

      await Field.repository.destroy({
        filter: {
          name: 'name',
          collectionName: 'test',
        },
        context: {},
      });

      expect(db.getCollection('test').model.rawAttributes.name).toBeUndefined();
      expect(db.getCollection('test').model.rawAttributes.f1).toBeDefined();
    });
  });

  describe('destroy foreign key', () => {
    it('should destroy association field when foreign key field destroyed', async () => {
      await Field.repository.create({
        values: {
          name: 'b',
          type: 'hasOne',
          target: 'b',
          collectionName: 'a',
          foreignKey: 'a_id',
          interface: 'oho',
        },
        context: {},
      });

      // should create association field
      expect(
        await Field.repository.findOne({
          filter: {
            collectionName: 'a',
            name: 'b',
          },
        }),
      ).toBeTruthy();

      const foreignKeyField = await Field.repository.findOne({
        filter: {
          name: 'a_id',
          collectionName: 'b',
        },
      });

      // should create foreign key
      expect(foreignKeyField).toBeTruthy();

      expect(db.getCollection('b').model.rawAttributes.a_id).toBeTruthy();

      // destroy foreign key field
      await Field.repository.destroy({
        filter: {
          name: 'a_id',
          collectionName: 'b',
        },
        context: {},
      });

      // should remove association field
      expect(
        await Field.repository.findOne({
          filter: {
            collectionName: 'a',
            name: 'b',
          },
        }),
      ).toBeFalsy();

      // should remove foreign key
      expect(db.getCollection('b').model.rawAttributes.a_id).toBeFalsy();
    });
  });
});
