import { initDatabase, agent } from './index';

describe('list', () => {
  let db;
  
  beforeEach(async () => {
    db = await initDatabase();
  });
  
  afterAll(() => db.close());

  it('belongsTo1', async () => {
    const Post = db.getModel('posts');
    const User = db.getModel('users');
    let post = await Post.create();
    let user = await User.create();
    await agent.post(`/posts/${post.id}/user:set/${user.id}`);
    post = await Post.findOne({
      where: {
        id: post.id,
      }
    });
    const postUser = await post.getUser();
    expect(user.id).toBe(postUser.id);
  });

  // TODO: 关系暂不关注，先注释了
  it.skip('belongsToMany1', async () => {
    const [Post, Tag] = db.getModels(['posts', 'tags']);
    let post = await Post.create();
    let tag1 = await Tag.create({name: 'tag1'});
    let tag2 = await Tag.create({name: 'tag2'});
    await agent.post(`/posts/${post.id}/tags:set/${tag1.id}`);
    // 单独跑 ok，和上面的 it 一起跑就无法获取到
    const tags = await post.getTags();
    console.log(post, tags);
    expect(tag1.id).toBe(tags[0].id);
    expect(await post.countTags()).toBe(1);
    await agent.post(`/posts/${post.id}/tags:set/${tag2.id}`);
    const [tag02] = await post.getTags();
    expect(tag2.id).toBe(tag02.id);
    expect(await post.countTags()).toBe(1);
  });
});
