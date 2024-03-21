import { Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
describe('create with exception', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      acl: false,
      plugins: ['error-handler'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should handle not null error', async () => {
    const collection = app.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
          allowNull: false,
        },
      ],
    });

    await collection.sync();

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
    const collection = app.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
          unique: true,
        },
      ],
    });

    await collection.sync();

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
    const collection = app.collection({
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

    await collection.sync();

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

    await userCollection.sync();

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

    const agent = app.agent();

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
