import { MockServer, createMockServer } from '@nocobase/test';
import Migration, { getIds, schemaToRoutes } from '../migrations/2024122912211-transform-menu-schema-to-routes';

describe('transform-menu-schema-to-routes', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    await app.version.update('1.5.0');
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('migration', () => {
    test('should skip if desktop routes already exist', async () => {
      const desktopRoutes = app.db.getRepository('desktopRoutes');
      await desktopRoutes.create({
        type: 'page',
        title: 'Test Page',
      } as any);

      const migration = new Migration({
        db: app.db,
        app: app,
      } as any);

      await migration.up();
      const count = await desktopRoutes.count();
      expect(count).toBe(1);
    });
  });

  describe('schemaToRoutes', () => {
    test('should transform group menu item', async () => {
      const schema = {
        properties: {
          group1: {
            'x-component': 'Menu.SubMenu',
            title: 'Group 1',
            'x-uid': 'group-1',
            'x-component-props': {
              icon: 'GroupIcon',
            },
            properties: {},
          },
        },
      };

      const routes = await schemaToRoutes(schema, app.db.getRepository('uiSchemas'));
      expect(routes[0]).toMatchObject({
        type: 'group',
        title: 'Group 1',
        icon: 'GroupIcon',
        schemaUid: 'group-1',
        hideInMenu: false,
      });
    });

    test('should transform link menu item', async () => {
      const schema = {
        properties: {
          link1: {
            'x-component': 'Menu.URL',
            title: 'Link 1',
            'x-uid': 'link-1',
            'x-component-props': {
              icon: 'LinkIcon',
              href: 'https://example.com',
              params: { foo: 'bar' },
            },
          },
        },
      };

      const routes = await schemaToRoutes(schema, app.db.getRepository('uiSchemas'));
      expect(routes[0]).toMatchObject({
        type: 'link',
        title: 'Link 1',
        icon: 'LinkIcon',
        options: {
          href: 'https://example.com',
          params: { foo: 'bar' },
        },
        schemaUid: 'link-1',
      });
    });
  });

  describe('getIds', () => {
    test('should correctly identify ids to add and remove', () => {
      const desktopRoutes = [
        { id: 1, type: 'page', menuSchemaUid: 'page-1' },
        { id: 2, type: 'page', menuSchemaUid: 'page-2' },
        { id: 3, type: 'tabs', parentId: 1 },
      ];

      const menuUiSchemas = [{ 'x-uid': 'page-1' }];

      const { needRemoveIds, needAddIds } = getIds(desktopRoutes, menuUiSchemas);
      expect(needRemoveIds).toContain(2);
      expect(needAddIds).toContain(1);
      expect(needAddIds).toContain(3);
    });
  });
});
