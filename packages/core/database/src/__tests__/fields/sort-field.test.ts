import { Database } from '../../database';
import { mockDatabase } from '../';
import { SortField } from '../../fields';

describe('sort field', () => {
  let db: Database;
  const assertUserSort = (users, userName, sort) => {
    const user = users.find((u) => u.name === userName);
    expect(user.sort).toBe(sort);
  };

  beforeEach(async () => {
    db = mockDatabase({
      tablePrefix: '',
    });
    await db.clean({ drop: true });
    db.registerFieldTypes({
      sort: SortField,
    });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should set association scope key on data has no associations', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasMany',
          name: 'profiles',
        },
      ],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [
        { type: 'integer', name: 'age' },
        { type: 'string', name: 'level' },
      ],
    });

    await db.sync();

    const u1 = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

    User.setField('sort', {
      name: 'sort',
      type: 'sort',
      scopeKey: 'profiles.level',
    });

    await db.sync();
  });

  it('should support nested association as scope key in init record', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasMany',
          name: 'profiles',
        },
      ],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [
        { type: 'integer', name: 'age' },
        {
          type: 'belongsTo',
          name: 'user',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
        },
      ],
    });

    const tags = db.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsToMany',
          name: 'profiles',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        { name: 'u1', profiles: [{ age: 10, tags: [{ name: 't1' }] }] },
        { name: 'u2', profiles: [{ age: 20, tags: [{ name: 't2' }] }] },
        { name: 'u3', profiles: [{ age: 30, tags: [{ name: 't1' }] }] },
        { name: 'u4', profiles: [{ age: 40, tags: [{ name: 't2' }] }] },
      ],
    });

    User.setField('sort', {
      name: 'sort',
      type: 'sort',
      scopeKey: 'profiles.tags.name',
    });

    await db.sync();
  });

  it('should support belongs to many field as scope key in init record', async () => {
    const UserProfile = db.collection({
      name: 'user_profile',
      fields: [],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [
        { type: 'integer', name: 'age' },
        {
          type: 'string',
          name: 'category',
        },
        {
          type: 'belongsToMany',
          name: 'user',
          target: 'users',
          through: 'user_profile',
          foreignKey: 'profile_id',
          otherKey: 'user_id',
        },
      ],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsToMany',
          name: 'profile',
          target: 'profiles',
          through: 'user_profile',
          foreignKey: 'user_id',
          otherKey: 'profile_id',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: {
        name: 'u1',
        profile: [{ age: 18, category: 'c1' }],
      },
    });

    await User.repository.create({
      values: {
        name: 'u2',
        profile: [{ age: 18, category: 'c2' }],
      },
    });

    await User.repository.create({
      values: {
        name: 'u3',
        profile: [{ age: 20, category: 'c1' }],
      },
    });

    await User.repository.create({
      values: {
        name: 'u4',
        profile: [{ age: 20, category: 'c2' }],
      },
    });

    User.setField('sort', {
      type: 'sort',
      scopeKey: 'profile.category',
    });

    await db.sync();

    const users = await User.repository.find({});
    assertUserSort(users, 'u1', 1);
    assertUserSort(users, 'u2', 1);
    assertUserSort(users, 'u3', 2);
    assertUserSort(users, 'u4', 2);
  });

  it('should support belongs to many field as scope key in set field value', async () => {
    const UserProfile = db.collection({
      name: 'user_profile',
      fields: [],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [
        { type: 'integer', name: 'age' },
        {
          type: 'string',
          name: 'category',
        },
        {
          type: 'belongsToMany',
          name: 'user',
          target: 'users',
          through: 'user_profile',
          foreignKey: 'profile_id',
          otherKey: 'user_id',
        },
      ],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsToMany',
          name: 'profile',
          target: 'profiles',
          through: 'user_profile',
          foreignKey: 'user_id',
          otherKey: 'profile_id',
        },
        {
          type: 'sort',
          name: 'sort',
          scopeKey: 'profile.category',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: {
        name: 'u1',
        profile: [{ age: 18, category: 'c1' }],
      },
    });

    await User.repository.create({
      values: {
        name: 'u2',
        profile: [{ age: 18, category: 'c2' }],
      },
    });

    await User.repository.create({
      values: {
        name: 'u3',
        profile: [{ age: 20, category: 'c1' }],
      },
    });

    await User.repository.create({
      values: {
        name: 'u4',
        profile: [{ age: 20, category: 'c2' }],
      },
    });

    const users = await User.repository.find({});
    assertUserSort(users, 'u1', 1);
    assertUserSort(users, 'u2', 1);
    assertUserSort(users, 'u3', 2);
    assertUserSort(users, 'u4', 2);
  });

  it('should support association field as scope key in init records sort value ', async () => {
    const Group = db.collection({
      name: 'groups',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasMany',
          name: 'users',
          foreignKey: 'group_id',
        },
      ],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsTo',
          name: 'group',
          target: 'groups',
          foreignKey: 'group_id',
        },
      ],
    });

    await db.sync();

    await Group.repository.create({
      values: [
        {
          name: 'g1',
          users: [{ name: 'g1u1' }, { name: 'g1u2' }],
        },
      ],
    });

    await Group.repository.create({
      values: [
        {
          name: 'g2',
          users: [{ name: 'g2u1' }, { name: 'g2u2' }],
        },
      ],
    });

    // add sort field
    User.setField('sort', { type: 'sort', scopeKey: 'group.name' });
    await db.sync();

    const users = await User.repository.find({});

    assertUserSort(users, 'g1u1', 1);
    assertUserSort(users, 'g1u2', 2);
    assertUserSort(users, 'g2u1', 1);
    assertUserSort(users, 'g2u2', 2);
  });

  it('should support association field as scope key in set sort value', async () => {
    const Group = db.collection({
      name: 'groups',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasMany',
          name: 'users',
          foreignKey: 'group_id',
        },
      ],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsTo',
          name: 'group',
          target: 'groups',
          foreignKey: 'group_id',
        },
        {
          type: 'sort',
          name: 'sort',
          scopeKey: 'group.name',
        },
      ],
    });

    await db.sync();

    await Group.repository.create({
      values: [
        {
          name: 'g1',
          users: [{ name: 'g1u1' }, { name: 'g1u2' }],
        },
      ],
    });

    await Group.repository.create({
      values: [
        {
          name: 'g2',
          users: [{ name: 'g2u1' }, { name: 'g2u2' }],
        },
      ],
    });

    const users = await User.repository.find({});

    assertUserSort(users, 'g1u1', 1);
    assertUserSort(users, 'g1u2', 2);
    assertUserSort(users, 'g2u1', 1);
    assertUserSort(users, 'g2u2', 2);
  });

  it.skip('should init sorted value with thousand records', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'group',
        },
      ],
    });

    await db.sync();

    await Test.model.bulkCreate(
      (() => {
        const values = [];
        for (let i = 0; i < 100000; i++) {
          values.push({
            group: 'a',
            name: `r${i}`,
          });

          values.push({
            group: 'b',
            name: `r${i}`,
          });
        }
        return values;
      })(),
    );

    Test.setField('sort', { type: 'sort', scopeKey: 'group' });

    const begin = Date.now();
    await db.sync();
    const end = Date.now();
    // log time cost as milliseconds
    console.log(end - begin);
  });

  it('should init sorted value with scopeKey', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'group',
        },
      ],
    });

    await db.sync();
    await Test.repository.create({
      values: [
        {
          group: 'a',
          name: 'r1',
        },
        {
          group: 'b',
          name: 'r2',
        },
        {
          group: 'a',
          name: 'r3',
        },
        {
          group: 'b',
          name: 'r4',
        },
        {
          group: null,
          name: 'r5',
        },
        {
          group: null,
          name: 'r6',
        },
      ],
    });

    Test.setField('sort', { type: 'sort', scopeKey: 'group' });

    await db.sync();

    const records = await Test.repository.find({});
    const r3 = records.find((r) => r.get('name') === 'r3');
    expect(r3.get('sort')).toBe(2);
    const r5 = records.find((r) => r.get('name') === 'r5');
    expect(r5.get('sort')).toBe(1);
  });

  it('should init sorted value by createdAt when primaryKey not exists', async () => {
    const Test = db.collection({
      autoGenId: false,
      name: 'tests',
    });

    await db.sync();
    await Test.repository.create({
      values: [{}, {}, {}],
    });

    // add sort field
    Test.setField('sort', { type: 'sort' });

    let err;
    try {
      await db.sync();
    } catch (e) {
      err = e;
    }
    expect(err).toBeFalsy();
  });

  it('sort', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ type: 'sort', name: 'sort' }],
    });
    await db.sync();

    const test1 = await Test.model.create<any>();
    expect(test1.sort).toBe(1);
    const test2 = await Test.model.create<any>();
    expect(test2.sort).toBe(2);
    const test3 = await Test.model.create<any>();
    expect(test3.sort).toBe(3);
  });

  it('should init sort value on data already exits', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await db.sync();

    await db.getRepository('tests').create({
      values: {
        name: 't1',
      },
    });
    await db.getRepository('tests').create({
      values: {
        name: 't2',
      },
    });
    await db.getRepository('tests').create({
      values: {
        name: 't3',
      },
    });

    const field = Test.addField('sort', { type: 'sort' });

    await field.sync({});

    const items = await db.getRepository('tests').find({
      order: ['id'],
    });
    expect(items.map((item) => item.get('sort'))).toEqual([1, 2, 3]);
  });

  test.skip('simultaneously create ', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ type: 'sort', name: 'sort' }],
    });

    await db.sync();

    const promise = [];
    for (let i = 0; i < 3; i++) {
      promise.push(Test.model.create());
    }

    await Promise.all(promise);
    const tests = await Test.model.findAll();
    const sortValues = tests.map((t) => t.get('sort')).sort();
    expect(sortValues).toEqual([1, 2, 3]);
  });

  it('skip if sort value not empty', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ type: 'sort', name: 'sort' }],
    });
    await db.sync();
    const test1 = await Test.model.create<any>({ sort: 3 });
    expect(test1.sort).toBe(3);
    const test2 = await Test.model.create<any>();
    expect(test2.sort).toBe(4);
    const test3 = await Test.model.create<any>();
    expect(test3.sort).toBe(5);
  });

  it('scopeKey', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        { type: 'sort', name: 'sort', scopeKey: 'status' },
        { type: 'string', name: 'status' },
      ],
    });

    await db.sync();

    const t1 = await Test.model.create({ status: 'publish' });
    const t2 = await Test.model.create({ status: 'publish' });
    const t3 = await Test.model.create({ status: 'draft' });
    const t4 = await Test.model.create({ status: 'draft' });

    expect(t1.get('sort')).toBe(1);
    expect(t2.get('sort')).toBe(2);
    expect(t3.get('sort')).toBe(1);
    expect(t4.get('sort')).toBe(2);

    t1.set('status', 'draft');
    await t1.save();

    await t1.reload();
    expect(t1.get('sort')).toBe(3);
  });
});
