import Database from '@nocobase/database';
import Application from '@nocobase/server';
import { getApp, getAPI, getAgent } from '.';

describe('hook', () => {
  let app: Application;
  let db: Database;
  let api;

  beforeEach(async () => {
    app = await getApp();
    db = app.database;
    db.table({
      name: 'posts',
      logging: true,
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'string',
          name: 'status',
          defaultValue: 'draft',
        },
      ]
    });
    await db.sync();
    const User = db.getModel('users');
    const user = await User.create({ nickname: 'a', token: 'token1' });
    console.log('beforeEach', user);
    const userAgent = getAgent(app);
    userAgent.set('Authorization', `Bearer ${user.token}`);
    api = getAPI(userAgent);
  });

  afterEach(async () => {
    await db.close();
  });

  it('database', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create({ title: 't1' });
    await post.update({title: 't2'});
    await post.destroy();
    const ActionLog = db.getModel('action_logs');
    const count = await ActionLog.count();
    expect(count).toBe(3);
  });

  it('resource', async () => {
    const response = await api.resource('posts').create({
      values: { title: 't1' },
    });
    await api.resource('posts').update({
      resourceKey: response.body.data.id,
      values: { title: 't2' },
    });
    await api.resource('posts').destroy({
      resourceKey: response.body.data.id,
    });
    const ActionLog = db.getModel('action_logs');
    const count = await ActionLog.count();
    expect(count).toBe(3);
  });
});
