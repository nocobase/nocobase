import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('get action with acl', () => {
  let app: MockServer;

  let Post;

  let Comment;

  beforeEach(async () => {
    app = await prepareApp();

    Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'bigInt',
          name: 'createdById',
        },
        {
          type: 'hasMany',
          name: 'comments',
          target: 'comments',
        },
      ],
    });

    Comment = app.db.collection({
      name: 'comments',
      fields: [
        {
          type: 'string',
          name: 'content',
        },
      ],
    });

    await app.db.sync();
  });

  it('should get with fields', async () => {
    const testRole = app.acl.define({
      role: 'test',
    });

    testRole.grantAction('posts:view', {
      fields: ['title', 'comments'],
    });

    testRole.grantAction('comments:view', {
      fields: ['content'],
    });

    const [p1] = await Post.repository.create({
      values: [
        {
          title: 'p1',
          comments: [{ content: 'c1' }, { content: 'c2' }],
        },
      ],
    });

    app.resourceManager.use(
      (ctx, next) => {
        ctx.state.currentRole = 'test';
        return next();
      },
      {
        before: 'acl',
      },
    );

    const response = await (app as any)
      .agent()
      .resource('posts')
      .get({
        filterByTk: p1.get('id'),
        fields: ['comments'],
      });

    expect(response.status).toBe(200);

    console.log(response.body);
    // expect only has comments
    expect(response.body.data.title).toBeUndefined();
    expect(response.body.data.comments).toBeDefined();
  });
});
