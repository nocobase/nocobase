import { mockServer, MockServer } from '@nocobase/test';
import { registerActions } from '..';

describe('list', () => {
  let api: MockServer;

  beforeEach(async () => {
    api = mockServer({
      dataWrapping: false,
    });
    registerActions(api);
    api.db.table({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'string', name: 'status', defaultValue: 'draft' },
      ],
    });
    api.db.table({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'hasMany', name: 'comments' },
        { type: 'string', name: 'status', defaultValue: 'draft' },
      ],
    });
    await api.db.sync();
    const [Post, Comment] = api.db.getModels(['posts', 'comments']);
    for (let index = 1; index < 4; index++) {
      const post = await Post.create({ title: `t${index}` });
      await post.updateAssociations({
        comments: [{ content: 'c1', status: 'publish' }, { content: 'c2' }, { content: 'c3' }],
      });
    }
  });

  afterEach(async () => {
    return api.destroy();
  });

  describe('fields', () => {
    it('fields', async () => {
      const response = await api.resource('posts').list({
        fields: ['title'],
        filter: {
          title: 't1',
        },
      });
      expect(response.body).toEqual({
        count: 1,
        rows: [{ title: 't1' }],
        page: 1,
        per_page: 20,
      });
    });

    it('fields#appends', async () => {
      const response = await api.resource('posts').list({
        fields: {
          appends: ['comments'],
        },
        filter: {
          title: 't1',
        },
      });
      expect(response.body).toMatchObject({
        count: 1,
        rows: [
          {
            title: 't1',
            comments: [
              {
                content: 'c1',
              },
              {
                content: 'c2',
              },
              {
                content: 'c3',
              },
            ],
          },
        ],
        page: 1,
        per_page: 20,
      });
    });
  });

  describe('filter', () => {
    it('and', async () => {
      const response = await api.resource('posts').list({
        filter: {
          and: [
            { title: 't1' },
            { status: 'draft' },
          ],
        },
      });
      expect(response.body).toMatchObject({
        count: 1,
        rows: [
          {
            title: 't1',
          },
        ],
        page: 1,
        per_page: 20
      });
    });
    it('or', async () => {
      const response = await api.resource('posts').list({
        filter: {
          or: [
            { title: 't1' },
            { title: 't2' },
          ],
        },
      });
      expect(response.body).toMatchObject({
        count: 2,
        rows: [
          {
            title: 't1',
          },
          {
            title: 't2',
          }
        ],
        page: 1,
        per_page: 20
      });
    });
  });
});
