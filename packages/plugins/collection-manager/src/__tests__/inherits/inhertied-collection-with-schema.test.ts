import Database, { Repository } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';
import { pgOnly } from '@nocobase/test';

pgOnly()('Inherited Collection with schema options', () => {
  let db: Database;
  let app: Application;

  let collectionRepository: Repository;

  let fieldsRepository: Repository;

  beforeEach(async () => {
    app = await createApp({
      database: {
        schema: 'testSchema',
      },
    });

    db = app.db;

    collectionRepository = db.getCollection('collections').repository;
    fieldsRepository = db.getCollection('fields').repository;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create inherited collection in difference schema', async () => {
    await collectionRepository.create({
      values: {
        name: 'b',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'a',
        inherits: ['b'],
        fields: [{ type: 'string', name: 'bField' }],
      },
      context: {},
    });
  });
});
