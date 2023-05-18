import Database, { mockDatabase } from '@nocobase/database';
import { EagerLoadingTree } from '../../eager-loading/eager-loading-tree';

describe('Eager loading tree', () => {
  let db: Database;
  beforeEach(async () => {
    db = mockDatabase({
      tablePrefix: '',
    });

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
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
    });

    await eagerLoadingTree.load([1, 2]);

    const root = eagerLoadingTree.root;
    const u1 = root.instances.find((item) => item.get('name') === 'u1');
    const u1Posts = u1.get('posts') as any;
    expect(u1Posts.length).toBe(2);

    const u1JSON = u1.toJSON();
    expect(u1JSON['posts'].length).toBe(2);
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
    });

    await eagerLoadingTree.load([1, 2]);

    const root = eagerLoadingTree.root;
    const p1 = root.instances.find((item) => item.get('title') === 'p1');
    const p1User = p1.get('user') as any;
    expect(p1User).toBeDefined();
    expect(p1User.get('name')).toBe('u1');
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

    await Post.repository.create({
      values: [
        {
          title: 'p1',
          tags: [{ name: 't1' }, { name: 't2' }],
        },
        {
          title: 'p2',
          tags: [{ name: 't1' }, { name: 't3' }],
        },
      ],
    });

    const findOptions = Post.repository.buildQueryOptions({
      fields: ['tags', 'title'],
    });

    const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions({
      model: Post.model,
      rootAttributes: findOptions.attributes,
      includeOption: findOptions.include,
    });
    await eagerLoadingTree.load([1, 2]);
    const root = eagerLoadingTree.root;
    const p1 = root.instances.find((item) => item.get('title') === 'p1');
    const p1Tags = p1.get('tags');
    console.log(p1Tags);
    // const p2 = root.instances.find((item) => item.get('title') === 'p2');
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
      fields: ['posts.tags.tagCategory'],
    });

    const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions({
      model: User.model,
      rootAttributes: findOptions.attributes,
      includeOption: findOptions.include,
    });

    expect(eagerLoadingTree.root.children).toHaveLength(1);
    expect(eagerLoadingTree.root.children[0].model).toBe(Post.model);
    expect(eagerLoadingTree.root.children[0].children[0].model).toBe(Tag.model);
    expect(eagerLoadingTree.root.children[0].children[0].children[0].model).toBe(TagCategory.model);

    const result = await eagerLoadingTree.load(
      (await User.model.findAll()).map((item) => item[User.model.primaryKeyAttribute]),
    );

    console.log({ result });
  });
});
