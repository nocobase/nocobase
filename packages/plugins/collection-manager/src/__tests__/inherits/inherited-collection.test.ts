import { pgOnly } from '@nocobase/test';
import Database, { Collection as DBCollection, Repository } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';

pgOnly()('Inherited Collection', () => {
  let db: Database;
  let app: Application;

  let collectionRepository: Repository;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;

    collectionRepository = db.getCollection('collections').repository;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should replace parent collection field', async () => {
    const personCollection = await collectionRepository.create({
      values: {
        name: 'person',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const studentCollection = await collectionRepository.create({
      values: {
        name: 'students',
        inherits: 'person',
        fields: [
          {
            name: 'name',
            type: 'string',
            title: '姓名',
          },
        ],
      },
      context: {},
    });

    const studentFields = await studentCollection.getFields();
    expect(studentFields.length).toBe(1);
    expect(studentFields[0].get('title')).toBe('姓名');
  });
});
