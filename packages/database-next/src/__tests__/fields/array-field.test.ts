import { mockDatabase } from '../index';

describe('array field', function () {
  let db;
  let Test;

  let t1;
  let t2;

  beforeEach(async () => {
    db = mockDatabase({
      logging: console.log,
    });

    Test = db.collection({
      name: 'test',
      fields: [
        { type: 'array', name: 'selected' },
        { type: 'string', name: 'name' },
      ],
    });

    await db.sync();

    t1 = await Test.repository.create({
      values: {
        selected: [1, 2, 'a', 'b'],
        name: 't1',
      },
    });

    t2 = await Test.repository.create({
      values: {
        selected: [11, 22, 'aa', 'bb', 'cc'],
        name: 't2',
      },
    });
  });

  test('$match', async () => {
    const filter1 = await Test.repository.find({
      filter: {
        'selected.$match': [1, 2, 'a', 'b'],
      },
    });

    expect(filter1.length).toEqual(1);
    expect(filter1[0].get('name')).toEqual(t1.get('name'));
  });

  test('$notMatch', async () => {
    const filter2 = await Test.repository.find({
      filter: {
        'selected.$notMatch': [1, 2, 'a', 'b'],
      },
    });

    expect(filter2.length).toEqual(1);
    expect(filter2[0].get('name')).toEqual(t2.get('name'));
  });

  test('$anyOf', async () => {
    const filter3 = await Test.repository.find({
      filter: {
        'selected.$anyOf': ['aa'],
      },
    });

    expect(filter3.length).toEqual(1);
    expect(filter3[0].get('name')).toEqual(t2.get('name'));
  });

  test('$noneOf', async () => {
    const filter = await Test.repository.find({
      filter: {
        'selected.$noneOf': ['aa'],
      },
    });

    expect(filter.length).toEqual(1);
    expect(filter[0].get('name')).toEqual(t1.get('name'));
  });

  test('$empty', async () => {
    const t3 = await Test.repository.create({
      values: {
        name: 't3',
      },
    });

    const filter = await Test.repository.find({
      filter: {
        'selected.$empty': true,
      },
    });
    expect(filter.length).toEqual(1);
    expect(filter[0].get('name')).toEqual(t3.get('name'));
  });

  test('$notEmpty', async () => {
    const t3 = await Test.repository.create({
      values: {
        name: 't3',
      },
    });

    const filter = await Test.repository.find({
      filter: {
        'selected.$notEmpty': true,
      },
    });
    expect(filter.length).toEqual(2);
  });
});
