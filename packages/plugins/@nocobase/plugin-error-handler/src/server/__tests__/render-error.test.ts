/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

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

  it('should render error with cause property', async () => {
    app.use(
      (ctx, next) => {
        ctx.throw(
          400,
          new Error('wrapped error', {
            cause: new Error('original error'),
          }),
        );
      },
      { after: 'dataSource' },
    );

    const response = await app.agent().resource('users').create({
      values: {},
    });

    expect(response.statusCode).toEqual(400);

    expect(response.body.errors[0].message).contains('original error');
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
          message: 'users: name cannot be null',
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

    expect(response.body['errors'][0]['message']).toBe('users: name already exists');
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
          message: 'users: UserName cannot be null',
        },
      ],
    });
  });

  it.each(['{{t("Enrollment", { ns: "benefits" })}}', '{{t("Enrollment", {"ns":["missing-namespace","benefits"]})}}'])(
    'uses the collection title namespace in validation messages: %s',
    async (title) => {
      app.i18n.addResources('zh-CN', 'benefits', { Enrollment: '参保明细' });
      app.i18n.addResources('zh-CN', 'lm-collections', { Enrollment: '默认标题' });
      const collection = app.collection({
        name: 'enrollments',
        title,
        fields: [{ name: 'code', type: 'string', allowNull: false, uiSchema: { title: '人员编号' } }],
      });
      await collection.sync();

      const response = await app.agent().post('/enrollments:create').set('X-Locale', 'zh-CN').send({});
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([{ message: '参保明细: 人员编号 cannot be null' }]);
    },
  );

  it('identifies the failing related collection for unique and not-null constraints', async () => {
    const relatedCollections = [
      { name: 'employees', title: '在职人员' },
      { name: 'enrollments', title: '参保明细' },
    ];
    for (const related of relatedCollections) {
      app.collection({
        ...related,
        fields: [
          {
            type: 'string',
            name: 'code',
            uiSchema: { title: '{{t("人员编号")}}' },
            unique: true,
            allowNull: false,
          },
        ],
      });
    }
    app.collection({
      name: 'applications',
      fields: relatedCollections.map(({ name }) => ({
        type: 'hasMany',
        name,
        target: name,
        foreignKey: 'applicationId',
      })),
    });
    await app.db.sync();

    for (const { name, title } of relatedCollections) {
      const create = (code: string | null) =>
        app
          .agent()
          .post('/applications:create')
          .set('X-Locale', 'zh-CN')
          .send({ [name]: [{ code }] });
      expect((await create('P001')).status).toBe(200);
      const duplicate = await create('P001');
      expect(duplicate.status).toBe(400);
      expect(duplicate.body.errors).toEqual([{ message: `${title}: 人员编号 字段值已存在` }]);
      const missing = await create(null);
      expect(missing.status).toBe(400);
      expect(missing.body.errors).toEqual([{ message: `${title}: 人员编号 cannot be null` }]);
    }
  });

  it('preserves the validation message when there is no collection', async () => {
    app.use(
      () => {
        throw Object.assign(new Error('duplicate'), {
          name: 'SequelizeUniqueConstraintError',
          errors: [{ type: 'unique violation', path: 'external_code' }],
        });
      },
      { after: 'dataSource' },
    );

    const response = await app.agent().post('/users:create').send({});
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([{ message: 'external_code already exists' }]);
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

  it('should mask SQL reference errors', async () => {
    const userCollection = app.collection({
      name: 'users',
      autoGenId: false,
      timestamps: false,
      fields: [
        {
          name: 'id',
          type: 'integer',
          primaryKey: true,
          autoIncrement: true,
        },
        {
          name: 'name',
          type: 'string',
        },
      ],
    });

    await userCollection.sync();

    app.resourcer.define({
      name: 'invalid-sql',
      actions: {
        async trigger(ctx) {
          const db: Database = ctx.db;
          await db.sequelize.query(`SELECT unknown_column FROM ${userCollection.model.tableName}`, {
            type: 'SELECT',
          });
        },
      },
    });

    const response = await app.agent().post('/invalid-sql:trigger');

    expect(response.statusCode).toEqual(400);
    expect(response.body.errors[0].message).toBe('Invalid SQL column or table reference');
  });
});
