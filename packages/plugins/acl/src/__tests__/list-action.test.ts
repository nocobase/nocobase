import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('list action with acl', () => {
  let app: MockServer;

  let Post;

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
          type: 'belongsTo',
          name: 'createdBy',
          target: 'users',
        },
      ],
    });

    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should list with meta permission that has difference primary key', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    app.acl.addFixedParams('tests', 'destroy', () => {
      return {
        filter: {
          $and: [{ 'name.$ne': 't1' }, { 'name.$ne': 't2' }],
        },
      };
    });

    userRole.grantAction('tests:view', {});

    userRole.grantAction('tests:update', {
      own: true,
    });

    userRole.grantAction('tests:destroy', {});

    const Test = app.db.collection({
      name: 'tests',
      fields: [
        { type: 'string', name: 'name', primaryKey: true },
        {
          type: 'bigInt',
          name: 'createdById',
        },
      ],
      autoGenId: false,
      filterTargetKey: 'name',
    });

    await app.db.sync();

    await Test.repository.create({
      values: [
        { name: 't1', createdById: 1 },
        { name: 't2', createdById: 1 },
        { name: 't3', createdById: 2 },
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

    //@ts-ignore
    const response = await app.agent().set('X-With-ACL-Meta', true).resource('tests').list({});

    const data = response.body;
    expect(data.meta.allowedActions.view).toEqual(['t1', 't2', 't3']);
    expect(data.meta.allowedActions.update).toEqual(['t1', 't2']);
    expect(data.meta.allowedActions.destroy).toEqual(['t3']);
  });

  it('should list items meta permissions by association field', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    userRole.grantAction('posts:view', {});

    userRole.grantAction('posts:update', {
      filter: {
        'createdBy.id': '{{ ctx.state.currentUser.id }}',
      },
    });

    await Post.repository.create({
      values: [
        { title: 'p1', createdById: 1 },
        { title: 'p2', createdById: 1 },
        { title: 'p3', createdById: 2 },
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

    const response = await (app as any).agent().set('X-With-ACL-Meta', true).resource('posts').list();
    const data = response.body;
    expect(data.meta.allowedActions.view).toEqual([1, 2, 3]);
    expect(data.meta.allowedActions.update).toEqual([1, 2]);
    expect(data.meta.allowedActions.destroy).toEqual([]);
  });

  it('should list items with meta permission', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    userRole.grantAction('posts:view', {});

    userRole.grantAction('posts:update', {
      own: true,
    });

    await Post.repository.create({
      values: [
        { title: 'p1', createdById: 1 },
        { title: 'p2', createdById: 1 },
        { title: 'p3', createdById: 2 },
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

    // @ts-ignore
    const response = await app.agent().set('X-With-ACL-Meta', true).resource('posts').list({});

    const data = response.body;
    expect(data.meta.allowedActions.view).toEqual([1, 2, 3]);
    expect(data.meta.allowedActions.update).toEqual([1, 2]);
    expect(data.meta.allowedActions.destroy).toEqual([]);
  });

  it('should response item permission when request get action', async () => {
    const userRole = app.acl.define({
      role: 'user',
    });

    userRole.grantAction('posts:view', {});

    userRole.grantAction('posts:update', {
      own: true,
    });

    await Post.repository.create({
      values: [
        { title: 'p1', createdById: 1 },
        { title: 'p2', createdById: 1 },
        { title: 'p3', createdById: 2 },
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

    // @ts-ignore
    const getResponse = await app.agent().set('X-With-ACL-Meta', true).resource('posts').get({
      filterByTk: 1,
    });

    const getBody = getResponse.body;

    expect(getBody.meta.allowedActions).toBeDefined();
  });
});

describe('list association action with acl', () => {
  let app;
  let db: Database;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;

    app.db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'hasMany',
          name: 'comments',
        },
      ],
    });

    app.db.collection({
      name: 'comments',
      fields: [
        {
          type: 'string',
          name: 'content',
        },
        {
          type: 'belongsTo',
          name: 'post',
        },
      ],
    });

    await app.db.sync();
  });

  it('should list allowedActions', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'newRole',
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['newRole'],
      },
    });

    await db.getRepository('roles.resources', 'newRole').create({
      values: {
        name: 'posts',
        usingActionConfig: true,
        actions: [
          {
            name: 'view',
            fields: ['title', 'comments'],
          },
          {
            name: 'create',
            fields: ['title', 'comments'],
          },
        ],
      },
    });

    const userPlugin = app.getPlugin('users');
    const userAgent = app.agent().login(user).set('X-With-ACL-Meta', true);

    await userAgent.resource('posts').create({
      values: {
        title: 'post1',
        comments: [{ content: 'comment1' }, { content: 'comment2' }],
      },
    });

    const response = await userAgent.resource('posts').list({});
    expect(response.statusCode).toEqual(200);

    const commentsResponse = await userAgent.resource('posts.comments', 1).list({});
    const data = commentsResponse.body;

    /**
     * allowedActions.view == [1]
     * allowedActions.update = []
     * allowedActions.destroy = []
     */
    expect(data['meta']['allowedActions']).toBeDefined();
    expect(data['meta']['allowedActions'].view).toContain(1);
    expect(data['meta']['allowedActions'].view).toContain(2);
  });

  it('tree list action allowActions', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'newRole',
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: ['newRole'],
      },
    });

    const userPlugin = app.getPlugin('users');
    const agent = app.agent().login(user).set('X-With-ACL-Meta', true);
    app.acl.allow('table_a', ['*']);
    app.acl.allow('collections', ['*']);

    await agent.resource('collections').create({
      values: {
        autoGenId: true,
        createdBy: false,
        updatedBy: false,
        createdAt: false,
        updatedAt: false,
        sortable: false,
        name: 'table_a',
        template: 'tree',
        tree: 'adjacency-list',
        fields: [
          {
            interface: 'integer',
            name: 'parentId',
            type: 'bigInt',
            isForeignKey: true,
            uiSchema: {
              type: 'number',
              title: '{{t("Parent ID")}}',
              'x-component': 'InputNumber',
              'x-read-pretty': true,
            },
            target: 'table_a',
          },
          {
            interface: 'm2o',
            type: 'belongsTo',
            name: 'parent',
            treeParent: true,
            foreignKey: 'parentId',
            uiSchema: {
              title: '{{t("Parent")}}',
              'x-component': 'AssociationField',
              'x-component-props': { multiple: false, fieldNames: { label: 'id', value: 'id' } },
            },
            target: 'table_a',
          },
          {
            interface: 'o2m',
            type: 'hasMany',
            name: 'children',
            foreignKey: 'parentId',
            uiSchema: {
              title: '{{t("Children")}}',
              'x-component': 'RecordPicker',
              'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
            },
            treeChildren: true,
            target: 'table_a',
          },
          {
            name: 'id',
            type: 'bigInt',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
            interface: 'id',
          },
        ],
        title: 'table_a',
      },
    });

    await agent.resource('table_a').create({
      values: {},
    });

    await agent.resource('table_a').create({
      values: {
        parent: {
          id: 1,
        },
      },
    });

    await agent.resource('table_a').create({
      values: {},
    });

    await agent.resource('table_a').create({
      values: {
        parent: {
          id: 3,
        },
      },
    });

    const res = await agent.resource('table_a').list({
      filter: JSON.stringify({
        parentId: null,
      }),
      tree: true,
    });

    expect(res.body.meta.allowedActions.view.sort()).toMatchObject([1, 2, 3, 4]);
  });
});
