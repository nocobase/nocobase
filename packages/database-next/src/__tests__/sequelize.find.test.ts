import { Collection } from '../collection';
import { Database } from '../database';
import { Op } from 'sequelize';
import { mockDatabase } from './index';

describe('sequelize.find', () => {
  let db: Database;
  let Tag: Collection;
  let Post: Collection;

  beforeEach(async () => {
    db = mockDatabase({
      logging: console.log,
      storage: './db.sqlite',
    });

    Tag = db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'name' }],
    });
    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'tags' },
      ],
    });
    await db.sync({ force: true });

    await Tag.repository.createMany([
      { name: 'tag1' },
      { name: 'tag2' },
      { name: 'tag3' },
    ]);
    await Post.repository.createMany([
      {
        name: 'post1',
        tags: [1, 2, 3],
      },
      {
        name: 'post2',
        tags: [1, 2, 3],
      },
      {
        name: 'post3',
        tags: [1, 2, 3],
      },
      {
        name: 'post4',
        tags: [1, 2, 3],
      },
      {
        name: 'post5',
        tags: [1, 2, 3],
      },
      {
        name: 'post6',
        tags: [1, 2, 3],
      },
    ]);
  });

  afterEach(async () => {
    await db.close();
  });

  test('case 1', async () => {
    const posts = await Post.model.findAll<any>({
      where: {
        '$tags.name$': 'tag1',
      },
      include: [{ association: 'tags' }],
    });
    // tags 只输出了 tag1，不符合预期，应该要全部输出
    console.log(JSON.stringify(posts, null, 2));
  });

  it('case 2', async () => {
    const post = await Post.model.findOne<any>({
      where: {
        '$tags.name$': 'tag1',
      },
      subQuery: false,
      include: [{ association: 'tags' }],
    });
    // 同上，tags 只输出了 tag1
    console.log(JSON.stringify(post.tags, null, 2));
  });

  it('case 3', async () => {
    const posts = await Post.model.findAll<any>({
      where: {
        '$tags.name$': {
          [Op.like]: 'tag%',
        },
      },
      subQuery: false,
      include: [{ association: 'tags' }],
      limit: 1,
    });
    // 与 case 4 结合一起看
    // 当使用 JOIN 时，是没办法用 LIMIT 的，因为 JOIN 会有重复
    // limit=1，只输出一条 post，tags 应该全部输出
    console.log(JSON.stringify(posts, null, 2));
  });

  it('case 4', async () => {
    const posts = await Post.model.findAll<any>({
      where: {
        '$tags.name$': {
          [Op.like]: 'tag%',
        },
      },
      include: [{ association: 'tags' }],
      limit: 3,
    });

    // 与 case 3 结合一起看
    // 当使用 JOIN 时，是没办法用 LIMIT 的，因为 JOIN 会有重复
    // 只输出了一条 post，不过这时这条 post 的 tags 全部输出了
    // 理想状态应该是：输出 3 条 posts，每条 post 的 tags 都是完整输出的
    console.log(JSON.stringify(posts, null, 2));
  });

  it('case 5', async () => {
    const result = await Post.model.findAndCountAll<any>({
      where: {
        '$tags.name$': {
          [Op.like]: 'tag%',
        },
      },
      distinct: true,
      subQuery: false,
      limit: 3,
      include: [{ association: 'tags' }],
    });

    // 必须 distinct，不然 count 会有重复
    console.log(result);
  });
});
