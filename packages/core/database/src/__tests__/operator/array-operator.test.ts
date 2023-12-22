import Database from '../../database';
import { mockDatabase } from '../index';

describe('array field operator', function () {
  let db: Database;
  let Test;

  let t1;
  let t2;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase({});
    await db.clean({ drop: true });

    Test = db.collection({
      name: 'test',
      fields: [
        { type: 'array', name: 'selected' },
        { type: 'string', name: 'name' },
      ],
    });

    await db.sync({ force: true });

    t1 = await Test.repository.create({
      values: {
        selected: ['1', '2', 'a', 'b'],
        name: 't1',
      },
    });

    t2 = await Test.repository.create({
      values: {
        selected: ['11', '22', 'aa', 'bb', 'cc'],
        name: 't2',
      },
    });
  });

  test('array field update', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'array', name: 'tags' }],
    });

    await db.sync({ force: true });

    await Post.repository.create({});
    const p1 = await Post.repository.create({
      values: {
        tags: ['t1', 't2'],
      },
    });

    let result = await Post.repository.findOne({
      filter: {
        'tags.$match': ['t2', 't1'],
      },
    });

    expect(result.get('id')).toEqual(p1.get('id'));

    await Post.repository.update({
      filterByTk: <any>p1.get('id'),
      values: {
        tags: ['t3', 't2'],
      },
    });

    result = await Post.repository.findOne({
      filter: {
        'tags.$match': ['t3', 't2'],
      },
    });

    expect(result.get('id')).toEqual(p1.get('id'));
  });

  test('nested array field', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'hasMany', name: 'posts' },
        { type: 'string', name: 'name' },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'belongsTo', name: 'user' },
        { type: 'string', name: 'title' },
        { type: 'array', name: 'tags' },
      ],
    });

    await db.sync();

    await User.repository.createMany({
      records: [
        {
          name: 'u0',
          posts: [{ title: 'u0p1' }],
        },
        {
          name: 'u1',
          posts: [{ title: 'u1p1', tags: ['t1', 't2'] }],
        },
      ],
    });

    let result = await User.repository.find({
      filter: {
        'posts.tags.$empty': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('name')).toEqual('u0');

    result = await User.repository.find({
      filter: {
        'posts.tags.$anyOf': ['t1'],
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('name')).toEqual('u1');
  });

  test('$match', async () => {
    const filter1 = await Test.repository.find({
      filter: {
        'selected.$match': ['2', '1', 'a', 'b'],
      },
    });

    expect(filter1.length).toEqual(1);
    expect(filter1[0].get('name')).toEqual(t1.get('name'));
  });

  test('$match with $and', async () => {
    const filter1 = await Test.repository.find({
      filter: {
        $and: [
          {
            selected: { $match: ['2', '1', 'a', 'b'] },
          },
        ],
      },
    });

    expect(filter1.length).toEqual(1);
    expect(filter1[0].get('name')).toEqual(t1.get('name'));
  });

  test('$notMatch', async () => {
    const filter2 = await Test.repository.find({
      filter: {
        'selected.$notMatch': ['1', '2', 'a', 'b'],
      },
    });

    expect(filter2.length).toEqual(1);
    expect(filter2[0].get('name')).toEqual(t2.get('name'));
  });

  test('$anyOf with $and', async () => {
    const filter3 = await Test.repository.find({
      filter: {
        $and: [
          {
            'selected.$anyOf': ['aa'],
          },
        ],
      },
    });

    expect(filter3.length).toEqual(1);
    expect(filter3[0].get('name')).toEqual(t2.get('name'));
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

  // fix https://nocobase.height.app/T-2803
  test('$anyOf with string', async () => {
    const filter3 = await Test.repository.find({
      filter: {
        'selected.$anyOf': 'aa',
      },
    });

    expect(filter3.length).toEqual(1);
    expect(filter3[0].get('name')).toEqual(t2.get('name'));
  });

  test('$anyOf with multiple items', async () => {
    const filter3 = await Test.repository.find({
      filter: {
        'selected.$anyOf': ['aa', 'a', '1'],
      },
    });

    expect(filter3.length).toEqual(2);
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

  // fix https://nocobase.height.app/T-2803
  test('$noneOf with string', async () => {
    const filter = await Test.repository.find({
      filter: {
        'selected.$noneOf': 'aa',
      },
    });

    expect(filter.length).toEqual(1);
    expect(filter[0].get('name')).toEqual(t1.get('name'));
  });

  test('$noneOf with null', async () => {
    const t3 = await Test.repository.create({
      values: {
        name: 't3',
        selected: null,
      },
    });

    const filter = await Test.repository.find({
      filter: {
        'selected.$noneOf': ['a', 'aa', '1'],
      },
    });

    expect(filter.length).toEqual(1);
    expect(filter[0].get('name')).toEqual(t3.get('name'));
  });

  test('$empty', async () => {
    const t3 = await Test.repository.create({
      values: {
        name: 't3',
        selected: [],
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
        selected: [],
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
