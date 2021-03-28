import { initDatabase, agent } from './index';

describe('destroy', () => {
  let db;

  beforeEach(async () => {
    db = await initDatabase();
  });

  afterAll(() => db.close());

  describe('single', () => {
    it('common1', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      const response = await agent
        .delete(`/posts/${post.id}`);
      // console.log(response.body);
      expect(response.body.count).toBe(1);
    });

    it('batch delete by filter', async () => {
      const Post = db.getModel('posts');
      const posts = await Post.bulkCreate([
        { title: 'title1', status: 'published' },
        { title: 'title2', status: 'draft' },
        { title: 'title3', status: 'published' },
        { title: 'title4', status: 'draft' },
      ]);

      await agent
        .delete('/posts?filter[status]=draft');

      const published = await Post.findAll();
      expect(published.length).toBe(2);
      expect(published.map(({ title, status }) => ({ title, status }))).toEqual([
        { title: 'title1', status: 'published' },
        { title: 'title3', status: 'published' }
      ]);
    });
  });

  describe('hasOne', () => {
    it('delete has-one item', async () => {
      const User = db.getModel('users');
      const user = await User.create();
      await user.updateAssociations({
        profile: {
          email: 'email1122',
        }
      });
      const response = await agent
        .delete(`/users/${user.id}/profile`);
      const profile = await user.getProfile();
      expect(profile).toBeNull();
    });
  });

  describe('hasMany', () => {
    it('delete single item in has-many list', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      await post.updateAssociations({
        comments: [
          { content: 'content111222' },
        ],
      });
      const [comment] = await post.getComments();
      await agent
        .delete(`/posts/${post.id}/comments/${comment.id}`);
      const count = await post.countComments();
      expect(count).toBe(0);
    });

    it('delete batch items in has-many list', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      await post.updateAssociations({
        comments: [
          { content: 'content1', status: 'published' },
          { content: 'content2', status: 'draft' },
          { content: 'content3', status: 'published' },
          { content: 'content4', status: 'draft' },
        ],
      });
      await agent
        .delete(`/posts/${post.id}/comments?filter[status]=draft`);
      const comments = await post.getComments();
      expect(comments.length).toBe(2);
      expect(comments.map(({ content }) => content)).toEqual(['content1', 'content3']);
    });
  });

  describe('belongsTo', () => {
    it('delete belongs-to item', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      await post.updateAssociations({
        user: { name: 'name121234' },
      });
      await agent.delete(`/posts/${post.id}/user:destroy`);
      const user = await post.getUser();
      expect(user).toBeNull();
    });
  });

  describe('belongsToMany', () => {
    it('delete single target item', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      await post.updateAssociations({
        tags: [
          { name: 'tag112233' },
        ],
      });
      const [tag] = await post.getTags();
      await agent
        .delete(`/posts/${post.id}/tags:destroy/${tag.id}`);
      const tags = await post.getTags();
      expect(tags.length).toBe(0);

      const PostsTags = db.getModel('posts_tags');
      const postsTags = await PostsTags.findAll();
      expect(postsTags.length).toBe(0);
    });

    it('delete batch target item by filter', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      await post.updateAssociations({
        tags: [
          { name: 'tag1', status: 'enabled' },
          { name: 'tag2', status: 'disabled' },
          { name: 'tag3', status: 'enabled' },
          { name: 'tag4', status: 'disabled' },
        ],
      });
      await agent
        .delete(`/posts/${post.id}/tags:destroy?filter[status]=disabled`);
      const tags = await post.getTags();
      expect(tags.length).toBe(2);

      const PostsTags = db.getModel('posts_tags');
      const postsTags = await PostsTags.findAll();
      expect(postsTags.length).toBe(2);
    });
  });
});
