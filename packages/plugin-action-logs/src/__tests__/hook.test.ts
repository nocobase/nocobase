import Database from '@nocobase/database';
import { registerActions } from '@nocobase/actions';
import { mockServer, MockServer } from '@nocobase/test';
import logPlugin from '../server';

describe('hook', () => {
  let api: MockServer;
  let db: Database;

  beforeEach(async () => {
    api = mockServer();
    api.registerPlugin({
      collections: require('@nocobase/plugin-collections/src/server').default,
      users: require('@nocobase/plugin-users/src/server').default,
      logs: logPlugin,
    });
    registerActions(api);
    await api.loadPlugins();
    db = api.database;
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
    api.agent().set('Authorization', `Bearer ${user.token}`);
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
