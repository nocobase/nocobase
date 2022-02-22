import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('collections repository', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    await app.install();
    await app.start();
    await app
      .agent()
      .resource('collections')
      .create({
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
    await app
      .agent()
      .resource('collections')
      .create({
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
    await app
      .agent()
      .resource('collections')
      .create({
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

  it('case 1', async () => {
    const response1 = await app.agent().resource('posts').create();
    const postId = response1.body.data.id;
    const response2 = await app.agent().resource('posts.comments', postId).create();
    expect(response2.statusCode).toBe(200);
  });

  it('case 2', async () => {
    const response = await app.agent().resource('posts').create();
    const postId = response.body.data.id;
    await app
      .agent()
      .resource('posts.comments', postId)
      .create({
        values: {
          title: 'comment 1',
        },
      });
    await app
      .agent()
      .resource('posts.comments', postId)
      .create({
        values: {
          title: 'comment 2',
        },
      });
    const response2 = await app
      .agent()
      .resource('posts')
      .list({
        filter: {
          'comments.title': 'comment 1',
        },
      });
    expect(response2.body.data[0].id).toBe(1);
  });

  it('case 3', async () => {
    const response = await app.agent().resource('posts').create();
    const postId = response.body.data.id;
    await app
      .agent()
      .resource('posts.comments', postId)
      .create({
        values: {
          title: 'comment 1',
        },
      });
    const response2 = await app
      .agent()
      .resource('posts')
      .list({
        filter: {
          'comments.id': 3,
        },
      });
    expect(response2.body.data.length).toBe(0);
  });

  it('case 4', async () => {
    const response = await app.agent().resource('posts').create();
    const postId = response.body.data.id;
    await app
      .agent()
      .resource('posts.comments', postId)
      .create({
        values: {
          title: 'comment 1',
        },
      });
    const response2 = await app
      .agent()
      .resource('posts')
      .list({
        filter: {
          and: [
            {
              title: 'comment 1',
            },
          ],
        },
      });
    console.log(response2.body.data);
  });

  it.skip('case 5', async () => {
    const response = await app.agent().resource('posts').create();
    const postId = response.body.data.id;
    await app.agent().resource('posts.tags', postId).create({
      values: {},
    });
  });
});
