import Database, { Collection as DBCollection } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('createdBy/updatedBy', () => {
  let api: MockServer;
  let db: Database;
  let Collection: DBCollection;
  let Field: DBCollection;

  beforeEach(async () => {
    api = await createMockServer({
      plugins: ['acl', 'users', 'collection-manager', 'error-handler', 'data-source-manager'],
    });
    db = api.db;

    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');
  });

  afterEach(async () => {
    await api.destroy();
  });

  it('should add createdBy field', async () => {
    await Collection.repository.create({
      values: {
        name: 'a',
        autoGenId: true,
        timestamps: false,
        title: 'A',
      },
      context: {},
    });

    const A = db.getCollection('a');

    await Field.repository.create({
      values: {
        name: 'xxxxxx',
        type: 'belongsTo',
        collectionName: 'a',
        target: 'users',
        foreignKey: 'createdById',
        uiSchema: {
          type: 'object',
          title: '{{t("Created by")}}',
          'x-component': 'AssociationField',
          'x-component-props': { fieldNames: { value: 'id', label: 'nickname' } },
          'x-read-pretty': true,
        },
        interface: 'createdBy',
      },
      context: {},
    });

    const currentUser = await db.getCollection('users').model.create();

    await A.repository.create({
      context: {
        state: {
          currentUser,
        },
      },
    });

    const p2 = await A.repository.findOne({
      appends: ['xxxxxx'],
    });

    const data = p2.toJSON();
    expect(data.xxxxxx.id).toBe(currentUser.id);
  });

  describe('collection definition', () => {
    it('case 1', async () => {
      const Post = db.collection({
        name: 'posts',
        createdBy: true,
        updatedBy: true,
      });
      expect(Post.hasField('createdBy')).toBeTruthy();
      expect(Post.hasField('updatedBy')).toBeTruthy();
    });

    it('case 2', async () => {
      const Post = db.collection({
        name: 'posts',
        createdBy: true,
        updatedBy: true,
      });
      await db.sync();
      const currentUser = await db.getCollection('users').model.create();
      await Post.repository.create({
        context: {
          state: {
            currentUser,
          },
        },
      });
      const p2 = await Post.repository.findOne({
        appends: ['createdBy', 'updatedBy'],
      });

      const data = p2.toJSON();
      expect(data.createdBy.id).toBe(currentUser.id);
      expect(data.updatedBy.id).toBe(currentUser.id);
    });

    it('case 3', async () => {
      const Post = db.collection({
        name: 'posts',
        createdBy: true,
        updatedBy: true,
      });
      await db.sync();
      const user1 = await db.getCollection('users').model.create();
      const user2 = await db.getCollection('users').model.create();
      const p1 = await Post.repository.create({
        context: {
          state: {
            currentUser: user1,
          },
        },
      });
      await Post.repository.update({
        values: {},
        filterByTk: p1.id,
        context: {
          state: {
            currentUser: user2,
          },
        },
      });
      const p2 = await Post.repository.findOne({
        appends: ['createdBy', 'updatedBy'],
      });
      const data = p2.toJSON();
      expect(data.createdBy.id).toBe(user1.get('id'));
      expect(data.updatedBy.id).toBe(user2.get('id'));
    });
  });
});
