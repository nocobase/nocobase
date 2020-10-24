import { getDatabase } from './';
import Database from '../database';
import Table from '../table';
import Model from '../model';

describe('tables', () => {
  let db: Database;

  // beforeAll(() => {
  //   db = getDatabase();
  // });

  // afterAll(async () => {
  //   await db.sequelize.close();
  // });

  describe('options', () => {
    it('shoud be defined', () => {
      db = getDatabase();
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
      db = getDatabase();
      const table = db.table({
        name: 'abc',
        model: Abc,
      });
      expect(Abc.database).toBe(db);
      expect(table.getModel().test12345()).toBe('test12345');
      expect(Abc.getModel('abc').test12345()).toBe('test12345');
    });

    it('shoud tableName === name', async () => {
      db = getDatabase();
      db.table({
        name: 'foos',
      });
      expect(db.getModel('foos').name).toBe('foos');
      expect(db.getModel('foos').getTableName()).toBe('foos');
    });

    it('shoud be custom when tableName is defined', async () => {
      db = getDatabase();
      db.table({
        name: 'bar',
        tableName: 'bar_v2'
      });
      expect(db.getModel('bar').name).toBe('bar');
      expect(db.getModel('bar').getTableName()).toBe('bar_v2');
    });

    it('shoud be custom when timestamps is defined', async () => {
      db = getDatabase();
      db.table({
        name: 'baz',
        createdAt: 'created',
        updatedAt: 'updated',
      });
      expect(db.getModel('baz').rawAttributes.created).toBeDefined();
      expect(db.getModel('baz').rawAttributes.updated).toBeDefined();
    });

    it('index shound be defined', async () => {
      db = getDatabase();
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
      expect(db.getTable('baz').getModelOptions().indexes).toStrictEqual([
        { fields: [ 'col1' ], name: 'baz_col1', type: '', parser: null },
        { fields: [ 'col2', 'col3' ], name: 'baz_col2_col3', type: '', parser: null }
      ]);
    });

    it('index shound be defined', async () => {
      db = getDatabase();
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
      expect(db.getTable('baz2').getModelOptions().indexes).toStrictEqual([
        { fields: [ 'col1' ], name: 'baz2_col1', type: '', parser: null },
        { fields: [ 'col2', 'col3' ], name: 'baz2_col2_col3', type: '', parser: null },
      ]);
    });
  });

  describe('#extend()', () => {
    it('shoud be extend', async () => {
      db = getDatabase();
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
    it('shoud be extend', async () => {
      db = getDatabase();
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
      db = getDatabase();
    });

    it('shound be undefined when target table does not exist', () => {
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

    it('shound be defined when target table exists', () => {
      db.table({name: 'foos'});
      expect(db.getModel('bars').associations.foo).toBeDefined();
    });

    describe('#setFields()', () => {
      beforeAll(() => {
        db = getDatabase();
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
      it('shound be defined', () => {
        const table1 = db.getModel('table1');
        expect(Object.keys(table1.associations).length).toBe(2);
        expect(table1.associations.table21).toBeDefined();
        expect(table1.associations.table22).toBeDefined();
      });
      it('shound be defined', () => {
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
      beforeAll(() => {
        db = getDatabase();
        db.table({
          name: 'table1',
        });
        db.table({
          name: 'table2',
        });
      });
      it('shound be defined when the field be added after initialization', () => {
        db.getTable('table1').addField({
          type: 'hasOne',
          name: 'table2',
          target: 'table2',
        });
        expect(Object.keys(db.getModel('table1').associations).length).toBe(1);
        expect(db.getModel('table1').associations.table2).toBeDefined();
      });
      it('shound be defined when continue to add', () => {
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
});
