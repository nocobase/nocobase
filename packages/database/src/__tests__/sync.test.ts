import Database from '..';
import { getDatabase } from './';



let db: Database;

beforeEach(async () => {
  db = getDatabase();
});

afterEach(async () => {
  await db.close();
});

describe('db sync', () => {
  describe('table.sync', () => {
    it('shound be ok1', async () => {
      const table = db.table({
        name: 'foos',
      });
      await table.sync();
    });
    it('sync#belongsTo', async () => {
      db.table({
        name: 'foos',
        tableName: 'foos1',
        fields: [
          {
            type: 'belongsTo',
            name: 'bar',
          }
        ],
      });
      db.table({
        name: 'bars',
        tableName: 'bars1',
        fields: [
          {
            type: 'hasMany',
            name: 'foos',
          }
        ],
      });
      await db.sequelize.drop();
      await db.getTable('foos').sync({
        force: false,
        alter: {
          drop: false,
        }
      });
    });
    it('sync#hasMany', async () => {
      db.table({
        name: 'foos',
        tableName: 'foos2',
        fields: [
          {
            type: 'belongsTo',
            name: 'bar',
          }
        ],
      });
      db.table({
        name: 'bars',
        tableName: 'bars2',
        fields: [
          {
            type: 'hasMany',
            name: 'foos',
          }
        ],
      });
      await db.sequelize.drop();
      await db.getTable('bars').sync({
        force: false,
        alter: {
          drop: false,
        }
      });
    });
    it('sync#belongsToMany', async () => {
      db.table({
        name: 'foos',
        fields: [
          {
            type: 'belongsToMany',
            name: 'bars',
          },
          {
            type: 'string',
            name: 'name',
          },
        ],
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsToMany',
            name: 'foos',
          },
          {
            type: 'string',
            name: 'name',
          }
        ],
      });
      await db.sequelize.drop();
      await db.getTable('foos').sync({
        force: false,
        alter: {
          drop: false,
        }
      });
      await db.getModel('bars').create({
        name: 'aa',
      });
      expect(await db.getModel('bars').count()).toBe(1);
      db.getTable('bars').addField({
        type: 'string',
        name: 'col1',
      });
      await db.getTable('bars').sync({
        force: false,
        alter: {
          drop: false,
        }
      });
      await db.getModel('bars').create({
        name: 'bb',
        col1: 'val1'
      });
      expect(await db.getModel('bars').count()).toBe(2);
    });
    it('shound be ok2', async () => {
      const table = db.table({
        name: 'goos',
      });
      await table.sync({
        force: true,
      });
      table.addField({
        type: 'string',
        name: 'col1',
      });
      await table.sync({
        force: false,
        alter: {
          drop: false,
        }
      });
      table.addField({
        type: 'string',
        name: 'col2',
      });
      await table.sync({
        force: false,
        alter: {
          drop: false,
        }
      });
    });
  });
});
