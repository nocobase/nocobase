import Koa from 'koa';
import http from 'http';
import request from 'supertest';
import actions from '..';
import { getConfig } from './index';
import Database, { Model } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { resolve } from 'path';

describe('update', () => {
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
      .put(`/posts/${post.id}`).send({
        title: 'title11112222'
      });
    expect(response.body.title).toBe('title11112222');
  });

  it('hasOne1', async () => {
    const User = db.getModel('users');
    const user = await User.create();
    const response = await request(http.createServer(app.callback()))
      .put(`/users/${user.id}/profile`).send({
        email: 'email1122',
      });
    expect(response.body.email).toEqual('email1122');
  });

  it('hasMany1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      comments: [
        {content: 'content111222'},
      ],
    });
    const [comment] = await post.getComments();
    const response = await request(http.createServer(app.callback()))
      .put(`/posts/${post.id}/comments/${comment.id}`).send({content: 'content111222333'});
    expect(response.body.post_id).toBe(post.id);
    expect(response.body.content).toBe('content111222333');
  });

  it('belongsTo1', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create();
    await post.updateAssociations({
      user: {name: 'name121234'},
    });
    const response = await request(http.createServer(app.callback()))
      .post(`/posts/${post.id}/user:update`).send({name: 'name1212345'});
    expect(response.body.name).toEqual('name1212345');
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
    let response = await request(http.createServer(app.callback()))
      .post(`/posts/${post.id}/tags:update/${tag.id}`).send({
        name: 'tag11223344',
        posts_tags: {
          test: 'test1',
        },
      });
    const [tag1] = await post.getTags();
    expect(tag1.posts_tags.test).toBe('test1');
    expect(response.body.name).toBe('tag11223344');
    response = await request(http.createServer(app.callback()))
      .post(`/posts/${post.id}/tags:update/${tag.id}`).send({
        posts_tags: {
          test: 'test112233',
        },
      });
    const [tag2] = await post.getTags();
    expect(tag2.posts_tags.test).toBe('test112233');
  });
});
