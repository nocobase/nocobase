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

  it('should create role through user resource', async () => {
    const UserCollection = app.db.getCollection('users');

    const user = await UserCollection.repository.create({
      values: {
        name: 'test_user',
      },
    });

    const userRolesRepository = app.db.getRepository('users.roles', user.get('id'));
    const roleName = 'r_voluptas-assumenda-omnis';
    await userRolesRepository.create({
      values: {
        name: roleName,
        snippets: ['!ui.*', '!pm', '!pm.*'],
        title: 'r_harum-qui-doloremque',
        resources: [
          {
            usingActionsConfig: true,
            actions: [
              {
                name: 'create',
                fields: ['id', 'nickname', 'username', 'email', 'phone', 'password', 'roles'],
                scope: null,
              },
              {
                name: 'view',
                fields: ['id', 'nickname', 'username', 'email', 'phone', 'password', 'roles'],
                scope: {
                  name: '数据范围',
                  scope: {
                    createdById: '{{ ctx.state.currentUser.id }}',
                  },
                },
              },
            ],
            name: 'users',
          },
        ],
      },
    });

    const role = await app.db.getRepository('roles').findOne({
      filter: {
        name: roleName,
      },
      appends: ['resources'],
    });

    expect(role.get('resources').length).toBe(1);
  });

  it('should load the association collection when the source collection does not have the createdById field', async () => {
    const A = app.collection({
      name: 'a',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsToMany', name: 'bs', target: 'b' },
      ],
    });

    const B = app.collection({
      name: 'b',
      fields: [{ type: 'string', name: 'title' }],
    });

    await app.db.sync();

    await A.repository.create({
      values: [
        {
          title: 'a1',
          bs: [
            {
              title: 'b1',
            },
          ],
        },
      ],
    });

    const userRole = app.acl.define({
      role: 'user',
      strategy: {
        actions: ['view:own'],
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

    const a1 = await A.repository.findOne({ filter: { title: 'a1' } });

    const response = await app.agent().resource('a.bs', a1.get('id')).list();
    expect(response.statusCode).toEqual(200);
  });

  it('should parse association acl params', async () => {
    const Comment = app.db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'belongsToMany', name: 'posts' },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: [
        {
          title: 'p1',
          comments: [
            {
              content: 'c11',
            },
            {
              content: 'c12',
            },
          ],
        },
        {
          title: 'p2',
          comments: [
            {
              content: 'c21',
            },
            {
              content: 'c22',
            },
          ],
        },
      ],
    });

    const userRole = app.acl.define({
      role: 'user',
      strategy: {
        actions: ['view:own'],
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

    const p1 = await Post.repository.findOne({ filter: { title: 'p1' } });

    const response = await app.agent().resource('posts.comments', p1.get('id')).list();
    expect(response.statusCode).toEqual(403);
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
