import Database from '../../database';
import { Collection } from '../../collection';

import { mockDatabase } from '../index';

describe('association operator', () => {
  let db: Database;

  let Group: Collection;

  let User: Collection;
  let Profile: Collection;
  let Post: Collection;
  let Tag: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    Group = db.collection({
      name: 'groups',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'users' },
      ],
    });

    User = db.collection({
      name: 'users',
      fields: [
        { type: 'belongsTo', name: 'group' },

        { type: 'string', name: 'name' },
        {
          type: 'hasMany',
          name: 'posts',
        },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
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

    Tag = db.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsToMany',
          name: 'posts',
        },
      ],
    });

    await db.sync({
      force: true,
    });
  });

  test('nested association', async () => {
    const u1 = await User.repository.create({
      values: {
        name: 'u1',
        posts: [
          {
            title: 'u1p1',
          },
        ],
      },
    });

    const u2 = await User.repository.create({
      values: {
        name: 'u2',
        posts: [
          {
            title: 'u1p1',
          },
          {
            title: 'u1p2',
            tags: [
              {
                name: 't1',
              },
            ],
          },
        ],
      },
    });

    const u3 = await User.repository.create({
      values: {
        name: 'u3',
      },
    });

    let result = await User.repository.find({
      filter: {
        'posts.tags.$exists': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('id')).toEqual(u2.get('id'));

    result = await User.repository.find({
      filter: {
        'posts.tags.id.$exists': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('id')).toEqual(u2.get('id'));
  });

  test('belongs to', async () => {
    const g1 = await Group.repository.create({
      values: {
        name: 'g1',
      },
    });

    const u1 = await User.repository.create({
      values: {
        name: 'u1',
        group: g1['id'],
      },
    });

    const u2 = await User.repository.create({
      values: {
        name: 'u2',
      },
    });

    let result = await User.repository.find({
      filter: {
        'group.id.$exists': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('name')).toEqual(u1.get('name'));

    result = await User.repository.find({
      filter: {
        'group.id.$notExists': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('name')).toEqual(u2.get('name'));
  });

  test('belongs to many', async () => {
    const t1 = await Tag.repository.create({
      values: {
        name: 't1',
      },
    });

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });

    const t3 = await Tag.repository.create({
      values: {
        name: 't3',
      },
    });

    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
      },
    });

    // p2 belongs to many t1 t2
    const p2 = await Post.repository.create({
      values: {
        title: 'p2',
        tags: [t1['id'], t2['id']],
      },
    });

    const p3 = await Post.repository.create({
      values: {
        title: 'p3',
      },
    });

    let result = await Post.repository.find({
      filter: {
        'tags.id.$exists': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('title')).toEqual(p2.get('title'));

    result = await Tag.repository.find({
      filter: {
        'posts.id.$exists': true,
      },
    });

    expect(result.length).toEqual(2);
    expect(result.map((r) => r.get('id'))).toEqual([t1.get('id'), t2.get('id')]);

    result = await Tag.repository.find({
      filter: {
        'posts.id.$notExists': true,
      },
    });
    expect(result.length).toEqual(1);
    expect(result[0].get('id')).toEqual(t3.get('id'));
  });

  test('has many', async () => {
    const u1 = await User.repository.create({
      values: {
        name: 'u1',
        posts: [
          {
            title: 'p1',
          },
          { title: 'p2' },
        ],
      },
    });

    const u2 = await User.repository.create({
      values: {
        name: 'u2',
      },
    });

    const result = await User.repository.find({
      filter: {
        'posts.id.$exists': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('id')).toEqual(u1.get('id'));
  });
});
