import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('destroy action with acl', () => {
  let app: MockServer;
  let Post;

  beforeEach(async () => {
    app = await prepareApp();

    Post = app.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'bigInt',
          name: 'createdById',
        },
      ],
    });

    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should throw error when user has no permission to destroy record', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    // user can destroy post which created by himself
    userRole.grantAction('posts:destroy', {
      own: true,
    });

    const p1 = await Post.repository.create({
      values: {
        title: 'p1',
        createById: 2,
      },
    });

    app.resourcer.use(
      (ctx, next) => {
        ctx.state.currentRole = 'user';
        ctx.state.currentUser = {
          id: 1,
        };
        return next();
      },
      {
        before: 'acl',
      },
    );

    const response = await app
      .agent()
      .resource('posts')
      .destroy({
        filterByTk: p1.get('id'),
      });

    // should throw errors
    expect(response.statusCode).toEqual(403);
  });

  it('should throw error when user has no permissions with array query', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    userRole.grantAction('posts:destroy', {
      filter: {
        'title.$in': ['p1', 'p2', 'p3'],
      },
    });

    await Post.repository.create({
      values: [
        {
          title: 'p1',
        },
        {
          title: 'p2',
        },
        {
          title: 'p3',
        },
        {
          title: 'p4',
        },
        {
          title: 'p5',
        },
        {
          title: 'p6',
        },
      ],
    });

    app.resourcer.use(
      (ctx, next) => {
        ctx.state.currentRole = 'user';
        ctx.state.currentUser = {
          id: 1,
        };
        return next();
      },
      {
        before: 'acl',
      },
    );

    const response = await app
      .agent()
      .resource('posts')
      .destroy({
        filter: {
          'title.$in': ['p4', 'p5', 'p6'],
        },
      });

    // should throw error
    expect(response.statusCode).toEqual(403);

    const response2 = await app
      .agent()
      .resource('posts')
      .destroy({
        filter: {
          'title.$in': ['p1'],
        },
      });

    // should throw error
    expect(response2.statusCode).toEqual(200);
  });
});
