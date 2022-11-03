import { Database } from '../../database';
import { mockDatabase } from '../';
import { JsonField } from '../../fields';

describe('json field', () => {
  let db: Database;

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

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    db.registerFieldTypes({
      json: JsonField,
    });
    const Test = db.collection({
      name: 'tests',
      fields: [
        { type: 'string', name: 'studentId' },
        { type: 'json', name: 'json_test' },
      ],
    });
    await db.sync();
    await Test.model.bulkCreate<any>(students);
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await db.close();
  });

  it('json-filter', async () => {
    let items = await db.getRepository('tests').find({
      filter: {
        json_test: {
          isRegister: true,
        },
      },
    });
    expect(items.length).toEqual(1);
    expect(items[0].get('studentId')).toEqual(students[1].studentId);

    items = await db.getRepository('tests').find({
      filter: {
        json_test: {
          isRegister: false,
          age: 19,
        },
      },
    });
    expect(items.length).toEqual(1);
    expect(items[0].get('studentId')).toEqual(students[2].studentId);

    items = await db.getRepository('tests').find({
      filter: {
        json_test: {
          $or: [{ isRegister: { $is: null } }],   // mysql can't use isRegister: null
        },
      },
    });
    console.log(items);
  });

  it('json-filter-or', async () => {
    let items = await db.getRepository('tests').find({
      filter: {
        json_test: {
          isRegister: { $or: [false, true] },
        },
      },
    });
    console.log(items);
    expect(items.length).toEqual(2);

    items = await db.getRepository('tests').find({
      filter: {
        json_test: {
          $or: [{ isRegister: { $is: null } }, { isRegister: false }],
        },
      },
    });
    console.log(items);
    expect(items.length).toEqual(2);

    items = await db.getRepository('tests').find({
      filter: {
        json_test: {
          $and:{
            $or: [{ isRegister: { $is: null } }, { isRegister: false }],
            age: 20,
          }
        },
      },
    });
    expect(items.length).toEqual(1);
    expect(items[0].get('studentId')).toBe(students[0].studentId);
  });
});
