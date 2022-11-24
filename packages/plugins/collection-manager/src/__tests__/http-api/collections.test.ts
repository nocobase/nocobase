import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('collections repository', () => {
  let app: MockServer;
  let agent;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
    await agent.resource('collections').create({
      values: {
        name: 'tags',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
    });
    await agent.resource('collections').create({
      values: {
        name: 'foos',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
    });
    await agent.resource('collections.fields', 'tags').create({
      values: {
        name: 'foos',
        target: 'foos',
        type: 'belongsToMany',
      },
    });
    await agent.resource('collections').create({
      values: {
        name: 'comments',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
    });
    await agent.resource('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'comments',
            target: 'comments',
            type: 'hasMany',
          },
          {
            name: 'tags',
            target: 'tags',
            type: 'belongsToMany',
          },
        ],
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should skip sync when create empty collection', async () => {
    const response = await agent.resource('collections').create({
      values: {
        name: 'test',
        autoGenId: false,
        sortable: false,
        timestamps: false,
      },
    });

    expect(response.statusCode).toBe(200);

    await agent.resource('fields').create({
      values: {
        name: 'field',
        type: 'string',
        collectionName: 'test',
      },
    });

    const testCollection = app.db.getCollection('test');

    const tableInfo = await app.db.sequelize.getQueryInterface().describeTable(testCollection.model.tableName);

    expect(tableInfo['field']).toBeDefined();
  });

  it('should create collection without id', async () => {
    const response = await agent.resource('collections').create({
      values: {
        name: 'test',
        autoGenId: false,
        sortable: true,
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it('case 1', async () => {
    const response1 = await app.agent().resource('posts').create();
    const postId = response1.body.data.id;
    const response2 = await app.agent().resource('posts.comments', postId).create();
    expect(response2.statusCode).toBe(200);
  });

  it('case 2', async () => {
    const response = await app.agent().resource('posts').create();
    const postId = response.body.data.id;
    await agent.resource('posts.comments', postId).create({
      values: {
        title: 'comment 1',
      },
    });
    await agent.resource('posts.comments', postId).create({
      values: {
        title: 'comment 2',
      },
    });
    const response2 = await agent.resource('posts').list({
      filter: {
        'comments.title': 'comment 1',
      },
    });
    expect(response2.body.data[0].id).toBe(1);
  });

  it('case 3', async () => {
    const response = await app.agent().resource('posts').create();
    const postId = response.body.data.id;
    await agent.resource('posts.comments', postId).create({
      values: {
        title: 'comment 1',
      },
    });
    const response2 = await agent.resource('posts').list({
      filter: {
        'comments.id': 3,
      },
    });
    expect(response2.body.data.length).toBe(0);
  });

  it('case 4', async () => {
    const response = await app.agent().resource('posts').create();
    const postId = response.body.data.id;
    await agent.resource('posts.comments', postId).create({
      values: {
        title: 'comment 1',
      },
    });
    const response2 = await agent.resource('posts').list({
      filter: {
        $and: [
          {
            'comments.title': 'comment 1',
          },
        ],
      },
    });
    expect(response2.body.data[0].id).toBe(1);
  });

  it('case 5', async () => {
    const response = await app.agent().resource('posts').create();
    const postId = response.body.data.id;
    await app.agent().resource('posts.tags', postId).create({
      values: {},
    });

    expect(await app.db.getRepository('tags').count()).toEqual(1);
  });

  it('case 6', async () => {
    const response = await agent.resource('posts').create({
      values: {
        tags: [
          {},
          {
            title: 'Tag1',
          },
        ],
      },
    });
    const postId = response.body.data.id;
    const response1 = await app.agent().resource('posts.tags', postId).list();
    expect(response1.body.data.length).toBe(2);
  });

  it('case 7', async () => {
    const response = await agent.resource('posts').create({
      values: {
        tags: [
          {},
          {
            title: 'Tag1',
          },
        ],
      },
    });
    const postId = response.body.data.id;
    const response1 = await agent.resource('posts.tags', postId).list({
      filter: {
        title: 'Tag1',
      },
    });
    expect(response1.body.data.length).toBe(1);
  });

  it('case 8', async () => {
    const response = await agent.resource('posts').create({
      values: {
        tags: [
          {},
          {
            title: 'Tag1',
          },
          {
            title: 'Tag2',
          },
        ],
      },
    });
    const postId = response.body.data.id;
    const response1 = await agent.resource('posts.tags', postId).list({
      filter: {
        $or: [{ title: 'Tag1' }, { title: 'Tag2' }],
      },
    });
    expect(response1.body.data.length).toBe(2);
  });

  it('case 9', async () => {
    const response = await agent.resource('posts').create({
      values: {
        tags: [
          {},
          {
            title: 'Tag1',
          },
          {
            title: 'Tag2',
          },
        ],
      },
    });
    const postId = response.body.data.id;
    const response1 = await agent.resource('posts.tags', postId).list({
      filter: {
        $or: [{ title: 'Tag1' }, { title: 'Tag2' }],
      },
    });
    expect(response1.body.data.length).toBe(2);
  });

  it('case 10', async () => {
    const response = await agent.resource('posts').create({
      values: {
        tags: [
          {},
          {
            title: 'Tag1',
          },
          {
            title: 'Tag2',
          },
        ],
      },
    });
    const postId = response.body.data.id;
    const response1 = await agent.resource('posts.tags', postId).list({
      appends: ['foos'],
      page: 1,
      pageSize: 20,
      sort: ['-createdAt', '-id'],
    });

    expect(response1.body.data[0]['id']).toEqual(3);
  });

  it('case 11', async () => {
    const response = await app.agent().resource('posts').create();
    const postId = response.body.data.id;
    await agent.resource('posts.comments', postId).create({
      values: {
        title: 'comment 1',
      },
    });
    await agent.resource('posts.comments', postId).create({
      values: {
        title: 'comment 2',
      },
    });
    const response2 = await app.agent().resource('posts').create();
    const postId2 = response2.body.data.id;
    await agent.resource('posts.comments', postId2).create({
      values: {
        title: 'comment 2',
      },
    });
    await agent.resource('posts.comments', postId2).create({
      values: {
        title: 'comment 2',
      },
    });
    const response3 = await agent.resource('posts').list({
      filter: {
        $or: [
          {
            'comments.title': 'comment 1',
          },
          {
            'comments.title': 'comment 2',
          },
        ],
      },
    });
    expect(response3.body.data.length).toBe(2);
  });

  it('case 12', async () => {
    const response = await app.agent().resource('posts').create();
    const postId = response.body.data.id;
    await agent.resource('posts.comments', postId).create({
      values: {
        title: 'comment 1',
      },
    });
    await agent.resource('posts.comments', postId).create({
      values: {
        title: 'comment 2',
      },
    });
    await agent.resource('posts.comments', postId).create({
      values: {
        title: 'comment 3',
      },
    });
    const response2 = await agent.resource('posts.comments', postId).list({
      filter: {
        $or: [
          {
            title: 'comment 1',
          },
          {
            title: 'comment 2',
          },
        ],
      },
    });
    expect(response2.body.data.length).toBe(2);
  });

  it('case 13', async () => {
    const tagRepository = app.db.getRepository('tags');
    const tag1 = await tagRepository.create({ values: { title: 'tag1' } });
    const tag2 = await tagRepository.create({ values: { title: 'tag2' } });
    const tag3 = await tagRepository.create({ values: { title: 'tag3' } });
    await agent.resource('posts').create({
      values: {
        tags: [tag1.get('id'), tag3.get('id')],
      },
    });
    await agent.resource('posts').create({
      values: {
        tags: [tag2.get('id')],
      },
    });
    await agent.resource('posts').create({
      values: {
        tags: [tag2.get('id'), tag3.get('id')],
      },
    });

    const response1 = await agent.resource('posts').list({
      filter: {
        $or: [{ 'tags.title': 'tag1' }, { 'tags.title': 'tag3' }],
      },
    });
    expect(response1.body.data.length).toBe(2);
  });
});
