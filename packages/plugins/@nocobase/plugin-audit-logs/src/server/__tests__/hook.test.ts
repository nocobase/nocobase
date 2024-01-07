import Database from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('hook', () => {
  let api: MockServer;
  let db: Database;

  beforeEach(async () => {
    api = await createMockServer({
      plugins: ['audit-logs'],
    });
    db = api.db;
    db.collection({
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
      ],
    });
    db.collection({
      name: 'users',
      logging: false,
      fields: [
        { type: 'string', name: 'nickname' },
        { type: 'string', name: 'token' },
      ],
    });
    await db.sync();
  });

  afterEach(async () => {
    await api.destroy();
  });

  it('model', async () => {
    const Post = db.getCollection('posts').model;
    const post = await Post.create({ title: 't1' });
    await post.update({ title: 't2' });
    await post.destroy();
    const auditLogs = await db.getCollection('auditLogs').repository.find({
      appends: ['changes'],
    });
    expect(auditLogs.length).toBe(3);

    const titleChange = (changes) => {
      return changes.find((item) => item.field.name === 'title');
    };

    expect(titleChange(auditLogs[0].changes).before).toBeNull();
    expect(titleChange(auditLogs[0].changes).after).toBe('t1');

    expect(titleChange(auditLogs[1].changes).before).toBe('t1');
    expect(titleChange(auditLogs[1].changes).after).toBe('t2');

    expect(titleChange(auditLogs[2].changes).before).toBe('t2');
  });

  it('repository', async () => {
    const Post = db.getCollection('posts');
    const User = db.getCollection('users').model;
    const user = await User.create({ nickname: 'a', token: 'token1' });
    const post = await Post.repository.create({
      values: { title: 't1' },
      context: {
        state: {
          currentUser: user,
        },
      },
    });
    const AuditLog = db.getCollection('auditLogs');
    const log = await AuditLog.repository.findOne({
      appends: ['changes'],
    });
    expect(log.toJSON()).toMatchObject({
      collectionName: 'posts',
      type: 'create',
      userId: 1,
      recordId: `${post.get('id')}`,
      changes: [
        {
          field: {
            name: 'title',
            type: 'string',
          },
          before: null,
          after: 't1',
        },
      ],
    });
  });

  // it.skip('resource', async () => {
  //   const agent = api.agent();
  //   agent.set('Authorization', `Bearer token1`);
  //   const response = await agent.resource('posts').create({
  //     values: { title: 't1' },
  //   });
  //   await agent.resource('posts').update({
  //     resourceIndex: response.body.data.id,
  //     values: { title: 't2' },
  //   });
  //   await agent.resource('posts').destroy({
  //     resourceIndex: response.body.data.id,
  //   });
  //   const ActionLog = db.getCollection('action_logs').model;
  //   const count = await ActionLog.count();
  //   expect(count).toBe(3);
  // });
});
