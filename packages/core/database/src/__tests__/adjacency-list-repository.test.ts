import { mockDatabase } from './';
import Database from '../database';

describe('adjacency list repository', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should append relation parent recursively with belongs to assoc', async () => {
    const Category = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsTo',
          name: 'parent',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          treeChildren: true,
        },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'category', target: 'categories', foreignKey: 'categoryId' },
        { type: 'belongsTo', name: 'category2', target: 'categories', foreignKey: 'categoryId2' },
        { type: 'belongsTo', name: 'category3', target: 'categories', foreignKey: 'categoryId3' },
      ],
    });

    await db.sync();

    await Category.repository.create({
      values: [
        {
          name: 'c1',
          children: [
            {
              name: 'c1-1',
              children: [
                {
                  name: 'c1-1-1',
                },
              ],
            },
            {
              name: 'c12',
            },
          ],
        },
      ],
    });

    const c111 = await Category.repository.findOne({ where: { name: 'c1-1-1' } });

    const p1 = await Post.repository.create({
      values: [
        {
          title: 'p1',
          category: { id: c111.id },
          category2: null,
          category3: { id: c111.id },
        },
      ],
    });

    const p1WithCategory = await Post.repository.findOne({
      appends: [
        'category',
        'category.parent(recursively=true)',
        'category2',
        'category2.parent(recursively=true)',
        'category3',
        'category3.parent(recursively=true)',
      ],
    });

    expect(p1WithCategory.category.parent.name).toBe('c1-1');
    expect(p1WithCategory.category.parent.parent.name).toBe('c1');
    expect(p1WithCategory.category2).toBeNull();
    expect(p1WithCategory.category3.parent.name).toBe('c1-1');
    expect(p1WithCategory.category3.parent.parent.name).toBe('c1');
  });

  it('should append relation parent recursively with belongs to many', async () => {
    const Category = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsTo',
          name: 'parent',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          treeChildren: true,
        },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsToMany', name: 'categories', target: 'categories', through: 'table1' },
        { type: 'belongsToMany', name: 'categories2', target: 'categories', through: 'table2' },
        { type: 'belongsToMany', name: 'categories3', target: 'categories', through: 'table3' },
      ],
    });

    await db.sync();

    await Category.repository.create({
      values: [
        {
          name: 'c1',
          children: [
            {
              name: 'c1-1',
              children: [
                {
                  name: 'c1-1-1',
                },
              ],
            },
            {
              name: 'c12',
            },
          ],
        },
      ],
    });

    const c111 = await Category.repository.findOne({ where: { name: 'c1-1-1' } });

    const p1 = await Post.repository.create({
      values: [
        {
          title: 'p1',
          categories: [{ id: c111.id }],
          categories2: [{ id: c111.id }],
          categories3: [],
        },
      ],
    });

    const p1WithCategory = await Post.repository.findOne({
      appends: [
        'categories',
        'categories.parent(recursively=true)',
        'categories2',
        'categories2.parent(recursively=true)',
        'categories3',
        'categories3.parent(recursively=true)',
      ],
    });

    expect(p1WithCategory.categories[0].parent.name).toBe('c1-1');
    expect(p1WithCategory.categories[0].parent.parent.name).toBe('c1');

    expect(p1WithCategory.categories2[0].parent.name).toBe('c1-1');
    expect(p1WithCategory.categories2[0].parent.parent.name).toBe('c1');
  });

  it('should append parent recursively', async () => {
    const Tree = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsTo',
          name: 'parent',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          treeChildren: true,
        },
      ],
    });

    await db.sync();

    await Tree.repository.create({
      values: [
        {
          name: 'c1',
          children: [
            {
              name: 'c1-1',
              children: [
                {
                  name: 'c1-1-1',
                },
              ],
            },
            {
              name: 'c12',
            },
          ],
        },
      ],
    });

    const c111 = await Tree.repository.findOne({ where: { name: 'c1-1-1' }, appends: ['parent(recursively=true)'] });
    expect(c111.parent.name).toBe('c1-1');
    expect(c111.parent.parent.name).toBe('c1');
  });
});
