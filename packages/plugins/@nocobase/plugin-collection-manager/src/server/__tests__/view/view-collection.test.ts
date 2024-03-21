import Database, { Repository, ViewCollection, ViewFieldInference } from '@nocobase/database';
import Application from '@nocobase/server';
import { uid } from '@nocobase/utils';
import { createApp } from '../index';

describe('view collection', function () {
  let db: Database;
  let app: Application;

  let collectionRepository: Repository;

  let fieldsRepository: Repository;

  beforeEach(async () => {
    app = await createApp({
      database: {
        tablePrefix: '',
      },
    });

    db = app.db;

    collectionRepository = db.getCollection('collections').repository;
    fieldsRepository = db.getCollection('fields').repository;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should use id field as only primary key', async () => {
    await collectionRepository.create({
      values: {
        name: 'groups',
        fields: [{ name: 'name', type: 'string' }],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'users',
        fields: [
          { name: 'name', type: 'string' },
          { type: 'belongsTo', name: 'group', foreignKey: 'group_id' },
        ],
      },
      context: {},
    });

    const User = db.getCollection('users');

    const assoc = User.model.associations.group;
    const foreignKey = assoc.foreignKey;
    const foreignField = User.model.rawAttributes[foreignKey].field;

    const viewName = `test_view_${uid(6)}`;
    await db.sequelize.query(`DROP VIEW IF EXISTS ${viewName}`);

    const createSQL = `CREATE VIEW ${viewName} AS SELECT id, ${foreignField}, name FROM ${db
      .getCollection('users')
      .quotedTableName()}`;

    await db.sequelize.query(createSQL);

    const inferredFields = await ViewFieldInference.inferFields({
      db,
      viewName,
      viewSchema: 'public',
    });

    await collectionRepository.create({
      values: {
        name: viewName,
        view: true,
        fields: [
          { name: 'id', type: 'bigInt' },
          { name: 'group_id', type: 'bigInt', primaryKey: true },
          { name: 'name', type: 'string' },
        ],
        schema: db.inDialect('postgres') ? 'public' : undefined,
      },
      context: {},
    });

    const viewCollection = db.getCollection(viewName);
    expect(viewCollection.model.primaryKeyAttributes).toEqual(['id']);
  });

  it('should create view collection with belongs to association', async () => {
    await collectionRepository.create({
      values: {
        name: 'groups',
        fields: [{ name: 'name', type: 'string' }],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'users',
        fields: [
          { name: 'name', type: 'string' },
          { type: 'belongsTo', name: 'group', foreignKey: 'group_id' },
        ],
      },
      context: {},
    });

    const User = db.getCollection('users');

    const assoc = User.model.associations.group;
    const foreignKey = assoc.foreignKey;
    const foreignField = User.model.rawAttributes[foreignKey].field;

    const viewName = `test_view_${uid(6)}`;
    await db.sequelize.query(`DROP VIEW IF EXISTS ${viewName}`);

    const createSQL = `CREATE VIEW ${viewName} AS SELECT id, ${foreignField}, name FROM ${db
      .getCollection('users')
      .quotedTableName()}`;

    await db.sequelize.query(createSQL);

    const inferredFields = await ViewFieldInference.inferFields({
      db,
      viewName,
      viewSchema: 'public',
    });

    if (!db.inDialect('sqlite')) {
      expect(inferredFields['group_id'].type).toBe('bigInt');

      expect(inferredFields['group'].type).toBe('belongsTo');

      await collectionRepository.create({
        values: {
          name: viewName,
          view: true,
          fields: Object.values(inferredFields),
          schema: db.inDialect('postgres') ? 'public' : undefined,
        },
        context: {},
      });

      const viewCollection = db.getCollection(viewName);
      const group = viewCollection.getField('group');
      expect(group.foreignKey).toEqual('group_id');
    }
  });

  it('should use view collection as through collection', async () => {
    const User = await collectionRepository.create({
      values: {
        name: 'users',
        fields: [{ name: 'name', type: 'string' }],
      },
      context: {},
    });

    const Role = await collectionRepository.create({
      values: {
        name: 'roles',
        fields: [{ name: 'name', type: 'string' }],
      },
      context: {},
    });

    const UserCollection = db.getCollection('users');

    console.log(UserCollection);

    await db.getRepository('users').create({
      values: [{ name: 'u1' }, { name: 'u2' }],
    });

    await db.getRepository('roles').create({
      values: [{ name: 'r1' }, { name: 'r2' }],
    });

    await collectionRepository.create({
      values: {
        name: 'user_roles',
        fields: [
          { type: 'integer', name: 'user_id' },
          { type: 'integer', name: 'role_id' },
        ],
      },
      context: {},
    });

    const throughCollection = db.getCollection('user_roles');

    await throughCollection.repository.create({
      values: [
        { user_id: 1, role_id: 1 },
        { user_id: 1, role_id: 2 },
        { user_id: 2, role_id: 1 },
      ],
    });

    const viewName = 'test_view';
    const dropViewSQL = `DROP VIEW IF EXISTS test_view`;
    await db.sequelize.query(dropViewSQL);

    const viewSQL = `CREATE VIEW test_view AS select * from ${throughCollection.quotedTableName()}`;

    await db.sequelize.query(viewSQL);
    await collectionRepository.create({
      values: {
        name: `${viewName}`,
        view: true,
        viewName,
        fields: [
          { type: 'integer', name: 'user_id' },
          { type: 'integer', name: 'role_id' },
        ],
        schema: db.inDialect('postgres') ? 'public' : undefined,
      },
      context: {},
    });

    await fieldsRepository.create({
      values: {
        collectionName: 'users',
        name: 'roles',
        type: 'belongsToMany',
        target: 'roles',
        through: 'test_view',
        foreignKey: 'user_id',
        otherKey: 'role_id',
      },
      context: {},
    });

    const users = await db.getRepository('users').find({
      appends: ['roles'],
      filter: {
        name: 'u1',
      },
    });

    const roles = users[0].get('roles');
    expect(roles).toHaveLength(2);

    await collectionRepository.destroy({
      filter: {
        name: 'test_view',
      },
      context: {},
    });

    expect(
      await fieldsRepository.count({
        filter: {
          collectionName: 'users',
          name: 'roles',
        },
      }),
    ).toEqual(0);
  });

  it('should save view collection in difference schema', async () => {
    if (!db.inDialect('postgres')) {
      return;
    }

    const viewName = 'test_view';
    const dbSchema = db.options.schema || 'public';
    const randomSchema = `s_${uid(6)}`;
    await db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${randomSchema};`);
    await db.sequelize.query(`CREATE OR REPLACE VIEW ${dbSchema}.${viewName} AS select 1+1 as "view_1"`);
    await db.sequelize.query(`CREATE OR REPLACE VIEW ${randomSchema}.${viewName} AS select 1+1 as "view_2"`);

    await collectionRepository.create({
      values: {
        name: viewName,
        view: true,
        fields: [{ type: 'string', name: 'view_1' }],
        schema: dbSchema,
      },
      context: {},
    });

    const viewCollection = db.getCollection(viewName);
    expect(viewCollection).toBeInstanceOf(ViewCollection);

    let err;
    try {
      await collectionRepository.create({
        values: {
          name: viewName,
          view: true,
          fields: [{ type: 'string', name: 'view_2' }],
          schema: randomSchema,
        },
        context: {},
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeTruthy();

    await collectionRepository.create({
      values: {
        name: `${randomSchema}_${viewName}`,
        view: true,
        viewName: 'test_view',
        fields: [{ type: 'string', name: 'view_2' }],
        schema: randomSchema,
      },
      context: {},
    });

    const otherSchemaView = db.getCollection(`${randomSchema}_${viewName}`);
    expect(otherSchemaView.options.viewName).toBe(viewName);
    expect(otherSchemaView.options.schema).toBe(randomSchema);
  });

  it('should support view with dot field', async () => {
    const dropViewSQL = `DROP VIEW IF EXISTS test_view`;

    await db.sequelize.query(dropViewSQL);
    const viewSQL = `CREATE VIEW test_view AS select 1+1 as "dot.results"`;
    await db.sequelize.query(viewSQL);

    await collectionRepository.create({
      values: {
        name: 'view_collection',
        viewName: 'test_view',
        fields: [{ type: 'string', name: 'dot_result', field: 'dot.results' }],
        schema: db.inDialect('postgres') ? 'public' : undefined,
      },
      context: {},
    });

    const viewCollection = db.getCollection('view_collection');

    const results = await viewCollection.repository.find();
    expect(results.length).toBe(1);
  });

  it('should support view with uppercase field in underscored env', async () => {
    if (!db.options.underscored) {
      return;
    }

    const dropViewSQL = `DROP VIEW IF EXISTS test_view`;
    await db.sequelize.query(dropViewSQL);
    const viewSQL = `CREATE VIEW test_view AS select 1+1 as "Uppercase"`;
    await db.sequelize.query(viewSQL);

    await collectionRepository.create({
      values: {
        name: 'view_collection',
        viewName: 'test_view',
        isView: true,
        fields: [{ type: 'string', name: 'upper_case', field: 'Uppercase' }],
        schema: db.inDialect('postgres') ? 'public' : undefined,
      },
      context: {},
    });

    const viewCollection = db.getCollection('view_collection');

    expect(viewCollection.model.rawAttributes['upper_case'].field).toEqual('Uppercase');
    const results = await viewCollection.repository.find();
    expect(results.length).toBe(1);
  });

  it('should create view collection by view name', async () => {
    const dropViewSQL = `DROP VIEW IF EXISTS test_view`;
    await db.sequelize.query(dropViewSQL);
    const viewSQL = `CREATE VIEW test_view AS select 1+1 as result`;
    await db.sequelize.query(viewSQL);

    await collectionRepository.create({
      values: {
        name: 'view_collection',
        viewName: 'test_view',
        fields: [{ type: 'string', name: 'result' }],
        schema: db.inDialect('postgres') ? 'public' : undefined,
      },
      context: {},
    });

    const viewCollection = db.getCollection('view_collection');
    expect(viewCollection).toBeInstanceOf(ViewCollection);

    const results = await viewCollection.repository.find();
    expect(results.length).toBe(1);
  });

  it('should destroy collection view', async () => {
    const dropViewSQL = `DROP VIEW IF EXISTS test_view`;
    await db.sequelize.query(dropViewSQL);
    const viewSQL = `CREATE VIEW test_view AS select 1+1 as result`;
    await db.sequelize.query(viewSQL);

    await collectionRepository.create({
      values: {
        name: 'view_collection',
        viewName: 'test_view',
        fields: [{ type: 'string', name: 'result' }],
      },
      context: {},
    });

    expect(
      await fieldsRepository.findOne({
        filter: {
          collectionName: 'view_collection',
          name: 'result',
        },
      }),
    ).toBeTruthy();

    await fieldsRepository.destroy({
      filter: {
        collectionName: 'view_collection',
        name: 'result',
      },
      context: {},
    });

    expect(
      await fieldsRepository.findOne({
        filter: {
          collectionName: 'view_collection',
          name: 'result',
        },
      }),
    ).toBeFalsy();

    await collectionRepository.destroy({
      filterByTk: 'view_collection',
    });

    expect(db.getCollection('view_collection')).toBeUndefined();
  });
});
