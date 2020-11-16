import actions from '..';
import { Context } from '../actions';
import jsonReponse from '../middlewares/json-reponse';
import { initDatabase, agent, resourcer } from './index';

describe('list', () => {
  let db;
  
  beforeAll(async () => {
    resourcer.define({
      name: 'posts',
      middlewares: [
        jsonReponse,
      ],
      actions: actions.common,
    });
    db = await initDatabase();
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
  });
  
  afterAll(() => db.close());

  it('create', async () => {
    const response = await agent
      .post('/posts')
      .send({
        title: 'title1',
      });
    expect(response.body.data.title).toBe('title1');
  });

  it('list', async () => {
    const response = await agent.get('/posts?fields=title&page=1');
    expect(response.body).toEqual({
      data: [ { title: 'title1' } ],
      meta: { count: 1, page: 1, per_page: 20 }
    });
  });
});
