import { MockServer, mockServer } from '@nocobase/test';
import { PluginErrorHandler } from '../server';
import { Database } from '@nocobase/database';
import supertest from 'supertest';
describe('create with exception', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer();
    await app.cleanDb();
    app.plugin(PluginErrorHandler);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should handle not null error', async () => {
    app.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
          allowNull: false,
        },
      ],
    });

    await app.loadAndInstall();

    const response = await app
      .agent()
      .resource('users')
      .create({
        values: {
          title: 't1',
        },
      });

    expect(response.statusCode).toEqual(400);

    expect(response.body).toEqual({
      errors: [
        {
          message: 'name cannot be null',
        },
      ],
    });
  });

  it('should handle unique error', async () => {
    app.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
          unique: true,
        },
      ],
    });

    await app.loadAndInstall();

    await app
      .agent()
      .resource('users')
      .create({
        values: {
          name: 'u1',
        },
      });

    const response = await app
      .agent()
      .resource('users')
      .create({
        values: {
          name: 'u1',
        },
      });

    expect(response.statusCode).toEqual(400);

    expect(response.body).toEqual({
      errors: [
        {
          message: 'name must be unique',
        },
      ],
    });
  });

  it('should render error with field title', async () => {
    app.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
          allowNull: false,
          uiSchema: {
            title: '{{t("UserName")}}',
          },
        },
      ],
    });

    await app.loadAndInstall();

    const response = await app.agent().resource('users').create({});

    expect(response.statusCode).toEqual(400);

    expect(response.body).toEqual({
      errors: [
        {
          message: 'UserName cannot be null',
        },
      ],
    });
  });

  it('should handle unique error with raw sql', async () => {
    const userCollection = app.collection({
      name: 'users',
      autoGenId: false,
      timestamps: false,
      fields: [
        {
          name: 'name',
          type: 'string',
          primaryKey: true,
        },
      ],
    });

    await app.loadAndInstall();

    app.resourcer.define({
      name: 'test',
      actions: {
        async test(ctx) {
          const db: Database = ctx.db;

          const sql = `INSERT INTO ${userCollection.model.tableName} (name)
                   VALUES (:name)`;

          await db.sequelize.query(sql, {
            replacements: { name: ctx.action.params.values.name },
            type: 'INSERT',
          });
        },
      },
    });

    const agent = supertest.agent(app.callback());

    await agent.post('/test:test').send({
      name: 'u1',
    });

    const response = await agent.post('/test:test').send({
      name: 'u1',
    });

    const body = response.body;
    expect(body['errors'][0]['message']).toBeDefined();
  });
});
