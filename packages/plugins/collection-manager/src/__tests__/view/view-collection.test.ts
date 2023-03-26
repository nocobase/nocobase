import Database, { Repository, ViewCollection } from '@nocobase/database';
import Application from '@nocobase/server';
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

  it('should create view collection by view name', async () => {
    const viewSQL = `CREATE OR REPLACE VIEW public.test_view AS select 1+1 as result`;
    await db.sequelize.query(viewSQL);

    await collectionRepository.create({
      values: {
        name: 'view_collection',
        viewName: 'test_view',
        fields: [{ type: 'string', name: 'result' }],
        schema: 'public',
      },
      context: {},
    });

    const viewCollection = db.getCollection('view_collection');
    expect(viewCollection).toBeInstanceOf(ViewCollection);

    const results = await viewCollection.repository.find();
    expect(results.length).toBe(1);
  });

  it('should destroy collection view', async () => {
    const viewSQL = `CREATE OR REPLACE VIEW test_view AS select 1+1 as result`;
    await db.sequelize.query(viewSQL);

    await collectionRepository.create({
      values: {
        name: 'view_collection',
        viewName: 'test_view',
        fields: [{ type: 'string', name: 'result' }],
      },
      context: {},
    });

    await collectionRepository.destroy({
      filterByTk: 'view_collection',
    });

    expect(db.getCollection('view_collection')).toBeUndefined();
  });
});
