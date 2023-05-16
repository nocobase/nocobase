import Database, { mockDatabase } from '@nocobase/database';
import { EagerLoadingTree } from '../../eager-loading/eager-loading-tree';

describe('Eager loading tree', () => {
  let db: Database;
  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
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

    const eagerLoadingTree = EagerLoadingTree.buildFromSequelizeOptions(User.model, findOptions.include);
    expect(eagerLoadingTree.root.children).toHaveLength(1);
    expect(eagerLoadingTree.root.children[0].model).toBe(Post.model);
    expect(eagerLoadingTree.root.children[0].children[0].model).toBe(Tag.model);
    expect(eagerLoadingTree.root.children[0].children[0].children[0].model).toBe(TagCategory.model);
  });
});
