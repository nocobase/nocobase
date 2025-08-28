/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { createMockDatabase } from '@nocobase/database';
import { EagerLoadingTree } from '../../eager-loading/eager-loading-tree';

const skipSqlite = process.env.DB_DIALECT == 'sqlite' ? it.skip : it;

describe('Eager loading tree', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createMockDatabase({
      tablePrefix: '',
    });

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should sort has many default by primary key', async () => {
    const Source = db.collection({
      name: 'source',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'hasMany',
          name: 'targets',
          target: 'target',
          foreignKey: 'source_id',
        },
      ],
    });

    const Target = db.collection({
      name: 'target',
      fields: [{ type: 'integer', name: 'seq_number' }],
    });

    await db.sync();

    const target1 = await Target.repository.create({ values: { seq_number: 1 } });
    const target2 = await Target.repository.create({ values: { seq_number: 3 } });

    await target1.update({ values: { seq_number: 2 } });

    await Source.repository.create({
      updateAssociationValues: ['targets'],
      values: { name: 's1', targets: [{ id: target2.get('id') }, { id: target1.get('id') }] },
    });

    const source = await Source.repository.findOne({
      appends: ['targets'],
    });

    expect(source.get('targets').map((item: any) => item.get('id'))).toEqual([1, 2]);
  });

  it('should sort belongs to many default by target primary key', async () => {
    const Through = db.collection({
      name: 'through',
      fields: [{ type: 'string', name: 'name' }],
    });

    const Source = db.collection({
      name: 'source',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsToMany',
          name: 'targets',
          target: 'target',
          through: 'through',
          foreignKey: 'source_id',
          otherKey: 'target_id',
          sourceKey: 'id',
          targetKey: 'id',
        },
      ],
    });

    const Target = db.collection({
      name: 'target',
      fields: [{ type: 'integer', name: 'seq_number' }],
    });

    await db.sync({
      force: true,
    });

    const targets = await Target.repository.create({
      values: [
        { seq_number: 1 },
        { seq_number: 2 },
        { seq_number: 3 },
        { seq_number: 4 },
        { seq_number: 5 },
        { seq_number: 6 },
      ],
    });

    await Source.repository.create({
      updateAssociationValues: ['targets'],
      values: {
        name: 'source1',
        targets: [targets[2], targets[0], targets[1]],
      },
    });

    const source = await Source.repository.findOne({
      appends: ['targets'],
    });

    expect(source.targets.map((t) => t.get('id'))).toEqual([1, 2, 3]);
  });

  it('should handle eager loading with long field', async () => {
    const Through = db.collection({
      name: 'abc_abcd_abcd_abcdefg_abc_abc_a_abcdefghijk',
    });

    const A = db.collection({
      name: 'a',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsToMany',
          name: 'bs',
          target: 'b',
          through: 'abc_abcd_abcd_abcdefg_abc_abc_a_abcdefghijk',
          foreignKey: 'abc_abcd_abcdefg_abcd_abc',
          sourceKey: 'id',
          otherKey: 'b_id',
          targetKey: 'id',
        },
      ],
    });

    const B = db.collection({
      name: 'b',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    await A.repository.create({
      updateAssociationValues: ['bs'],
      values: {
        name: 'a1',
        bs: [{ name: 'b1' }, { name: 'b2' }],
      },
    });

    const a = await A.repository.findOne({
      appends: ['bs'],
    });

    expect(a.get('bs')).toHaveLength(2);
    const data = a.toJSON();

    // @ts-ignore
    const as = A.model.associations.bs.oneFromTarget.as;

    expect(data['bs'][0][as]).toBeDefined();
  });

  it('should handle fields filter', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'profile' },
      ],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [
        { type: 'integer', name: 'age' },
        { type: 'string', name: 'address' },
      ],
    });

    await db.sync();

    const users = await User.repository.create({
      updateAssociationValues: ['profile'],
      values: [
        {
          name: 'u1',
          profile: { age: 1, address: 'u1 address' },
        },
        {
          name: 'u2',
          profile: { age: 2, address: 'u2 address' },
        },
      ],
    });

    const findOptions = User.repository.buildQueryOptions({
      fields: ['profile', 'profile.age', 'name'],
    });

    const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions({
      model: User.model,
      rootAttributes: findOptions.attributes,
      includeOption: findOptions.include,
      db: db,
      rootQueryOptions: findOptions,
    });

    await eagerLoadingTree.load();
    const root = eagerLoadingTree.root;

    const u1 = root.instances.find((item) => item.get('name') === 'u1');
    const data = u1.toJSON();
    expect(data['id']).not.toBeDefined();
    expect(data['name']).toBeDefined();
    expect(data['profile']).toBeDefined();
    expect(data['profile']['age']).toBeDefined();
  });

  it('should load has many', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    await db.sync();

    await User.repository.create({
      updateAssociationValues: ['posts'],
      values: [
        {
          name: 'u1',
          posts: [{ title: 'u1p1' }, { title: 'u1p2' }],
        },
        {
          name: 'u2',
          posts: [{ title: 'u2p1' }, { title: 'u2p2' }],
        },
      ],
    });

    const findOptions = User.repository.buildQueryOptions({
      appends: ['posts'],
    });

    const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions({
      model: User.model,
      rootAttributes: findOptions.attributes,
      includeOption: findOptions.include,
      db: db,
      rootQueryOptions: findOptions,
    });

    await eagerLoadingTree.load();

    const root = eagerLoadingTree.root;
    const u1 = root.instances.find((item) => item.get('name') === 'u1');
    const u1Posts = u1.get('posts') as any;
    expect(u1Posts.length).toBe(2);

    const u1JSON = u1.toJSON();
    expect(u1JSON['posts'].length).toBe(2);
  });

  it('should load has one', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'profile' },
      ],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [{ type: 'integer', name: 'age' }],
    });

    await db.sync();

    const users = await User.repository.create({
      updateAssociationValues: ['profile'],
      values: [
        {
          name: 'u1',
          profile: { age: 1 },
        },
        {
          name: 'u2',
          profile: { age: 2 },
        },
      ],
    });

    const findOptions = User.repository.buildQueryOptions({
      appends: ['profile'],
    });

    const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions({
      model: User.model,
      rootAttributes: findOptions.attributes,
      includeOption: findOptions.include,
      db: db,
      rootQueryOptions: findOptions,
    });

    await eagerLoadingTree.load();

    const root = eagerLoadingTree.root;
    const u1 = root.instances.find((item) => item.get('name') === 'u1');
    const u1Profile = u1.get('profile') as any;
    expect(u1Profile).toBeDefined();
    expect(u1Profile.get('age')).toBe(1);
  });

  it('should load belongs to', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });

    const User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    await Post.repository.create({
      updateAssociationValues: ['user'],
      values: [
        {
          title: 'p1',
          user: {
            name: 'u1',
          },
        },
        {
          title: 'p2',
          user: {
            name: 'u2',
          },
        },
      ],
    });

    const findOptions = Post.repository.buildQueryOptions({
      appends: ['user'],
    });

    const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions({
      model: Post.model,
      rootAttributes: findOptions.attributes,
      includeOption: findOptions.include,
      db: db,
      rootQueryOptions: findOptions,
    });

    await eagerLoadingTree.load();

    const root = eagerLoadingTree.root;
    const p1 = root.instances.find((item) => item.get('title') === 'p1');
    const p1User = p1.get('user') as any;
    expect(p1User).toBeDefined();
    expect(p1User.get('name')).toBe('u1');
  });

  skipSqlite('should load belongs to on bigint foreign key', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });

    const User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    await Post.repository.create({
      updateAssociationValues: ['user'],
      values: [
        {
          title: 'p1',
          user: {
            name: 'u1',
          },
        },
        {
          title: 'p2',
          user: {
            id: '19051207196672111',
            name: 'u2',
          },
        },
      ],
    });

    const findOptions = Post.repository.buildQueryOptions({
      appends: ['user'],
    });

    const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions({
      model: Post.model,
      rootAttributes: findOptions.attributes,
      includeOption: findOptions.include,
      db: db,
      rootQueryOptions: findOptions,
    });

    await eagerLoadingTree.load();

    const root = eagerLoadingTree.root;
    const p1 = root.instances.find((item) => item.get('title') === 'p1');
    const p1User = p1.get('user') as any;
    expect(p1User).toBeDefined();
    expect(p1User.get('name')).toBe('u1');

    const p2 = root.instances.find((item) => item.get('title') === 'p2');
    const p2User = p2.get('user') as any;
    expect(p2User).toBeDefined();
    expect(p2User.get('name')).toBe('u2');
  });

  it('should load belongs to many', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsToMany', name: 'tags' },
      ],
    });

    const Tag = db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    const tags = await Tag.repository.create({
      values: [
        {
          name: 't1',
        },
        {
          name: 't2',
        },
        {
          name: 't3',
        },
      ],
    });

    await Post.repository.create({
      values: [
        {
          title: 'p1',
          tags: [{ id: tags[0].id }, { id: tags[1].id }],
        },
        {
          title: 'p2',
          tags: [{ id: tags[1].id }, { id: tags[2].id }],
        },
      ],
    });

    const findOptions = Post.repository.buildQueryOptions({
      appends: ['tags'],
    });

    const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions({
      model: Post.model,
      rootAttributes: findOptions.attributes,
      includeOption: findOptions.include,
      db: db,
      rootQueryOptions: findOptions,
    });

    await eagerLoadingTree.load();
    const root = eagerLoadingTree.root;

    const p1 = root.instances.find((item) => item.get('title') === 'p1');
    const p1Tags = p1.get('tags') as any;
    expect(p1Tags).toBeDefined();
    expect(p1Tags.length).toBe(2);
    expect(p1Tags.map((t) => t.get('name'))).toEqual(['t1', 't2']);

    const p2 = root.instances.find((item) => item.get('title') === 'p2');
    const p2Tags = p2.get('tags') as any;
    expect(p2Tags).toBeDefined();
    expect(p2Tags.length).toBe(2);
    expect(p2Tags.map((t) => t.get('name'))).toEqual(['t2', 't3']);
  });

  it('should build eager loading tree', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'posts',
        },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        {
          type: 'array',
          name: 'tags',
        },
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
        },
      ],
    });

    const Tag = db.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'tagCategory' },
      ],
    });

    const TagCategory = db.collection({
      name: 'tagCategories',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    await User.repository.create({
      updateAssociationValues: ['posts', 'posts.tags', 'posts.tags.tagCategory'],
      values: [
        {
          name: 'u1',
          posts: [
            {
              title: 'u1p1',
              tags: [
                { name: 't1', tagCategory: { name: 'c1' } },
                { name: 't2', tagCategory: { name: 'c2' } },
              ],
            },
          ],
        },
        {
          name: 'u2',
          posts: [
            {
              title: 'u2p1',
              tags: [
                { name: 't3', tagCategory: { name: 'c3' } },
                { name: 't4', tagCategory: { name: 'c4' } },
              ],
            },
          ],
        },
      ],
    });

    const findOptions = User.repository.buildQueryOptions({
      appends: ['posts.tags.tagCategory'],
    });

    const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions({
      model: User.model,
      rootAttributes: findOptions.attributes,
      includeOption: findOptions.include,
      db: db,
      rootQueryOptions: findOptions,
    });

    expect(eagerLoadingTree.root.children).toHaveLength(1);
    expect(eagerLoadingTree.root.children[0].model).toBe(Post.model);
    expect(eagerLoadingTree.root.children[0].children[0].model).toBe(Tag.model);
    expect(eagerLoadingTree.root.children[0].children[0].children[0].model).toBe(TagCategory.model);

    await eagerLoadingTree.load();

    expect(eagerLoadingTree.root.instances).toHaveLength(2);
    const u1 = eagerLoadingTree.root.instances.find((item) => item.get('name') === 'u1');
    expect(u1.get('posts')).toHaveLength(1);
    expect(u1.get('posts')[0].get('tags')).toHaveLength(2);
    expect(u1.get('posts')[0].get('tags')[0].get('tagCategory')).toBeDefined();
    expect(u1.get('posts')[0].get('tags')[0].get('tagCategory').get('name')).toBe('c1');
  });
});
