import actions from '..';
import { Context } from '../actions';
import { dataWrapping } from '../middlewares';
import { initDatabase, agent, resourcer } from './index';

describe('list', () => {
  let db;

  beforeAll(async () => {
    resourcer.define({
      name: 'articles',
      middlewares: [
        dataWrapping,
      ],
      actions: actions.common,
    });
    db = await initDatabase();
    db.table({
      name: 'articles',
      tableName: 'actions__articles',
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
      .post('/articles')
      .send({
        title: 'title1',
      });
    expect(response.body.data.title).toBe('title1');
  });

  it('list', async () => {
    const response = await agent.get('/articles?fields=title&page=1');
    expect(response.body).toEqual({
      data: [{ title: 'title1' }],
      meta: { count: 1, page: 1, per_page: 20 }
    });
  });
});
