import Koa from 'koa';
import http from 'http';
import request from 'supertest';
import actions from '..';
import { getConfig } from './index';
import Database, { Model } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { resolve } from 'path';

describe('destroy', () => {
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

  it('common1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    const response = await request(http.createServer(app.callback()))
      .delete(`/posts/${post.id}`);
    // console.log(response.body);
    expect(response.body).toBe(post.id);
  });

  it('hasOne1', async () => {
    const User = db.getModel('users');
    const user = await User.create();
    await user.updateAssociations({
      profile: {
        email: 'email1122',
      }
    });
    const response = await request(http.createServer(app.callback()))
      .delete(`/users/${user.id}/profile`);
    const profile = await user.getProfile();
    expect(profile).toBeNull();
  });

  it('hasMany1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      comments: [
        {content: 'content111222'},
      ],
    });
    let [comment] = await post.getComments();
    await request(http.createServer(app.callback()))
    .delete(`/posts/${post.id}/comments/${comment.id}`);
    const count = await post.countComments();
    expect(count).toBe(0);
  });

  it('belongsTo1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      user: {name: 'name121234'},
    });
    await request(http.createServer(app.callback())).delete(`/posts/${post.id}/user:destroy`);
    const user = await post.getUser();
    expect(user).toBeNull();
  });

  it('belongsToMany', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      tags: [
        {name: 'tag112233'},
      ],
    });
    const [tag] = await post.getTags();
    await request(http.createServer(app.callback()))
      .delete(`/posts/${post.id}/tags:destroy/${tag.id}`);
    const tags = await post.getTags();
    expect(tags.length).toBe(0);
  });
});
