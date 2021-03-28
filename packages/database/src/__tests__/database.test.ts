import { getDatabase } from '.';
import Database, { Field } from '../';
import Table from '../table';

let db: Database;

beforeEach(async () => {
  db = getDatabase();
});

afterEach(async () => {
  await db.close();
});

describe('database.addHook()', () => {
  it('beforeTableInit', async () => {
    db.addHook('beforeTableInit', (options) => {
      options.title = 'abc';
    });
    const table = db.table({
      name: 'testHook',
      createdBy: true,
      fields: [
        {
          type: 'json',
          name: 'arr',
          defaultValue: [],
        },
      ],
    });
    expect(table.getOptions().title).toBe('abc');
  });
  it('afterTableInit', async () => {
    db.addHook('afterTableInit', (table: Table) => {
      table.addField({
        type: 'string',
        name: 'abc',
      });
    });
    const table = db.table({
      name: 'testHook',
      createdBy: true,
      fields: [
        {
          type: 'json',
          name: 'arr',
          defaultValue: [],
        },
      ],
    });
    expect(table.getField('abc')).toBeTruthy();
  });
  it('beforeAddField', async () => {
    db.addHook('beforeAddField', (options) => {
      options.title = 'f1';
    });
    const table = db.table({
      name: 'testHook',
      createdBy: true,
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });
    expect(table.getField('name').options.title).toBe('f1');
  });
  it('afterAddField', async () => {
    db.addHook('afterAddField', (field: Field, table: Table) => {
      if (field.options.name === 'name') {
        const options = { ...field.options, name: `${field.options.name}123` }
        table.addField(options);
      }
    });
    const table = db.table({
      name: 'testHook',
      createdBy: true,
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });
    expect(table.getField('name123')).toBeTruthy();
  });
});
