import { getApp, getAPI, getAgent } from '.';

describe('hook', () => {
  let app;
  let anonymousAPI;
  let userAPI;
  let db;
  let user;

  beforeEach(async () => {
    app = await getApp();
    db = app.database;

    anonymousAPI = getAPI(getAgent(app));

    const User = db.getModel('users');
    user = await User.create({ nickname: 'a', token: 'token1' });

    const userAgent = getAgent(app);
    userAgent.set('Authorization', `Bearer ${user.token}`);
    userAPI = getAPI(userAgent);
  });

  afterEach(() => db.close());

  describe('common', () => {
    it('create log', async () => {
      await userAPI.resource('posts').create({
        values: { title: 't1' }
      });

      const Post = db.getModel('posts');
      const p1 = await Post.findByPk(1);

      const logs = await p1.getAction_logs();

      expect(logs.length).toBe(1);
      expect(logs[0].get()).toMatchObject({
        type: 'create',
        index: p1.id,
        user_id: user.id,
        collection_name: 'posts'
      });
    });

    it('logs should be scoped (no other model logs)', async () => {
      await userAPI.resource('posts').create({
        values: { title: 't1' }
      });
      await userAPI.resource('posts').update({
        resourceKey: '1',
        values: { title: 't11' }
      });
      await userAPI.resource('posts').create({
        values: { title: 't2' }
      });
      await userAPI.resource('comments').create({
        values: { content: 'c1' }
      });

      const Post = db.getModel('posts');
      const p1 = await Post.findByPk(1);

      const logs = await p1.getAction_logs();
      expect(logs.length).toBe(2);
    });
  });
});
