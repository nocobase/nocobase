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
        uiSchema: {
          type: 'void',
          'x-component': 'MContainer',
          'x-designer': 'MContainer.Designer',
          'x-component-props': {},
          properties: {
            page: {
              type: 'void',
              'x-component': 'MPage',
              'x-designer': 'MPage.Designer',
              'x-component-props': {},
              properties: {
                grid: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'MBlockInitializers',
                  'x-component-props': {
                    showDivider: false,
                  },
                },
              },
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
