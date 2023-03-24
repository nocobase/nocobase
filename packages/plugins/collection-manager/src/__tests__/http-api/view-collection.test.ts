import { MockServer } from '@nocobase/test';
import { createApp } from '../index';
import { uid } from '@nocobase/utils';
import { HasManyRepository } from '@nocobase/database';

describe('view collection', () => {
  let app: MockServer;
  let agent;
  let testViewName;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
    testViewName = `view_${uid(6)}`;
    const viewSQL = `CREATE OR REPLACE VIEW ${testViewName} AS WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 20
)
SELECT * FROM numbers;
`;
    await app.db.sequelize.query(viewSQL);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should list views', async () => {
    const response = await agent.resource('dbViews').list();
    expect(response.status).toBe(200);
    expect(response.body.data.find((item) => item.name === testViewName)).toBeTruthy();
  });

  it('should query views data', async () => {
    const response = await agent.resource('dbViews').query({
      filterByTk: testViewName,
      pageSize: 20,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(20);
  });

  it('should list views fields', async () => {
    const response = await agent.resource('dbViews').get({
      filterByTk: testViewName,
    });

    expect(response.status).toBe(200);
    const data = response.body.data;
    expect(data.fields.n.type).toBe('integer');
  });

  it('should list collections fields with source interface', async () => {
    await app.db.getCollection('collections').repository.create({
      values: {
        name: 'users',
        fields: [
          {
            name: 'name',
            type: 'string',
            interface: 'text',
          },
          {
            name: 'age',
            type: 'integer',
            interface: 'number',
          },
        ],
      },
      context: {},
    });

    await app.db.sync();
    const UserCollection = app.db.getCollection('users');

    const viewName = `t_${uid(6)}`;
    const viewSQL = `CREATE OR REPLACE VIEW ${viewName} AS SELECT * FROM ${UserCollection.quotedTableName()}`;
    await app.db.sequelize.query(viewSQL);

    const viewCollection = await app.db.getCollection('collections').repository.create({
      values: {
        name: viewName,
        view: true,
        fields: [
          {
            name: 'name',
            type: 'string',
            source: 'users.name',
          },
          {
            name: 'age',
            type: 'integer',
            source: 'users.age',
          },
        ],
      },
      context: {},
    });

    const response = await agent.resource('collections').list({
      appends: ['fields'],
      paginate: false,
    });

    const listResult = response.body.data.find((item) => item.name === viewName);

    const fields = listResult.fields;

    const nameField = fields.find((item) => item.name === 'name');
    expect(nameField.interface).toBe('text');

    const filterObj = {
      $or: [{ interface: { $not: null } }, { 'options.source': { $notEmpty: true } }],
    };

    const fieldsRepository = app.db.getRepository<HasManyRepository>('collections.fields', viewName);

    const repositoryResults = await fieldsRepository.find({
      filter: filterObj,
    });

    expect(repositoryResults.length).toEqual(2);

    const viewFieldsResponse = await agent.resource('collections.fields', viewName).list({
      filter: filterObj,
      paginate: false,
    });

    expect(viewFieldsResponse.status).toEqual(200);
    const viewFieldsData = viewFieldsResponse.body.data;
    expect(viewFieldsData.length).toEqual(2);
  });
});
