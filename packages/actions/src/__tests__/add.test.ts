import Koa from 'koa';
import http from 'http';
import request from 'supertest';
import actions from '..';
import { getConfig } from './index';
import Database, { Model } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { resolve } from 'path';

describe('add', () => {
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

  it('belongsToMany1', async () => {
    const [Post, Tag] = db.getModels(['posts', 'tags']);
    let post = await Post.create();
    let tag1 = await Tag.create({name: 'tag1'});
    let tag2 = await Tag.create({name: 'tag2'});
    await request(http.createServer(app.callback())).post(`/posts/${post.id}/tags:add/${tag1.id}`);
    await request(http.createServer(app.callback())).post(`/posts/${post.id}/tags:add/${tag2.id}`);
    let [tag01, tag02] = await post.getTags();
    expect(tag01.id).toBe(tag1.id);
    expect(tag02.id).toBe(tag2.id);
  });
});
