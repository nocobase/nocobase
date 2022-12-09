import { registerActions } from '@nocobase/actions';
import { mockServer } from '@nocobase/test';
import { useRoleResourceValues } from '../../../client/src/acl/Configuration/schemas/useRoleResourceValues';

describe('list action with acl', () => {
  let app;

  let Post;

  beforeEach(async () => {
    app = mockServer({
      acl: true,
    });

    registerActions(app);

    Post = app.db.collection({
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

    const response = await app.agent().resource('posts').list({});

    const data = response.body;
    console.log(JSON.stringify(data, null, 2));
  });
});

describe('list action', () => {
  let app;
  beforeEach(async () => {
    app = mockServer({
      acl: false,
    });
    registerActions(app);

    const Post = app.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'hasMany', name: 'comments' },
        {
          type: 'belongsToMany',
          name: 'tags',
        },
        { type: 'string', name: 'status', defaultValue: 'draft' },
      ],
    });

    const Tag = app.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'posts' },
      ],
    });

    app.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'string', name: 'status', defaultValue: 'draft' },
      ],
    });

    await app.db.sync();

    const t1 = await Tag.repository.create({
      values: {
        name: 't1',
      },
    });

    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });

    const t3 = await Tag.repository.create({
      values: {
        name: 't3',
      },
    });

    const p1 = await Post.repository.create({
      values: {
        title: 'pt1',
        tags: [t1.get('id'), t2.get('id')],
      },
    });

    await Post.repository.createMany({
      records: [
        {
          title: 'pt2',
          tags: [t2.get('id')],
        },
        {
          title: 'pt3',
          tags: [t3.get('id')],
        },
      ],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('list with pagination', async () => {
    const response = await app
      .agent()
      .resource('posts')
      .list({
        fields: ['id'],
        pageSize: 1,
        page: 2,
        sort: ['id'],
      });

    const body = response.body;
    expect(body.rows.length).toEqual(1);
    expect(body.rows[0]['id']).toEqual(2);
    expect(body.count).toEqual(3);
    expect(body.totalPage).toEqual(3);
  });

  test('list with non-paged', async () => {
    const response = await app.agent().resource('posts').list({
      paginate: false,
    });
    const body = response.body;
    expect(body.length).toEqual(3);
  });

  test('list by association', async () => {
    // tags with posts id eq 1
    const response = await app
      .agent()
      .resource('posts.tags', 1)
      .list({ fields: ['id', 'postsTags.createdAt'], sort: ['id'] });

    const body = response.body;
    expect(body.count).toEqual(2);
    expect(body.rows).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
