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
          name: 'data_set_name',
          type: 'string',
        },
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
        data_set_name: 'test_dataset',
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
        "createdAt": "2023-02-15T03:33:52.356Z",
        "data_set_id": "fb2ca74a-a942-4ff7-8dd1-cda6fbccad4f",
        "data_set_name": "test_dataset",
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
        "updatedAt": "2023-02-15T03:33:52.356Z",
      }
    `);
  });

  it('test use dataset api to create a dataset ', async function () {
    const datasets = db.getRepository('datasets');
    const result = await datasets.create({
      values: {
        data_set_name: 'test_dataset',
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
        "createdAt": 2023-02-15T03:33:52.424Z,
        "data_set_id": "6097d791-a8ee-4c0b-aed0-fb8d75de38af",
        "data_set_name": "test_dataset",
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
        "updatedAt": 2023-02-15T03:33:52.424Z,
      }
    `);
  });
  it('test fetch specific dataset by id', async function () {
    const datasets = db.getRepository('datasets');
    const data_set_id = randomUUID();
    const result = await datasets.create({
      values: {
        data_set_name: 'test_dataset',
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
          "createdAt": 2023-02-15T03:33:52.481Z,
          "data_set_id": "f853ba7e-2ff9-4319-a600-55349ddd824a",
          "data_set_name": "test_dataset",
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
          "updatedAt": 2023-02-15T03:33:52.481Z,
        },
      ]
    `);
  });
});
