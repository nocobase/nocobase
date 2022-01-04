import { mockServer, MockServer } from '@nocobase/test';
import { BelongsToManyField, Database } from '@nocobase/database';
import { mockUiSchema } from './mockUiSchema';
import PluginCollectionManager from '../server';
import { FieldOptions } from '../collection-manager';
import { CollectionModel } from '../models/collection-model';
import { queryTable } from './helper';
import { CollectionRepository } from '../repositories/collection-repository';
import { FieldRepository } from '../repositories/field-repository';
import { FieldModel } from '../models/field-model';

describe('collection model', () => {
  let app: MockServer;
  let db: Database;
  let collectionRepository: CollectionRepository;

  let fieldRepository: FieldRepository;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
    });
    db = app.db;

    await mockUiSchema(db);
    app.plugin(PluginCollectionManager);

    await app.load();

    collectionRepository = db.getCollection('collections').repository as CollectionRepository;
    fieldRepository = db.getCollection('fields').repository as FieldRepository;
  });

  describe('create normal field', () => {
    it('should sync collection', async () => {
      const userCollectionModel = (await collectionRepository.create({
        values: {
          name: 'users',
        },
      })) as CollectionModel;

      await userCollectionModel.migrate();

      const usersCollection = db.getCollection('users');

      await fieldRepository.create({
        values: {
          interface: 'test',
          type: 'string',
          collectionName: 'users',
          name: 'name',
        },
      });

      expect(usersCollection.model.rawAttributes['name']).not.toBeDefined();
      await userCollectionModel.migrate();
      expect(usersCollection.model.rawAttributes['name']).toBeDefined();

      await fieldRepository.create({
        values: {
          interface: 'test',
          type: 'integer',
          collectionName: 'users',
          name: 'age',
        },
      });
      await userCollectionModel.migrate();

      expect(usersCollection.model.rawAttributes['age']).toBeDefined();
    });
  });

  describe('create hasMany Field', () => {
    let postCollectionModel: CollectionModel;
    let commentCollectionModel: CollectionModel;

    beforeEach(async () => {
      postCollectionModel = await collectionRepository.create({
        values: {
          name: 'posts',
        },
      });

      await postCollectionModel.migrate();

      commentCollectionModel = await collectionRepository.create({
        values: {
          name: 'comments',
        },
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
        await fieldRepository.create({
          values: options,
        });
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

      await fieldRepository.create({
        values: options,
      });

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
      postCollectionModel = await collectionRepository.create({
        values: {
          name: 'posts',
        },
      });

      await postCollectionModel.migrate();

      tagsCollectionModel = await collectionRepository.create({
        values: {
          name: 'tags',
        },
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

      const fieldInstance = (await fieldRepository.create({
        values: options,
      })) as FieldModel;

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
      await fieldRepository.create({
        values: {
          interface: 'test',
          type: 'string',
          collectionName: 'posts',
          name: 'unique-title',
        },
      });

      await fieldRepository.create({
        values: {
          interface: 'test',
          type: 'string',
          collectionName: 'tags',
          name: 'unique-name',
        },
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

      const fieldInstance = (await fieldRepository.create({
        values: options,
      })) as FieldModel;

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
      userCollectionModel = await collectionRepository.create({
        values: {
          name: 'users',
        },
      });
      await userCollectionModel.migrate();

      profileCollectionModel = await collectionRepository.create({
        values: {
          name: 'profiles',
        },
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

      const fieldInstance = (await fieldRepository.create({
        values: options,
      })) as FieldModel;
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
      await fieldRepository.create({
        values: {
          interface: 'test',
          type: 'string',
          collectionName: 'users',
          name: 'unique-name',
          allowNull: false,
        },
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

      const fieldInstance = (await fieldRepository.create({
        values: options,
      })) as FieldModel;
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
      userCollectionModel = await collectionRepository.create({
        values: {
          name: 'users',
        },
      });

      await userCollectionModel.migrate();

      profileCollectionModel = await collectionRepository.create({
        values: {
          name: 'profiles',
        },
      });

      await profileCollectionModel.migrate();

      postCollectionModel = await collectionRepository.create({
        values: {
          name: 'posts',
        },
      });
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
        await fieldRepository.create({
          values: options,
        });
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

      await fieldRepository.create({
        values: options,
      });
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

      await fieldRepository.create({
        values: options,
      });
      await userCollectionModel.migrate();
      await postCollectionModel.migrate();

      expect(db.getCollection('users').model.associations['posts']).toBeDefined();
      expect(db.getCollection('users').model.associations['posts'].associationType).toEqual('HasMany');

      expect(db.getCollection('posts').model.associations['user']).toBeDefined();
      expect(db.getCollection('posts').model.associations['user'].associationType).toEqual('BelongsTo');
    });
  });

  describe('delete field', () => {
    it('should delete field', async () => {
      const UserModel = (await collectionRepository.create({
        values: {
          name: 'users',
          fields: [
            {
              type: 'integer',
              name: 'age',
            },
            {
              type: 'string',
              name: 'firstName',
            },
          ],
        },
      })) as CollectionModel;

      const userCollection = await UserModel.load();

      expect(userCollection.getField('age')).toBeDefined();

      await db.getCollection('fields').repository.destroy({
        filter: {
          name: 'age',
        },
      });

      await UserModel.load();

      expect(userCollection.getField('age')).not.toBeDefined();
    });
  });
});
