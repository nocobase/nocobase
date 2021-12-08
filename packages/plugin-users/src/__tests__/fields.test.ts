import Database from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';

describe('createdBy/updatedBy', () => {
  let api: MockServer;
  let db: Database;

  beforeEach(async () => {
    api = mockServer();
    api.plugin(require('../server').default);
    await api.load();
    db = api.db;
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('collection definition', () => {
    it('case 1', async () => {
      const Post = db.collection({
        name: 'posts',
        createdBy: true,
        updatedBy: true,
      });
      expect(Post.hasField('createdBy')).toBeTruthy();
    });

    it('case 2', async () => {
      const Post = db.collection({
        name: 'posts',
        createdBy: true,
        updatedBy: true,
      });
      await db.sync();
      const currentUser = await db.getCollection('users').model.create();
      const p1 = await Post.repository.create({
        context: {
          state: {
            currentUser,
          },
        },
      });
      const p2 = await Post.repository.findOne({
        appends: ['createdBy', 'updatedBy'],
      });
      expect(p2.get('createdBy')).toMatchObject(currentUser.toJSON());
      expect(p2.get('updatedBy')).toMatchObject(currentUser.toJSON());
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
      const p1 = await Post.repository.create<any>({
        context: {
          state: {
            currentUser: user1,
          },
        },
      });
      await Post.repository.update({
        values: {},
        filterByPk: p1.id,
        context: {
          state: {
            currentUser: user2,
          },
        },
      });
      const p2 = await Post.repository.findOne({
        appends: ['createdBy', 'updatedBy'],
      });
      expect(p2.get('createdBy')).toMatchObject(user1.toJSON());
      expect(p2.get('updatedBy')).toMatchObject(user2.toJSON());
    });
  });
});
