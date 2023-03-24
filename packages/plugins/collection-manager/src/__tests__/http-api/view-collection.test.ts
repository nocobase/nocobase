import { MockServer } from '@nocobase/test';
import { createApp } from '../index';
import { uid } from '@nocobase/utils';

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
            uiSchema: 'name-uiSchema',
          },
          {
            name: 'age',
            type: 'integer',
            interface: 'number',
            uiSchema: 'age-uiSchema',
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

    // create view collection
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
    expect(nameField.uiSchema).toBe('name-uiSchema');

    const viewFieldsResponse = await agent.resource('collections.fields', viewName).list({
      filter: {
        $or: {
          'interface.$not': null,
          'options.source.$notEmpty': true,
        },
      },
    });

    expect(viewFieldsResponse.status).toEqual(200);
    const viewFieldsData = viewFieldsResponse.body.data;
    expect(viewFieldsData.length).toEqual(2);

    expect(viewFieldsData.find((item) => item.name === 'name').interface).toEqual('text');

    UserCollection.addField('email', { type: 'string' });

    await app.db.sync();

    // update view in database
    const viewSQL2 = `CREATE OR REPLACE VIEW ${viewName} AS SELECT * FROM ${UserCollection.quotedTableName()}`;
    await app.db.sequelize.query(viewSQL2);

    const viewDetailResponse = await agent.resource('dbViews').get({
      filterByTk: viewName,
    });

    const viewDetail = viewDetailResponse.body.data;
    const viewFields = viewDetail.fields;

    const updateFieldsResponse = await agent.resource('collections').setFields({
      filterByTk: viewName,
      values: {
        fields: Object.values(viewFields),
      },
    });

    expect(updateFieldsResponse.status).toEqual(200);

    const viewCollectionWithEmail = app.db.getCollection(viewName);
    console.log(viewCollectionWithEmail.fields);
    expect(viewCollectionWithEmail.getField('email')).toBeTruthy();
  });
});
