import { Database, mockDatabase } from '@nocobase/database';
import { uid } from '@nocobase/utils';
import { ViewCollection } from '../../view-collection';

describe('create view', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      tablePrefix: '',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create view collection in difference schema', async () => {
    if (!db.inDialect('postgres')) return;
    const schemaName = `t_${uid(6)}`;
    const testSchemaSql = `CREATE SCHEMA IF NOT EXISTS ${schemaName};`;
    await db.sequelize.query(testSchemaSql);

    const viewName = 'test_view';

    const viewSQL = `CREATE OR REPLACE VIEW ${schemaName}.test_view AS SELECT 1+1 as result`;
    await db.sequelize.query(viewSQL);

    const viewCollection = db.collection({
      name: viewName,
      schema: schemaName,
      view: true,
      fields: [
        {
          type: 'string',
          name: 'result',
        },
      ],
    });

    const results = await viewCollection.repository.find();

    expect(results.length).toBe(1);
  });

  it('should create view collection', async () => {
    const UserCollection = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasOne',
          name: 'profile',
          foreignKey: 'user_id',
        },
      ],
    });

    const ProfileCollection = db.collection({
      name: 'profiles',
      fields: [
        {
          type: 'integer',
          name: 'age',
        },
        {
          type: 'belongsTo',
          name: 'user',
          foreignKey: 'user_id',
        },
      ],
    });

    await db.sync();

    await UserCollection.repository.create({
      values: {
        name: 'foo',
        profile: {
          age: 18,
        },
      },
    });
    const schema = UserCollection.collectionSchema();
    const viewName = 'users_with_profile';

    const appendSchema = db.inDialect('postgres') ? `"${schema}".` : '';

    const viewSql = `CREATE OR REPLACE VIEW ${appendSchema}${viewName} AS SELECT users.name, profiles.age FROM ${appendSchema}${UserCollection.model.tableName} as users LEFT JOIN ${appendSchema}${ProfileCollection.model.tableName} as profiles ON users.id = profiles.user_id;`;

    await db.sequelize.query(viewSql);

    db.collection({
      name: viewName,
      view: true,
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'integer',
          name: 'age',
        },
      ],
    });
    const UserWithProfileView = db.getCollection(viewName);
    expect(UserWithProfileView).toBeInstanceOf(ViewCollection);

    const fooData = await UserWithProfileView.repository.findOne({
      filter: {
        name: 'foo',
      },
    });

    console.log(fooData);
    expect(fooData.get('name')).toBe('foo');
    expect(fooData.get('age')).toBe(18);
  });

  it('should not sync view collection', async () => {
    const viewSql = `CREATE OR REPLACE VIEW test_view AS SELECT 1+1 as result`;

    await db.sequelize.query(viewSql);
    const viewCollection = db.collection({
      name: 'view_collection',
      viewName: 'test_view',
      fields: [
        {
          type: 'string',
          name: 'result',
        },
      ],
    });

    const jestFn = jest.fn();

    db.on('beforeSync', jestFn);

    await viewCollection.sync();
    expect(jestFn).not.toBeCalled();
  });
});
