import { Agent, getAgent, getApp } from '.';
import { Application } from '@nocobase/server';
import Database, { ModelCtor, Model, FieldOptions } from '@nocobase/database';
import { FieldModel } from '../models';

type Options = {name?: string} & FieldOptions;

describe('fields', () => {
  let app: Application;
  let agent: Agent;
  let db: Database;
  let Collection: ModelCtor<Model>;
  let collection: Model;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
    db = app.database;
    Collection = db.getModel('collections');
    collection = await Collection.create({name: 'foos'});
    await Collection.create({name: 'bars'});
    const tables = db.getTables();
    for (const table of tables.values()) {
      await Collection.import(table.getOptions(), { migrate: false });
    }
  });

  afterEach(() => app.database.close());

  async function createField(options: Options) {
    return await collection.createField(options);
  }

  describe('basic', () => {
    it('string', async () => {
      await createField({
        interface: 'string',
      });
    });
    it('number', async () => {
      await createField({
        interface: 'number',
      });
    });
  });

  describe('relation', () => {
    it('linkTo', async () => {
      const field = await createField({
        interface: 'linkTo',
        'x-linkTo-props': {
          multiple: false,
          target: 'bars',
        },
      });
      const data = field.get();
      const keys = ['target', 'multiple', 'foreignKey', 'otherKey', 'sourceKey', 'targetKey'];
      for (const key of keys) {
        expect(data[key]).toEqual(field.get(key));
      }
      expect(data['x-linkTo-props']).toEqual({ target: 'bars', multiple: false });
    });

    it('linkTo', async () => {
      const field = await createField({
        interface: 'linkTo',
        type: 'hasMany',
        'x-linkTo-props': {
          // multiple: false,
          target: 'bars',
        },
      });
      const data = field.get();
      const keys = ['target', 'multiple', 'foreignKey', 'otherKey', 'sourceKey', 'targetKey'];
      for (const key of keys) {
        expect(data[key]).toEqual(field.get(key));
      }
      expect(data['x-linkTo-props']).toEqual({ target: 'bars', multiple: true });
    });
  });
});
