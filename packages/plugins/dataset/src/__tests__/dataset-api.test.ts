import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import { randomUUID } from 'crypto';

describe('my suite', () => {
  let app: MockServer;
  let agent;
  let db: Database;

  beforeEach(async () => {
    app = mockServer();
    agent = app.agent();
    db = app.db;
    db.collection({
      name: 'datasets',
      fields: [
        {
          name: 'data_set_id',
          type: 'string',
        },
        {
          name: 'data_set_type',
          type: 'string',
        },
        {
          name: 'data_set_value',
          type: 'text',
        },
      ],
    });

    await db.sync();
    await app.load();
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('my case', async () => {
    const { body } = await agent.resource('datasets').create({
      values: {
        data_set_id: randomUUID(),
        data_set_type: 'MOCK',
        data_set_value: `[
          {
            "year": "1850",
            "value": 0,
            "category": "Liquid fuel"
          },
          {
            "year": "1850",
            "value": 54,
            "category": "Solid fuel"
          },
          {
            "year": "1850",
            "value": 0,
            "category": "Gas fuel"
          },
          {
            "year": "1850",
            "value": 0,
            "category": "Cement production"
          }
        ]`,
      },
    });

    expect(body.data).toMatchInlineSnapshot(`
      Object {
        "createdAt": "2023-02-14T14:12:35.825Z",
        "data_set_id": "1f9713b9-fae1-451e-9c1f-2b6358d3a2f0",
        "data_set_type": "MOCK",
        "data_set_value": "[
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 0,
                  \\"category\\": \\"Liquid fuel\\"
                },
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 54,
                  \\"category\\": \\"Solid fuel\\"
                },
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 0,
                  \\"category\\": \\"Gas fuel\\"
                },
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 0,
                  \\"category\\": \\"Cement production\\"
                }
              ]",
        "id": 1,
        "updatedAt": "2023-02-14T14:12:35.825Z",
      }
    `);
  });

  it('test use dataset api to create a dataset ', async function () {
    const datasets = db.getRepository('datasets');
    const result = await datasets.create({
      values: {
        data_set_id: randomUUID(),
        data_set_type: 'MOCK',
        data_set_value: `[
          {
            "year": "1850",
            "value": 0,
            "category": "Liquid fuel"
          },
          {
            "year": "1850",
            "value": 54,
            "category": "Solid fuel"
          },
          {
            "year": "1850",
            "value": 0,
            "category": "Gas fuel"
          },
          {
            "year": "1850",
            "value": 0,
            "category": "Cement production"
          }
        ]`,
      },
    });
    expect(result).toMatchInlineSnapshot(`
      Object {
        "createdAt": 2023-02-14T14:30:41.337Z,
        "data_set_id": "dd2071cd-6eef-4b80-8bce-83ace2ed5476",
        "data_set_type": "MOCK",
        "data_set_value": "[
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 0,
                  \\"category\\": \\"Liquid fuel\\"
                },
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 54,
                  \\"category\\": \\"Solid fuel\\"
                },
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 0,
                  \\"category\\": \\"Gas fuel\\"
                },
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 0,
                  \\"category\\": \\"Cement production\\"
                }
              ]",
        "id": 1,
        "updatedAt": 2023-02-14T14:30:41.337Z,
      }
    `);
  });
  it('test fetch specific dataset by id', async function () {
    const datasets = db.getRepository('datasets');
    const data_set_id = randomUUID();
    const result = await datasets.create({
      values: {
        data_set_id,
        data_set_type: 'MOCK',
        data_set_value: `[
          {
            "year": "1850",
            "value": 0,
            "category": "Liquid fuel"
          },
          {
            "year": "1850",
            "value": 54,
            "category": "Solid fuel"
          },
          {
            "year": "1850",
            "value": 0,
            "category": "Gas fuel"
          },
          {
            "year": "1850",
            "value": 0,
            "category": "Cement production"
          }
        ]`,
      },
    });
    const dataset = await datasets.find({
      filter: {
        data_set_id,
      },
    });
    expect(dataset).toMatchInlineSnapshot(`
      Array [
        Object {
          "createdAt": 2023-02-14T15:08:48.018Z,
          "data_set_id": "d055dd68-aecb-497d-b6bd-d3982cf3ecaa",
          "data_set_type": "MOCK",
          "data_set_value": "[
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 0,
                  \\"category\\": \\"Liquid fuel\\"
                },
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 54,
                  \\"category\\": \\"Solid fuel\\"
                },
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 0,
                  \\"category\\": \\"Gas fuel\\"
                },
                {
                  \\"year\\": \\"1850\\",
                  \\"value\\": 0,
                  \\"category\\": \\"Cement production\\"
                }
              ]",
          "id": 1,
          "updatedAt": 2023-02-14T15:08:48.018Z,
        },
      ]
    `);
  });
});
