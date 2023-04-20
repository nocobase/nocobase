import { InstallOptions, Plugin } from '@nocobase/server';

export class MobileClientPlugin extends Plugin {
  afterAdd() {}

  async load() {
    const repository = this.app.db.getRepository('uiRoutes');
    const routes = [
      {
        type: 'route',
        path: '/mobile/:name(.+)?',
        component: 'MApplication',
        title: 'NocoBase Mobile',
        uiSchema: {
          type: 'void',
          'x-component': 'MContainer',
          'x-designer': 'MContainer.Designer',
          'x-component-props': {},
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'MBlockInitializers',
              properties: {},
            },
          },
        },
        routes: [
          {
            type: 'route',
            path: '',
            component: 'RouteSchemaComponent',
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
