import Koa from 'koa';
import http from 'http';
import request from 'supertest';
import actions from '../';
import { getConfig } from './index';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { Context } from '../actions';
import jsonReponse from '../middlewares/json-reponse';

describe('middleware', () => {
  let db: Database;
  let resourcer: Resourcer;
  let app: Koa;
  beforeAll(async () => {
    const config = getConfig();
    app = config.app;
    db = config.database;
    db.table({
      name: 'posts',
      tableName: 'actions__m__posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'string',
          name: 'status',
          defaultValue: 'publish',
        }
      ],
      scopes: {
        customTitle: (title, ctx: Context) => {
          return {
            where: {
              title: title,
            },
          }
        },
      }
    });
    await db.sync({
      force: true,
    });
    resourcer = config.resourcer;
    resourcer.define({
      name: 'posts',
      middlewares: [
        jsonReponse,
      ],
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
    expect(response.body.data.title).toBe('title1');
  });
  it('list', async () => {
    const response = await request(http.createServer(app.callback())).get('/posts?fields=title&page=1');
    expect(response.body).toEqual({
      data: [ { title: 'title1' } ],
      meta: { count: 1, page: 1, per_page: 20 }
    });
  });
});