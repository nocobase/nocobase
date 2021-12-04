import Database from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import logPlugin from '../server';

describe('hook', () => {
  let api: MockServer;
  let db: Database;

  beforeEach(async () => {
    api = mockServer();
    api.plugin(require('@nocobase/plugin-users').default);
    api.plugin(logPlugin);
    await api.load();
    db = api.db;
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
    await User.create({ nickname: 'a', token: 'token1' });
  });

  afterEach(async () => {
    await api.destroy();
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
    const agent = api.agent()
    agent.set('Authorization', `Bearer token1`);
    const response = await agent.resource('posts').create({
      values: { title: 't1' },
    });
    await agent.resource('posts').update({
      resourceIndex: response.body.data.id,
      values: { title: 't2' },
    });
    await agent.resource('posts').destroy({
      resourceIndex: response.body.data.id,
    });
    const ActionLog = db.getModel('action_logs');
    const count = await ActionLog.count();
    expect(count).toBe(3);
  });
});
