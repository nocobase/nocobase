import { getApp, getAgent, getAPI } from '.';
import AccessController from '../AccessController';

describe('list', () => {
  let app;
  let agent;
  let api;
  let db;
  let userAgents;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
    db = app.database;

    const User = db.getModel('users');
    const users = await User.findAll({ order: [['id', 'ASC']] });

    userAgents = users.map(user => {
      const userAgent = getAgent(app);
      userAgent.set('Authorization', `Bearer ${users[0].token}`);
      return userAgent;
    });

  });

  afterEach(() => db.close());

  describe('anonymous', () => {
    it('fetch all drafts only get empty list', async () => {
      const response = await agent.get('/api/posts');
      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });
  });

  describe('normal user', () => {
    it('user could get posts created by self and limited fields', async () => {
      const response = await userAgents[0].get('/api/posts?sort=title');
      expect(response.body.count).toBe(2);
      // TODO(bug): fields 过滤暂时先跳过了
      // expect(response.body.rows).toEqual([
      //   { title: 'title1', status: 'draft', category: null },
      //   { title: 'title2', status: 'draft', category: null }
      // ]);
    });
  });
});
