import { InstallOptions, Plugin } from '@nocobase/server';

export class MobileClientPlugin extends Plugin {
  afterAdd() {}

  async load() {
    const repository = this.app.db.getRepository('uiRoutes');
    const routes = [
      {
        type: 'route',
        path: '/mobile',
        component: 'MobileApplication',
        title: 'NocoBase Mobile',
        uiSchema: {
          type: 'void',
          'x-component': 'MobileCenter',
          'x-designer': 'MobileCenter.Designer',
          'x-initializer': 'MobileCenterInitializers',
          'x-component-props': {},
          properties: {},
        },
        routes: [
          {
            type: 'route',
            path: ':name(.+)?',
            'x-component': 'RouteSchemaComponent',
          },
        ],
      },
    ];
    for (const values of routes) {
      await repository.create({
        values,
      });
    }
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default MobileClientPlugin;
