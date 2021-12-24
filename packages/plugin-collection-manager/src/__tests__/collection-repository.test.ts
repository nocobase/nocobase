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

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      database: {},
    });
    db = app.db;

    await mockUiSchema(db);
    app.plugin(PluginCollectionManager);

    await app.load();
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
    const collectionRepository = db.getCollection('collections').repository as CollectionRepository;

    await collectionRepository.create({
      values: {
        name: 'tests',
      },
    });

    expect(db.getCollection('tests')).not.toBeDefined();

    await collectionRepository.load();

    expect(db.getCollection('tests')).toBeDefined();
  });
});
