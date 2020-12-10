import { getDatabase } from './';
import Database from '../database';
import Table from '../table';
import Model from '../model';

let db: Database;

beforeEach(async () => {
  db = getDatabase();
});

afterEach(async () => {
  await db.close();
});

describe('tables', () => {
  describe('options', () => {
    it('should be defined', () => {
      db.table({
        name: 'foo',
      });
      expect(db.getTable('foo')).toBeInstanceOf(Table);
      expect(db.isDefined('foo')).toBe(true);
    });

    it('custom model test', () => {
      class Abc extends Model {
        public static database: Database;
        static getModel(name: string) {
          return this.database.getModel(name);
        }
        static test12345() {
          return 'test12345';
        }
      }
      const table = db.table({
        name: 'abc',
        model: Abc,
      });
      expect(Abc.database).toBe(db);
      expect(table.getModel().test12345()).toBe('test12345');
      expect(Abc.getModel('abc').test12345()).toBe('test12345');
    });

    it('should tableName === name', async () => {
      db.table({
        name: 'foos',
      });
      expect(db.getModel('foos').name).toBe('foos');
      // hooked by beforeDefine in index.ts
      expect(db.getModel('foos').getTableName()).toBe('_packages_database_src___tests___tables_foos');
    });

    it('should be custom when tableName is defined', async () => {
      db.table({
        name: 'bar',
        tableName: 'bar_v2'
      });
      expect(db.getModel('bar').name).toBe('bar');
      // hooked by beforeDefine in index.ts
      expect(db.getModel('bar').getTableName()).toBe('_packages_database_src___tests___tables_bar_v2');
    });

    it('should be custom when timestamps is defined', async () => {
      db.table({
        name: 'baz',
        createdAt: 'created',
        updatedAt: 'updated',
      });
      expect(db.getModel('baz').rawAttributes.created).toBeDefined();
      expect(db.getModel('baz').rawAttributes.updated).toBeDefined();
    });

    it('index should be defined', async () => {
      db.table({
        name: 'baz',
        fields: [
          {
            type: 'string',
            name: 'col1',
            index: true,
          },
          {
            type: 'string',
            name: 'col2',
          },
          {
            type: 'string',
            name: 'col3',
            index: {
              fields: ['col2', 'col3'],
            },
          },
        ],
      });
      expect(db.getModel('baz').options.indexes).toStrictEqual(db.getTable('baz').getModelOptions().indexes);
      // @ts-ignore
      expect(db.getTable('baz').getModelOptions().indexes).toMatchObject([
        { fields: [ 'col1' ], name: 'baz_col1', parser: null },
        { fields: [ 'col2', 'col3' ], name: 'baz_col2_col3', parser: null }
      ]);
    });

    it('index should be defined', async () => {
      db.table({
        name: 'baz2',
        indexes: [
          {
            fields: ['col1'],
          },
          {
            fields: ['col2', 'col3'],
          },
        ],
        fields: [
          {
            type: 'string',
            name: 'col1',
          },
          {
            type: 'string',
            name: 'col2',
          },
          {
            type: 'string',
            name: 'col3',
          },
        ],
      });
      expect(db.getModel('baz2').options.indexes).toStrictEqual(db.getTable('baz2').getModelOptions().indexes);
      // @ts-ignore
      expect(db.getTable('baz2').getModelOptions().indexes).toMatchObject([
        { fields: [ 'col1' ], name: 'baz2_col1', parser: null },
        { fields: [ 'col2', 'col3' ], name: 'baz2_col2_col3', parser: null },
      ]);
    });
  });

  describe('#extend()', () => {
    it('should be extend', async () => {
      db.table({
        name: 'baz',
      });
      expect(db.getModel('baz').rawAttributes.created_at).toBeDefined();
      expect(db.getModel('baz').rawAttributes.updated_at).toBeDefined();
      db.extend({
        name: 'baz',
        createdAt: 'created',
        updatedAt: 'updated',
      });
      expect(db.getModel('baz').rawAttributes.created).toBeDefined();
      expect(db.getModel('baz').rawAttributes.updated).toBeDefined();
    });
    it('should be extend', async () => {
      db.table({
        name: 'foos',
      });
      db.table({
        name: 'baz',
        fields: [
          {
            type: 'string',
            name: 'col1',
          },
          {
            type: 'hasOne',
            name: 'foo',
          }
        ]
      });
      db.extend({
        name: 'baz',
        timestamps: false,
        fields: [
          {
            type: 'string',
            name: 'col2',
          }
        ],
      });
      expect(db.getModel('baz').rawAttributes.col1).toBeDefined();
      expect(db.getModel('baz').rawAttributes.col2).toBeDefined();
      expect(db.getModel('baz').rawAttributes.created_at).toBeUndefined();
      expect(db.getModel('baz').rawAttributes.updated_at).toBeUndefined();
      expect(db.getModel('baz').rawAttributes.col2).toBeDefined();
      expect(db.getModel('baz').associations.foo).toBeDefined();
      // await db.sync({force: true});
      // await db.sequelize.close();
    });
  });

  describe('associations', () => {
    beforeAll(() => {
    });

    it('should be undefined when target table does not exist', () => {
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasOne',
            name: 'foo',
          }
        ],
      });
      expect(db.getModel('bars').associations.foo).toBeUndefined();
    });

    it('should be defined when target table exists', () => {
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'hasOne',
            name: 'foo',
          }
        ],
      });
      db.table({name: 'foos'});
      expect(db.getModel('bars').associations.foo).toBeDefined();
    });

    describe('#setFields()', () => {
      beforeEach(() => {
        db.table({
          name: 'table1',
          fields: [
            {
              type: 'hasOne',
              name: 'table21',
              target: 'table2',
            },
            {
              type: 'hasOne',
              name: 'table22',
              target: 'table2',
            },
          ]
        });
        db.table({
          name: 'table2',
        });
      });
      it('should be defined', () => {
        const table1 = db.getModel('table1');
        expect(Object.keys(table1.associations).length).toBe(2);
        expect(table1.associations.table21).toBeDefined();
        expect(table1.associations.table22).toBeDefined();
      });
      it('should be defined', () => {
        db.getTable('table1').setFields([
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'hasOne',
            name: 'table23',
            target: 'table2',
          },
        ]);
        const table1 = db.getModel('table1');
        expect(table1.rawAttributes.name).toBeDefined();
        expect(Object.keys(table1.associations).length).toBe(1);
        expect(table1.associations.table21).toBeUndefined();
        expect(table1.associations.table22).toBeUndefined();
        expect(table1.associations.table23).toBeDefined();
      });
    });

    describe('#addField()', () => {
      beforeEach(() => {
        db.table({
          name: 'table1',
        });
        db.table({
          name: 'table2',
        });
      });
      it('should be defined when the field be added after initialization', () => {
        db.getTable('table1').addField({
          type: 'hasOne',
          name: 'table2',
          target: 'table2',
        });
        expect(Object.keys(db.getModel('table1').associations).length).toBe(1);
        expect(db.getModel('table1').associations.table2).toBeDefined();
      });
      it('should be defined when continue to add', () => {
        db.getTable('table1').addField({
          type: 'hasOne',
          name: 'table2',
          target: 'table2',
        });
        db.getTable('table1').addField({
          type: 'hasOne',
          name: 'table21',
          target: 'table2',
        });
        expect(Object.keys(db.getModel('table1').associations).length).toBe(2);
        expect(db.getModel('table1').associations.table2).toBeDefined();
        expect(db.getModel('table1').associations.table21).toBeDefined();
      });
    });
  });

  describe('sort field', () => {
    it.only('init field with hook', async () => {
      db.table({
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'sort',
            name: 'sort',
          },
          {
            type: 'string',
            name: 'status',
          },
        ],
        hooks: {
          beforeCreate(model, options) {
          },
        },
      });
      await db.sync({ force: true });

      const Post = db.getModel('posts');
      const post = await Post.create({});
      expect(post.sort).toBe(1);
    });
  });
});
