import Koa from 'koa';
import http from 'http';
import request from 'supertest';
import actions from '..';
import { getConfig } from './index';
import Database, { Model } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { resolve } from 'path';

describe('list', () => {
  let db: Database;
  // let resourcer: Resourcer;
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
    // resourcer = config.resourcer;
  });

  afterAll(async () => {
    await db.close();
  });

  describe('common', () => {

    beforeAll(async () => {
      const Post = db.getModel('posts');
      const items = [];
      for (let index = 0; index < 2; index++) {
        items.push({
          title: `title${index}`,
          status: 'common',
        });
      }
      await Post.bulkCreate(items);
    });

    it('list1', async () => {
      const Post = db.getModel('posts');
      const response = await request(http.createServer(app.callback())).get('/posts?filter[status]=common');
      expect(response.body.count).toBe(await Post.count({where: {status: 'common'}}));
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
      const response = await request(http.createServer(app.callback())).get('/posts?filter[status]=common&fields=title&page=1');
      expect(response.body).toEqual({
        count: 2,
        page: 1,
        per_page: 20,
        rows: [ { title: 'title0' }, { title: 'title1' } ],
      });
    });
  
    it('list4', async () => {
      const response = await request(http.createServer(app.callback())).get('/posts?filter[status]=common&fields=title&sort=title&page=2&perPage=1');
      expect(response.body).toEqual({
        count: 2,
        page: 2,
        per_page: 1,
        rows: [ { title: 'title1' } ],
      });
    });
  
    it('list5', async () => {
      const response = await request(http.createServer(app.callback())).get('/posts?filter[status]=common&fields=title&page=2&per_page=1');
      expect(response.body).toEqual({
        count: 2,
        page: 2,
        per_page: 1,
        rows: [ { title: 'title1' } ],
      });
    });
  
    it('list6', async () => {
      const response = await request(http.createServer(app.callback())).get('/posts?fields=title&filter[customTitle]=title0&filter[status]=common');
      expect(response.body).toEqual({ count: 1, rows: [ { title: 'title0' } ] });
    });
  });

  describe('hasMany', () => {
    it('list1', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      await post.updateAssociations({
        comments: [
          {content: 'content1', status: 'published'},
          {content: 'content2', status: 'published'},
          {content: 'content3', status: 'draft'},
          {content: 'content4', status: 'published'},
          {content: 'content5', status: 'draft'},
          {content: 'content6', status: 'published'},
        ],
      });
      const response = await request(http.createServer(app.callback()))
        .get(`/posts/${post.id}/comments?page=2&perPage=2&sort=content&fields=content&filter[published]=1`);
      expect(response.body).toEqual({
        rows: [ { content: 'content4' }, { content: 'content6' } ],
        count: 4,
        page: 2,
        per_page: 2
      });
    });
  });

  describe('belongsToMany', () => {
    it('list1', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      await post.updateAssociations({
        tags: [
          {name: 'tag1', status: 'published'},
          {name: 'tag2', status: 'draft'},
          {name: 'tag3', status: 'published'},
          {name: 'tag4', status: 'draft'},
          {name: 'tag5', status: 'published'},
          {name: 'tag6', status: 'draft'},
          {name: 'tag7', status: 'published'},
        ],
      });
      const response = await request(http.createServer(app.callback()))
        .get(`/posts/${post.id}/tags?page=2&perPage=2&sort=name&fields=name&filter[published]=1`);
      expect(response.body).toEqual({
        rows: [ { name: 'tag5' }, { name: 'tag7' } ],
        count: 4,
        page: 2,
        per_page: 2
      });
    });
  });

});
