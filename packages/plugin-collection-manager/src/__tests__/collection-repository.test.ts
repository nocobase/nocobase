import { mockServer, MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { mockUiSchema } from './mockUiSchema';
import PluginCollectionManager from '../server';
import { CollectionRepository } from '../repositories/collection-repository';
import { CollectionModel } from '../models/collection-model';
import { FieldModel } from '../models/field-model';

describe('collection repository', () => {
  let app: MockServer;
  let db: Database;
  let collectionRepository: CollectionRepository;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      database: {
        dialect: 'postgres',
        database: 'nocobase_test',
        username: 'chareice',
        logging: console.log,
      },
    });
    db = app.db;

    await db.sequelize.getQueryInterface().dropAllTables();

    await mockUiSchema(db);
    app.plugin(PluginCollectionManager);

    await app.load();

    collectionRepository = db.getCollection('collections').repository as CollectionRepository;
  });

  it('should use custom repository', async () => {
    const repository = db.getCollection('collections').repository;
    expect(repository).toBeInstanceOf(CollectionRepository);
  });

  test('collection should use custom model', async () => {
    const testCollection = await db.getCollection('collections').repository.create({
      values: { name: 'tests' },
    });

    expect(testCollection).toBeInstanceOf(CollectionModel);
  });

  test('field should use custom model', async () => {
    const testCollection = await db.getCollection('collections').repository.create({
      values: { name: 'tests' },
    });

    const field = await db.getCollection('fields').repository.create({
      values: {
        collectionKey: testCollection.get('key'),
      },
    });

    expect(field).toBeInstanceOf(FieldModel);
  });

  it('should load collection', async () => {
    await collectionRepository.create({
      values: {
        name: 'tests',
      },
    });

    expect(db.getCollection('tests')).not.toBeDefined();

    await collectionRepository.load();

    expect(db.getCollection('tests')).toBeDefined();
  });

  it('should create collection', async () => {
    const collectionOptions = {
      name: 'tests',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
      logging: true,
      paranoid: true,
    };

    await collectionRepository.create({
      values: collectionOptions,
    });

    const collectionModel = await collectionRepository.findOne({
      filter: {
        name: 'tests',
      },
    });

    const options = collectionModel.get('options');

    expect(options).toMatchObject({
      logging: true,
      paranoid: true,
    });

    expect(collectionModel).not.toBeNull();

    expect(await db.getCollection('fields').repository.count()).toEqual(1);
  });
});
