import { initDatabase, agent } from './index';

describe('remove', () => {
  let db;
  
  beforeEach(async () => {
    db = await initDatabase();
  });
  
  afterAll(() => db.close());

  it('hasOne1', async () => {
    const User = db.getModel('users');
    const user = await User.create();
    await user.updateAssociations({
      profile: {
        email: 'email1122',
      }
    });
    const response = await agent
      .post(`/users/${user.id}/profile:remove`);
    const profile = await user.getProfile();
    expect(profile).toBeNull();
  });

  it('hasMany1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      comments: [
        {content: 'content111222'},
      ],
    });
    let [comment] = await post.getComments();
    await agent
      .post(`/posts/${post.id}/comments:remove/${comment.id}`);
    const count = await post.countComments();
    expect(count).toBe(0);
  });

  it('belongsTo1', async () => {
    const Post = db.getModel('posts');
    let post = await Post.create();
    await post.updateAssociations({
      user: {name: 'name121234'},
    });
    await agent.post(`/posts/${post.id}/user:remove`);
    post = await Post.findOne({
      where: {
        id: post.id,
      }
    });
    const user = await post.getUser();
    expect(user).toBeNull();
  });

  it('belongsToMany', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      tags: [
        {
          name: 'tag112233',
          posts_tags: {
            test: 'test1',
          }
        },
      ],
    });
    const [tag] = await post.getTags();
    await agent
      .delete(`/posts/${post.id}/tags:remove/${tag.id}`);
    const tags = await post.getTags();
    expect(tags.length).toBe(0);
  });
});
