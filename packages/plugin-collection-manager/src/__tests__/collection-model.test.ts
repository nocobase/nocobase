import { mockServer, MockServer } from '@nocobase/test';
import { BelongsToManyField, Database, HasManyField, HasOneField } from '@nocobase/database';
import { mockUiSchema } from './mockUiSchema';
import PluginCollectionManager from '../server';
import { CollectionManager, FieldOptions } from '../collection-manager';
import { CollectionModel } from '../models/collection-model';
import { CollectionRepository } from '../repositories/collection-repository';
import { queryTable } from './helper';

describe('collection model', () => {
  let app: MockServer;
  let db: Database;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      database: {
        // dialect: 'postgres',
        // database: 'nocobase_test',
        // username: 'chareice',
      },
    });
    db = app.db;

    await mockUiSchema(db);
    app.plugin(PluginCollectionManager);

    await app.load();
  });

  describe('create normal field', () => {
    it('should sync collection', async () => {
      const userCollectionModel = await CollectionManager.createCollection(
        {
          name: 'users',
        },
        db,
      );

      await userCollectionModel.migrate();

      const usersCollection = db.getCollection('users');

      await CollectionManager.createField(
        {
          interface: 'test',
          type: 'string',
          collectionName: 'users',
          name: 'name',
        },
        db,
      );

      expect(usersCollection.model.rawAttributes['name']).not.toBeDefined();
      await userCollectionModel.migrate();
      expect(usersCollection.model.rawAttributes['name']).toBeDefined();

      await CollectionManager.createField(
        {
          interface: 'test',
          type: 'integer',
          collectionName: 'users',
          name: 'age',
        },
        db,
      );
      await userCollectionModel.migrate();

      expect(usersCollection.model.rawAttributes['age']).toBeDefined();
    });
  });

  describe('create hasMany Field', () => {
    let postCollectionModel: CollectionModel;
    let commentCollectionModel: CollectionModel;

    beforeEach(async () => {
      postCollectionModel = await CollectionManager.createCollection(
        {
          name: 'posts',
        },
        db,
      );

      await postCollectionModel.migrate();

      commentCollectionModel = await CollectionManager.createCollection(
        {
          name: 'comments',
        },
        db,
      );

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
        await CollectionManager.createField(options, db);
      }).rejects.toThrow(Error);
    });

    it('should create hasMany field', async () => {
      const options: FieldOptions = {
        collectionName: postCollectionModel.getName(),
        interface: 'someInterface',
        type: 'hasMany',
        name: 'test-hasMany',
        target: commentCollectionModel.getName(),
        uiSchema: {
          title: 'some ui schema',
          'x-decorator': 'FormItem',
          'x-component': 'Table',
          'x-component-props': {},
        },
      };

      await CollectionManager.createField(options, db);

      // @ts-ignore
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

      await postCollectionModel.migrate();
      const fields = await queryTable(db.getCollection('comments').model, 'comments');

      expect(fields['postId']).toBeDefined();
    });
  });

  describe('create belongsToMany Field', () => {
    let postCollectionModel: CollectionModel;
    let tagsCollectionModel: CollectionModel;

    beforeEach(async () => {
      postCollectionModel = await CollectionManager.createCollection(
        {
          name: 'posts',
        },
        db,
      );

      await postCollectionModel.migrate();

      tagsCollectionModel = await CollectionManager.createCollection(
        {
          name: 'tags',
        },
        db,
      );

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

      const fieldInstance = await CollectionManager.createField(options, db);
      expect(fieldInstance).not.toBeNull();

      const postsCollection = db.getCollection('posts');

      expect(postsCollection.getField(fieldInstance.get('name') as string)).not.toBeDefined();

      await fieldInstance.load();

      const field = <BelongsToManyField>postsCollection.getField(fieldInstance.get('name') as string);
      expect(field).toBeDefined();

      // through table name
      expect(field.through).toEqual('posts_tags');
      const TargetModel = field.TargetModel;

      // target model
      expect(TargetModel.name).toEqual('tags');
    });

    it('should create belongsToMany with field options', async () => {
      await CollectionManager.createField(
        {
          interface: 'test',
          type: 'string',
          collectionName: 'posts',
          name: 'unique-title',
        },
        db,
      );

      await CollectionManager.createField(
        {
          interface: 'test',
          type: 'string',
          collectionName: 'tags',
          name: 'unique-name',
        },
        db,
      );

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

      const fieldInstance = await CollectionManager.createField(options, db);
      await fieldInstance.load();

      const postsCollection = db.getCollection('posts');

      const field = <BelongsToManyField>postsCollection.getField(fieldInstance.get('name') as string);
      expect(field).toBeDefined();

      // through table name
      expect(field.through).toEqual(options.through);
      const ThroughModel = db.sequelize.model(field.through);
      expect(ThroughModel.rawAttributes['unique-title']).toBeDefined();
      expect(ThroughModel.rawAttributes['unique-name']).toBeDefined();

      await postCollectionModel.migrate();
      const fields = await queryTable(postsCollection.model, field.through);
      expect(fields['unique-title']).toBeDefined();
      expect(fields['unique-name']).toBeDefined();
    });
  });

  describe('create hasOne field', () => {
    let userCollectionModel: CollectionModel;
    let profileCollectionModel: CollectionModel;

    beforeEach(async () => {
      userCollectionModel = await CollectionManager.createCollection(
        {
          name: 'users',
        },
        db,
      );

      await userCollectionModel.migrate();

      profileCollectionModel = await CollectionManager.createCollection(
        {
          name: 'profiles',
        },
        db,
      );

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

      const fieldInstance = await CollectionManager.createField(options, db);
      const profileCollection = db.getCollection('profiles');

      expect(profileCollection.model.rawAttributes['userId']).toBeUndefined();

      await fieldInstance.load();

      expect(profileCollection.model.rawAttributes['userId']).toBeDefined();

      await userCollectionModel.migrate();

      const userCollection = db.getCollection('users');

      const association = userCollection.model.associations[fieldInstance.get('name') as string];
      expect(association).toBeDefined();
      expect(association.associationType).toEqual('HasOne');

      await profileCollectionModel.migrate();

      // @ts-ignore
      const reverseField = await fieldInstance.getReverseField();
      // reverse association
      const reverseAssociation = profileCollection.model.associations[reverseField.get('name')];
      expect(reverseAssociation).toBeDefined();
      expect(reverseAssociation.associationType).toEqual('BelongsTo');
    });

    it('should create hasOne field with custom foreignKey', async () => {
      await CollectionManager.createField(
        {
          interface: 'test',
          type: 'string',
          collectionName: 'users',
          name: 'unique-name',
          allowNull: false,
        },
        db,
      );

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

      const fieldInstance = await CollectionManager.createField(options, db);
      const profileCollection = db.getCollection('profiles');

      await fieldInstance.load();

      await profileCollectionModel.migrate();

      const userNameAttribute = profileCollection.model.rawAttributes['user-name'];
      expect(userNameAttribute).toBeDefined();
      expect(userNameAttribute.references['key']).toEqual('unique-name');

      // expect reverse association exists
      // @ts-ignore
      const reverseField = await fieldInstance.getReverseField();
      const reverseAssociation = profileCollection.model.associations[reverseField.get('name')];
      expect(reverseAssociation).toBeDefined();
      expect(reverseAssociation.associationType).toEqual('BelongsTo');
    });
  });

  describe('create belongsTo field', () => {
    let userCollectionModel: CollectionModel;
    let profileCollectionModel: CollectionModel;
    let postCollectionModel: CollectionModel;

    beforeEach(async () => {
      userCollectionModel = await CollectionManager.createCollection(
        {
          name: 'users',
        },
        db,
      );

      await userCollectionModel.migrate();

      profileCollectionModel = await CollectionManager.createCollection(
        {
          name: 'profiles',
        },
        db,
      );

      await profileCollectionModel.migrate();

      postCollectionModel = await CollectionManager.createCollection(
        {
          name: 'posts',
        },
        db,
      );
    });

    it('should not create belongsTo without revereField', async () => {
      const options: FieldOptions = {
        interface: 'linkTo',
        type: 'belongsTo',
        collectionName: 'profiles',
        target: 'users',
        uiSchema: {
          test: 'schema',
        },
      };

      await expect(async () => {
        await CollectionManager.createField(options, db);
      }).rejects.toThrow(Error);
    });

    it('should create belongsTo with hasOne reverseField', async () => {
      const options: FieldOptions = {
        interface: 'linkTo',
        type: 'belongsTo',
        collectionName: 'profiles',
        target: 'users',
        name: 'user',
        reverseField: {
          name: 'profile',
          type: 'hasOne',
        },
        uiSchema: {
          test: 'schema',
        },
      };

      await CollectionManager.createField(options, db);
      await userCollectionModel.migrate();
      await profileCollectionModel.migrate();

      expect(db.getCollection('users').model.associations['profile']).toBeDefined();
      expect(db.getCollection('users').model.associations['profile'].associationType).toEqual('HasOne');
      expect(db.getCollection('profiles').model.associations['user']).toBeDefined();
      expect(db.getCollection('profiles').model.associations['user'].associationType).toEqual('BelongsTo');
    });

    it('should create belongsTo with hasMany reverseField', async () => {
      const options: FieldOptions = {
        interface: 'linkTo',
        type: 'belongsTo',
        collectionName: 'posts',
        target: 'users',
        name: 'user',
        reverseField: {
          name: 'posts',
          type: 'hasMany',
        },
        uiSchema: {
          test: 'schema',
        },
      };

      await CollectionManager.createField(options, db);
      await userCollectionModel.migrate();
      await postCollectionModel.migrate();

      expect(db.getCollection('users').model.associations['posts']).toBeDefined();
      expect(db.getCollection('users').model.associations['posts'].associationType).toEqual('HasMany');

      expect(db.getCollection('posts').model.associations['user']).toBeDefined();
      expect(db.getCollection('posts').model.associations['user'].associationType).toEqual('BelongsTo');
    });
  });

  it('should create subTable fields', async () => {
    const orderCollectionModel = await CollectionManager.createCollection(
      {
        name: 'orders',
      },
      db,
    );

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

    const fieldInstance = await CollectionManager.createField(options, db);
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
});
