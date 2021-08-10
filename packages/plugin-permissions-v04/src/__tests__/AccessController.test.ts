import { getApp } from '.';
import AccessController from '../AccessController';

describe('AccessController', () => {
  let app;
  let db;
  const ac: any = {};

  beforeEach(async () => {
    app = await getApp();
    db = app.database;

    ac.anonymous = new AccessController({
      state: {},
      db
    });

    const User = db.getModel('users');
    const user = await User.findByPk(1);
    ac.user = new AccessController({
      state: { currentUser: user },
      db
    });

    const root = await User.findByPk(4);
    ac.root = new AccessController({
      state: { currentUser: root },
      db
    });
  });

  afterEach(() => db.close());

  describe('can().permissions()', () => {
    it('anonymous', async () => {
      const result = await ac.anonymous.can('posts').permissions();
      expect(result).toMatchObject({
        actions: [
          { name: 'posts:list', scope: { filter: { status: 'published' }, collection_name: 'posts' } }
        ],
        fields: [
          { actions: ['posts:list'] }
        ],
        tabs: []
      });
    });
  });

  describe('can().act()', () => {
    it('normal user invoke can().permissions() invoked after .act()', async () => {
      const actionResult = await ac.user.can('posts').act('list').any();
      expect(actionResult.filter).toEqual({
        or: [
          { status: 'published' },
          { status: 'draft', 'created_by_id.$currentUser': true }
        ]
      });

      const permissionsResult = await ac.user.can('posts').permissions();
      expect(permissionsResult).toMatchObject({
        actions: [
          {
            name: 'posts:list',
            scope: { filter: { or: [{ status: 'published' }, { status: 'draft', 'created_by_id.$currentUser': true }] } }
          },
          {
            name: 'posts:update',
            scope: { filter: { status: 'draft', 'created_by_id.$currentUser': true }, collection_name: 'posts' },
          }
        ],
        tabs: []
      });
    });
  });
});
