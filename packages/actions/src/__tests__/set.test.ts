import Koa from 'koa';
import http from 'http';
import request from 'supertest';
import actions from '..';
import { getConfig } from './index';
import Database, { Model } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { resolve } from 'path';

describe('set', () => {
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

  it('belongsTo1', async () => {
    const Post = db.getModel('posts');
    const User = db.getModel('users');
    let post = await Post.create();
    let user = await User.create();
    await request(http.createServer(app.callback())).post(`/posts/${post.id}/user:set/${user.id}`);
    post = await Post.findOne({
      where: {
        id: post.id,
      }
    });
    const postUser = await post.getUser();
    expect(user.id).toBe(postUser.id);
  });

  it('belongsToMany1', async () => {
    const [Post, Tag] = db.getModels(['posts', 'tags']);
    let post = await Post.create();
    let tag1 = await Tag.create({name: 'tag1'});
    let tag2 = await Tag.create({name: 'tag2'});
    await request(http.createServer(app.callback())).post(`/posts/${post.id}/tags:set/${tag1.id}`);
    let [tag01] = await post.getTags();
    expect(tag1.id).toBe(tag01.id);
    expect(await post.countTags()).toBe(1);
    await request(http.createServer(app.callback())).post(`/posts/${post.id}/tags:set/${tag2.id}`);
    let [tag02] = await post.getTags();
    expect(tag2.id).toBe(tag02.id);
    expect(await post.countTags()).toBe(1);
  });
});
