import Koa from 'koa';
import http from 'http';
import request from 'supertest';
import actions from '..';
import { getConfig } from './index';
import Database, { Model } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { resolve } from 'path';

describe('common', () => {
  let db: Database;
  let resourcer: Resourcer;
  let app: Koa;
  beforeAll(async () => {
    const config = getConfig();
    app = config.app;
    db = config.database;
    db.import({
      directory: resolve(__dirname, './tables'),
    });
    await db.sync({
      force: true,
    });
    resourcer = config.resourcer;
    resourcer.define({
      name: 'posts',
      actions: actions.common,
    });
  });
  afterAll(async () => {
    await db.close();
  });
  it('create', async () => {
    const response = await request(http.createServer(app.callback()))
      .post('/posts')
      .send({
        title: 'title1',
      });
    expect(response.body.title).toBe('title1');
  });
  it('update', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    const response = await request(http.createServer(app.callback()))
      .put(`/posts/${post.id}`)
      .send({
        title: 'title2',
      });
    expect(response.body.title).toBe('title2');
  });
  it('get', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create({title: 'title3'});
    const response = await request(http.createServer(app.callback()))
      .get(`/posts/${post.id}`);
    expect(response.body.title).toBe('title3');
  });
  it('delete', async () => {
    const Post = db.getModel('posts');
    let post = await Post.create();
    await request(http.createServer(app.callback()))
      .delete(`/posts/${post.id}`);
    post = await Post.findByPk(post.id);
    expect(post).toBeNull();
  });
  describe('list', () => {
    beforeAll(async () => {
      const Post = db.getModel('posts');
      const items = [];
      for (let index = 0; index < 2; index++) {
        items.push({
          title: `title${index}`,
          status: 'draft',
        });
      }
      await Post.bulkCreate(items);
    });

    it('list1', async () => {
      const Post = db.getModel('posts');
      const response = await request(http.createServer(app.callback())).get('/posts');
      expect(response.body.count).toBe(await Post.count());
    });

    it('list2', async () => {
      const Post = db.getModel('posts');
      const response = await request(http.createServer(app.callback())).get('/posts?filter[title]=title1');
      expect(response.body.count).toBe(await Post.count({
        where: {
          title: 'title1',
        },
      }));
    });

    it('list3', async () => {
      const response = await request(http.createServer(app.callback())).get('/posts?filter[status]=draft&fields=title&page=1');
      expect(response.body).toEqual({
        count: 2,
        page: 1,
        per_page: 20,
        rows: [ { title: 'title0' }, { title: 'title1' } ],
      });
    });

    it('list4', async () => {
      const response = await request(http.createServer(app.callback())).get('/posts?filter[status]=draft&fields=title&page=1&perPage=1');
      expect(response.body).toEqual({
        count: 2,
        page: 1,
        per_page: 1,
        rows: [ { title: 'title0' } ],
      });
    });

    it('list5', async () => {
      const response = await request(http.createServer(app.callback())).get('/posts?filter[status]=draft&fields=title&page=2&per_page=1');
      expect(response.body).toEqual({
        count: 2,
        page: 2,
        per_page: 1,
        rows: [ { title: 'title1' } ],
      });
    });

    it('list6', async () => {
      const response = await request(http.createServer(app.callback())).get('/posts?fields=title&filter[customTitle]=title0&filter[status]=draft');
      expect(response.body).toEqual({ count: 1, rows: [ { title: 'title0' } ] });
    });
  })
});