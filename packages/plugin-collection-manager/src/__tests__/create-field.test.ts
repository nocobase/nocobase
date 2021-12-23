import { mockServer, MockServer } from '@nocobase/test';
import { BelongsToManyField, Database, HasManyField, HasOneField } from '@nocobase/database';
import { mockUiSchema } from './mockUiSchema';
import PluginCollectionManager from '../server';
import { CollectionManager, FieldOptions } from '../collection-manager';
import { before, has } from 'lodash';
import { CollectionModel } from '../collection-model';
import { FieldModel } from '../field-model';

describe('create field', () => {
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

  describe('create normal field', () => {
    it('should sync collection', async () => {
      const collectionManager = new CollectionManager(db);

      const userCollectionModel = await collectionManager.createCollection({
        name: 'users',
      });

      await userCollectionModel.migrate();
      const usersCollection = db.getCollection('users');

      await collectionManager.createField({
        interface: 'test',
        type: 'string',
        collectionName: 'users',
        name: 'name',
      });

      expect(usersCollection.model.rawAttributes['name']).not.toBeDefined();
      await userCollectionModel.migrate();
      expect(usersCollection.model.rawAttributes['name']).toBeDefined();

      await collectionManager.createField({
        interface: 'test',
        type: 'integer',
        collectionName: 'users',
        name: 'age',
      });
      await userCollectionModel.migrate();

      expect(usersCollection.model.rawAttributes['age']).toBeDefined();
    });
  });

  describe('create hasMany Field', () => {
    let collectionManager: CollectionManager;
    let postCollectionModel: CollectionModel;
    let commentCollectionModel: CollectionModel;

    beforeEach(async () => {
      collectionManager = new CollectionManager(db);
      postCollectionModel = await collectionManager.createCollection({
        name: 'posts',
      });

      await postCollectionModel.migrate();

      commentCollectionModel = await collectionManager.createCollection({
        name: 'comments',
      });

      await commentCollectionModel.migrate();
    });

    it('should failed when target collection not exists', async () => {
      const options: FieldOptions = {
        collectionName: postCollectionModel.getName(),
        interface: 'someInterface',
        type: 'hasMany',
        uiSchema: {
          title: 'some ui schema',
          'x-decorator': 'FormItem',
          'x-component': 'Table',
          'x-component-props': {},
        },
      };

      await expect(async () => {
        await collectionManager.createField(options);
      }).rejects.toThrow(Error);
    });

    it('should create hasMany field', async () => {
      const options: FieldOptions = {
        collectionName: postCollectionModel.getName(),
        interface: 'someInterface',
        type: 'hasMany',
        target: commentCollectionModel.getName(),
        uiSchema: {
          title: 'some ui schema',
          'x-decorator': 'FormItem',
          'x-component': 'Table',
          'x-component-props': {},
        },
      };

      await collectionManager.createField(options);
      const hasManyFieldInstance = (await postCollectionModel.getFields())[0];

      // field name exists
      expect(hasManyFieldInstance.get('name')).toBeDefined();
      // interface exists
      expect(hasManyFieldInstance.get('interface')).toEqual(options.interface);
      // type exists
      expect(hasManyFieldInstance.get('type')).toEqual(options.type);
      expect((await hasManyFieldInstance.getCollection()).get('key')).toEqual(postCollectionModel.getKey());
      expect(hasManyFieldInstance.get('options')).toEqual(options);

      // uiSchema Saved
      expect(await hasManyFieldInstance.getUiSchema()).not.toBeNull();

      const reverseField = await hasManyFieldInstance.getReverseField();

      // reverse key exists
      expect(reverseField).not.toBeNull();
    });
  });

  describe('create belongsToMany Field', () => {
    let collectionManager: CollectionManager;
    let postCollectionModel: CollectionModel;
    let tagsCollectionModel: CollectionModel;

    beforeEach(async () => {
      collectionManager = new CollectionManager(db);
      postCollectionModel = await collectionManager.createCollection({
        name: 'posts',
      });

      await postCollectionModel.migrate();

      tagsCollectionModel = await collectionManager.createCollection({
        name: 'tags',
      });

      await tagsCollectionModel.migrate();
    });

    it('should create belongsToMany field', async () => {
      const options: FieldOptions = {
        interface: 'linkTo',
        type: 'belongsToMany',
        collectionName: 'posts',
        target: 'tags',
        uiSchema: {
          type: 'array',
          title: '这是一个关联字段',
          'x-component': 'RecordPicker',
          'x-component-props': {},
          'x-decorator': 'FormItem',
        },
      };

      const fieldInstance = await collectionManager.createField(options);
      expect(fieldInstance).not.toBeNull();

      const postsCollection = db.getCollection('posts');

      expect(postsCollection.getField(fieldInstance.get('name'))).not.toBeDefined();

      const fieldModel = new FieldModel(fieldInstance, db);
      await fieldModel.load();

      const field = <BelongsToManyField>postsCollection.getField(fieldInstance.get('name'));
      expect(field).toBeDefined();

      // through table name
      expect(field.through).toEqual('posts_tags');
      const TargetModel = field.TargetModel;

      // target model
      expect(TargetModel.name).toEqual('tags');
    });

    it('should create belongsToMany with field options', async () => {
      await collectionManager.createField({
        interface: 'test',
        type: 'string',
        collectionName: 'posts',
        name: 'unique-title',
      });

      await collectionManager.createField({
        interface: 'test',
        type: 'string',
        collectionName: 'tags',
        name: 'unique-name',
      });

      await postCollectionModel.migrate();
      await tagsCollectionModel.migrate();

      // posts belongsToMany tags
      const options: FieldOptions = {
        interface: 'linkTo',
        type: 'belongsToMany',
        collectionName: 'posts',

        sourceKey: 'unique-title',
        targetKey: 'unique-name',
        otherKey: 'unique-name',
        foreignKey: 'unique-title',
        through: 'test-through-table',

        target: 'tags',
        uiSchema: {
          type: 'array',
          title: '这是一个关联字段',
          'x-component': 'RecordPicker',
          'x-component-props': {},
          'x-decorator': 'FormItem',
        },
      };

      const fieldInstance = await collectionManager.createField(options);

      const fieldModel = new FieldModel(fieldInstance, db);
      await fieldModel.load();

      const postsCollection = db.getCollection('posts');

      const field = <BelongsToManyField>postsCollection.getField(fieldInstance.get('name'));
      expect(field).toBeDefined();

      // through table name
      expect(field.through).toEqual(options.through);
      const ThroughModel = db.sequelize.model(field.through);
      expect(ThroughModel.rawAttributes['unique-title']).toBeDefined();
      expect(ThroughModel.rawAttributes['unique-name']).toBeDefined();
    });
  });

  describe('create hasOne field', () => {
    let collectionManager: CollectionManager;
    let userCollectionModel: CollectionModel;
    let profileCollectionModel: CollectionModel;

    beforeEach(async () => {
      collectionManager = new CollectionManager(db);

      userCollectionModel = await collectionManager.createCollection({
        name: 'users',
      });

      await userCollectionModel.migrate();

      profileCollectionModel = await collectionManager.createCollection({
        name: 'profiles',
      });

      await profileCollectionModel.migrate();
    });

    it('should create hasOne field', async () => {
      const options: FieldOptions = {
        interface: 'test',
        type: 'hasOne',
        collectionName: 'users',
        target: 'profiles',
        uiSchema: {
          test: 'test',
        },
      };

      const fieldInstance = await collectionManager.createField(options);
      const profileCollection = db.getCollection('profiles');

      expect(profileCollection.model.rawAttributes['userId']).toBeUndefined();

      const fieldModel = new FieldModel(fieldInstance, db);
      await fieldModel.load();

      expect(profileCollection.model.rawAttributes['userId']).toBeDefined();

      await userCollectionModel.migrate();

      const userCollection = db.getCollection('users');

      const association = userCollection.model.associations[fieldInstance.get('name')];
      expect(association).toBeDefined();
      expect(association.associationType).toEqual('HasOne');

      await profileCollectionModel.migrate();
      const reverseField = await fieldInstance.getReverseField();
      // reverse association
      const reverseAssociation = profileCollection.model.associations[reverseField.get('name')];
      expect(reverseAssociation).toBeDefined();
      expect(reverseAssociation.associationType).toEqual('BelongsTo');
    });

    it('should create hasOne field with custom foreignKey', async () => {
      await collectionManager.createField({
        interface: 'test',
        type: 'string',
        collectionName: 'users',
        name: 'unique-name',
        unique: true,
      });

      await userCollectionModel.migrate();

      const userCollection = db.getCollection('users');

      const rawUniqueNameAttribute = userCollection.model.rawAttributes['unique-name'];
      expect(rawUniqueNameAttribute).toBeDefined();

      const options: FieldOptions = {
        interface: 'test',
        type: 'hasOne',
        collectionName: 'users',
        foreignKey: 'user-name',
        sourceKey: 'unique-name',
        target: 'profiles',
        uiSchema: {
          test: 'test',
        },
      };

      const fieldInstance = await collectionManager.createField(options);
      const profileCollection = db.getCollection('profiles');

      const fieldModel = new FieldModel(fieldInstance, db);

      await fieldModel.load();

      await profileCollectionModel.migrate();

      const userNameAttribute = profileCollection.model.rawAttributes['user-name'];
      expect(userNameAttribute).toBeDefined();
      expect(userNameAttribute.references['key']).toEqual('unique-name');

      // expect reverse association exists
      const reverseField = await fieldInstance.getReverseField();
      const reverseAssociation = profileCollection.model.associations[reverseField.get('name')];
      expect(reverseAssociation).toBeDefined();
      expect(reverseAssociation.associationType).toEqual('BelongsTo');
    });
  });

  describe('create belongsTo field', () => {});

  it('should create subTable fields', async () => {
    const collectionManger = new CollectionManager(db);

    const orderCollectionModel = await collectionManger.createCollection({
      name: 'orders',
    });

    await orderCollectionModel.migrate();

    const options = {
      interface: 'subTable',
      type: 'hasMany',
      collectionName: 'orders',
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

    const fieldInstance = await collectionManger.createField(options);
    expect(fieldInstance).toBeDefined();

    expect(await fieldInstance.countChildren()).toEqual(2);

    const fieldModel = new FieldModel(fieldInstance, db);
    await fieldModel.load();

    const ordersCollection = db.getCollection('orders');
    const field = <HasManyField>ordersCollection.getField(fieldInstance.get('name'));
    expect(field).toBeDefined();

    const Target = field.TargetModel;
    expect(Target.rawAttributes['count']).toBeDefined();
    expect(Target.rawAttributes['price']).toBeDefined();
  });
});
