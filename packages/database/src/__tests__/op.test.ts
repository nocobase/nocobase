import { getDatabase } from '.';
import Database, { Field } from '../';
import Table from '../table';

let db: Database;

beforeEach(async () => {
  db = getDatabase();
  db.table({
    name: 'tests',
    fields: [
      {
        type: 'string',
        name: 'name',
      },
      {
        type: 'jsonb',
        name: 'arr',
        defaultValue: [],
      },
    ],
  });
  await db.sync();
});

afterEach(async () => {
  await db.close();
});

describe('op', () => {
  it('test', async () => {
    if ((process.env.DB_DIALECT = 'sqlite')) return;
    const Test = db.getModel('tests');
    await Test.bulkCreate([
      {
        arr: ['aa', 'bb'],
      },
      {
        arr: ['bb', 'dd'],
      },
      {
        arr: ['cc', 'bb'],
      },
      {
        arr: ['dd'],
      },
    ]);
    const options = Test.parseApiJson({
      filter: {
        and: [
          {
            'arr.$anyOf': ['bb'],
          },
          {
            'arr.$noneOf': ['aa', 'cc'],
          },
        ],
      },
    });
    const test = await Test.findOne(options);
    expect(test.get('arr')).toEqual(['bb', 'dd']);
  });
});
