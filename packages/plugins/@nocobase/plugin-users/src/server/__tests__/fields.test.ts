import Database from '@nocobase/database';
import PluginACL from '@nocobase/plugin-acl';
import UsersPlugin from '@nocobase/plugin-users';
import { mockServer, MockServer } from '@nocobase/test';
import { userPluginConfig } from './utils';
describe('createdBy/updatedBy', () => {
  let api: MockServer;
  let db: Database;

  beforeEach(async () => {
    api = mockServer();
    api.plugin(UsersPlugin, userPluginConfig);
    api.plugin(PluginACL, { name: 'acl' });
    await api.loadAndInstall({ clean: true });
    db = api.db;
  });

  afterEach(async () => {
    await api.destroy();
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
