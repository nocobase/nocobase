import { literal } from 'sequelize';
import { getDatabase } from '..';
import Database from '../../database';
import Model, { ModelCtor } from '../../model';


let db: Database;
beforeAll(async () => {
  db = getDatabase();
  db.table({
    name: 'users',
    fields: [
      {
        type: 'string',
        name: 'name'
      },
    ]
  });
  db.table({
    name: 'posts',
    fields: [
      {
        type: 'belongsTo',
        name: 'user'
      },
      {
        type: 'string',
        name: 'status',
        defaultValue: 'published',
      },
      {
        type: 'integer',
        name: 'sort'
      },
    ],
    sortable: true
  });
  db.table({
    name: 'comments',
    fields: [
      {
        type: 'belongsTo',
        name: 'user'
      },
      {
        type: 'belongsTo',
        name: 'post'
      },
      {
        type: 'string',
        name: 'status',
        defaultValue: 'published',
      },
      {
        type: 'integer',
        name: 'sort'
      },
    ],
    sortable: true,
    sortField: {
      name: 'sort',
      scope: ['user'],
    }
  });

  await db.sync({
    force: true,
  });
});

afterAll(() => db.close());



describe('setSortValueHook', () => {
  it('first sort value should be 1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create({});
    expect(post.sort).toBe(1);
  });

  it('sort value under scope', async () => {
    const User = db.getModel('users');
    const Comment = db.getModel('comments');
    const user = await User.create({});
    await Comment.create({});
    await Comment.create({ user_id: 1 });
    await Comment.create({});
    await Comment.create({ user_id: 1 });
    const comments = await Comment.findAll();
    expect(comments.map(({ id, sort }) => ({ id, sort }))).toEqual([
      { id: 1, sort: 1 },
      { id: 2, sort: 1 },
      { id: 3, sort: 2 },
      { id: 4, sort: 2 },
    ]);
  });

  // TODO(bug): 暂不支持批量创建时自动生成排序值
  // bulkCreate 如果要调用 individualHooks 一是比较消耗性能，
  // 另一个是在 insert 之前都拿不到新的最大排序值。同时使用起来
  // 要固定传参不是很方便。所以可能需要特殊实现。
  it.skip('bulkCreate should be sequenced', async () => {
    const Post = db.getModel('posts');
    const posts = await Post.bulkCreate([{}, {}, {}], { individualHooks: true });
    expect(posts.map(({ sort }) => sort)).toEqual([1,2,3]);
  });
});
