import { registerActions } from '@nocobase/actions';
import { MockServer, mockServer as actionMockServer } from './index';

describe('list action', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = actionMockServer();
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

  test.skip('list by association', async () => {
    const p1 = await app.db.getRepository('posts').create({
      values: {
        title: 'pt1',
        tags: [1, 2],
      },
    });
    // const r = await app.db
    //   .getRepository<any>('posts.tags', p1.id)
    //   .find({ fields: ['id', 'postsTags.createdAt'], sort: ['id'] });
    // console.log(r.map((i) => JSON.stringify(i)));
    const response = await app
      .agent()
      .resource('posts.tags', p1.id)
      .list({ fields: ['id', 'postsTags.createdAt'], sort: ['id'] });

    const body = response.body;
    expect(body.count).toEqual(2);
    expect(body.rows).toMatchObject([{ id: 1 }, { id: 2 }]);
  });

  it.skip('should return empty error when relation not exists', async () => {
    const response = await app
      .agent()
      .resource('posts.tags', 999)
      .list({ fields: ['id', 'postsTags.createdAt'], sort: ['id'] });

    expect(response.status).toEqual(200);
    expect(response.body.count).toEqual(0);
  });
});

describe('list-tree', () => {
  let app;
  beforeEach(async () => {
    app = actionMockServer();
    registerActions(app);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should be tree', async () => {
    const values = [
      {
        name: '1',
        __index: '0',
        children: [
          {
            name: '1-1',
            __index: '0.children.0',
            children: [
              {
                name: '1-1-1',
                __index: '0.children.0.children.0',
                children: [
                  {
                    name: '1-1-1-1',
                    __index: '0.children.0.children.0.children.0',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: '2',
        __index: '1',
        children: [
          {
            name: '2-1',
            __index: '1.children.0',
            children: [
              {
                name: '2-1-1',
                __index: '1.children.0.children.0',
                children: [
                  {
                    name: '2-1-1-1',
                    __index: '1.children.0.children.0.children.0',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const db = app.db;
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'description',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          treeChildren: true,
        },
      ],
    });
    await db.sync();

    await db.getRepository('categories').create({
      values,
    });

    const response = await app
      .agent()
      .resource('categories')
      .list({
        tree: true,
        fields: ['id', 'name'],
        sort: ['id'],
      });

    expect(response.status).toEqual(200);
    expect(response.body.rows).toMatchObject(values);
  });

  it('should be tree', async () => {
    const values = [
      {
        name: '1',
        __index: '0',
        children2: [
          {
            name: '1-1',
            __index: '0.children2.0',
            children2: [
              {
                name: '1-1-1',
                __index: '0.children2.0.children2.0',
                children2: [
                  {
                    name: '1-1-1-1',
                    __index: '0.children2.0.children2.0.children2.0',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: '2',
        __index: '1',
        children2: [
          {
            name: '2-1',
            __index: '1.children2.0',
            children2: [
              {
                name: '2-1-1',
                __index: '1.children2.0.children2.0',
                children2: [
                  {
                    name: '2-1-1-1',
                    __index: '1.children2.0.children2.0.children2.0',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const db = app.db;
    const collection = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'description',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'cid',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children2',
          foreignKey: 'cid',
          treeChildren: true,
        },
      ],
    });
    await db.sync();

    await db.getRepository('categories').create({
      values,
    });

    const response = await app
      .agent()
      .resource('categories')
      .list({
        tree: true,
        fields: ['id', 'name'],
        sort: ['id'],
      });

    expect(response.status).toEqual(200);
    expect(response.body.rows).toMatchObject(values);
  });
});
