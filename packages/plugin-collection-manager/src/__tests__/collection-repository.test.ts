import { mockServer, MockServer } from '@nocobase/test';
import { Database, HasManyField } from '@nocobase/database';
import { mockUiSchema } from './mockUiSchema';
import PluginCollectionManager from '../server';
import { CollectionRepository } from '../repositories/collection-repository';
import { CollectionModel } from '../models/collection-model';
import { FieldModel } from '../models/field-model';
import { queryTable } from './helper';

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
        username: 'chareice',
        database: 'nocobase_test',
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
        collectionName: testCollection.get('name'),
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

  it('should migrate collection', async () => {
    const collectionModel = (await collectionRepository.create({
      values: {
        name: 'tests',
      },
    })) as CollectionModel;

    expect(await db.getCollection('collections').repository.count()).toEqual(1);

    await collectionModel.load();
    const collection = db.getCollection('tests');
    expect(collection).toBeDefined();

    const model = collection.model;

    await expect(async () => {
      await queryTable(model, 'tests');
    }).rejects.toThrowError();

    await collectionModel.migrate();

    const tableFields = await queryTable(model, 'tests');
    expect(tableFields['id']).toBeDefined();
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

  it('should create subTable fields', async () => {
    const fieldRepository = db.getCollection('fields').repository;

    const orderCollectionModel = (await collectionRepository.create({
      values: {
        name: 'orders',
      },
    })) as CollectionModel;

    await orderCollectionModel.migrate();

    const options = {
      interface: 'subTable',
      type: 'hasMany',
      collectionName: 'orders',
      name: 'order-items',
      uiSchema: {
        type: 'array',
        title: '订单详情',
        'x-decorator': 'FormItem',
        'x-component': 'Table',
        'x-component-props': {},
      },
      children: [
        {
          interface: 'input',
          type: 'string',
          name: 'count',
          uiSchema: {
            type: 'string',
            title: '商品数量',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
        },
        {
          interface: 'input',
          type: 'decimal',
          name: 'price',
          uiSchema: {
            type: 'number',
            title: '商品金额',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
        },
      ],
    };

    const fieldInstance = (await fieldRepository.create({
      values: options,
    })) as FieldModel;

    expect(fieldInstance).toBeDefined();

    // @ts-ignore
    expect(await fieldInstance.countChildren()).toEqual(2);
    await fieldInstance.load();

    const ordersCollection = db.getCollection('orders');
    const field = <HasManyField>ordersCollection.getField(fieldInstance.get('name') as string);
    expect(field).toBeDefined();

    const Target = field.TargetModel;
    expect(Target.rawAttributes['count']).toBeDefined();
    expect(Target.rawAttributes['price']).toBeDefined();

    await orderCollectionModel.migrate();

    const fields = await queryTable(ordersCollection.model, Target.tableName);
    expect(fields['count']).toBeDefined();
    expect(fields['price']).toBeDefined();
  });

  it('should delete collection', async () => {
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

    expect(collectionModel).toEqual(expect.anything());
    expect(await db.getCollection('fields').repository.count()).toEqual(1);

    await collectionRepository.destroy({
      filter: {
        name: 'tests',
      },
    });

    expect(await db.getCollection('fields').repository.count()).toEqual(0);
  });

  it('should delete collection with reverseField', async () => {
    await collectionRepository.create({
      values: {
        name: 'users',
      },
    });

    await collectionRepository.create({
      values: {
        name: 'posts',
      },
    });

    await db.getCollection('fields').repository.create({
      values: {
        collectionName: 'users',
        type: 'hasMany',
        target: 'posts',
      },
    });

    expect(await db.getCollection('fields').repository.count()).toEqual(2);

    await collectionRepository.destroy({
      filter: {
        name: 'users',
      },
    });

    expect(await db.getCollection('fields').repository.count()).toEqual(0);
  });
});
