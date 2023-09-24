import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class MobileClientPlugin extends Plugin {
  afterAdd() {}

  async load() {
    this.db.addMigrations({
      namespace: 'client',
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });
  }

  async install() {
    // const repository = this.app.db.getRepository('uiRoutes');
    // for (const values of routes) {
    //   await repository.create({
    //     values,
    //   });
    // }
    const uiSchemas = this.db.getRepository<any>('uiSchemas');
    const systemSettings = this.db.getRepository('systemSettings');
    const schema = await uiSchemas.insert({
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
    });
    const instance = await systemSettings.findOne();
    instance.set('options.mobileSchemaUid', schema['x-uid']);
    await instance.save();
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default MobileClientPlugin;
