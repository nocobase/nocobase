import { Database } from '../../database';
import { mockDatabase } from '../';
import { JsonField } from '../../fields';

describe('json field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    db.registerFieldTypes({
      json: JsonField,
    });
  });

  afterEach(async () => {
    await db.close();
  });

  it('json-filter', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        { type: 'string', name: 'studentId' },
        { type: 'json', name: 'json_test' },
      ],
    });
    await db.sync();

    const students = [
      {
        studentId: 'No.001',
        json_test: {
          name: 'John',
          age: 20,
        },
      },
      {
        studentId: 'No.002',
        json_test: {
          name: 'Emma',
          age: 18,
          isRegister: true,
        },
      },
      {
        studentId: 'No.003',
        json_test: {
          name: 'Justin',
          age: 19,
          isRegister: false,
        },
      },
    ];

    await Test.model.bulkCreate<any>(students);

    let items = await db.getRepository('tests').find({
      filter: {
        json_test: {
          isRegister: { $or: [false, null] },
        },
      },
    });
    console.log(items);
    expect(items.length).toEqual(2);

    items = await db.getRepository('tests').find({
      filter: {
        json_test: {
          isRegister: { $not: true },
        },
      },
    });
    console.log(items);
    expect(items.length).toEqual(2);

    items = await db.getRepository('tests').find({
      filter: {
        json_test: {
          isRegister: { $not: true },
          age: 20,
        },
      },
    });
    expect(items.length).toEqual(1);
    expect(items[0].get('studentId')).toBe(students[0].studentId);
  });
});
