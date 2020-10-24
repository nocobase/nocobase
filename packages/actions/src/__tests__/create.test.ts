import Koa from 'koa';
import http from 'http';
import request from 'supertest';
import actions from '..';
import { getConfig } from './index';
import Database, { Model } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { resolve } from 'path';

describe('create', () => {
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
    it('create', async () => {
      const response = await request(http.createServer(app.callback()))
        .post('/posts')
        .send({
          title: 'title1',
        });
      expect(response.body.title).toBe('title1');
    });
  });

  describe('hasMany', () => {
    it('create', async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      const response = await request(http.createServer(app.callback()))
        .post(`/posts/${post.id}/comments`)
        .send({
          content: 'content1',
        });
      expect(response.body.post_id).toBe(post.id);
      expect(response.body.content).toBe('content1');
    });
  });
});
