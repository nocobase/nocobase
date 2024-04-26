import { Migration, OFFICIAL_PLUGIN_PREFIX } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.0.0-alpha.1';

  async up() {
    const resources = await this.app.localeManager.getCacheResources('en-US');
    const modules = Object.keys(resources);
    console.log(resources, modules);
    const toBeDeleted = [];
    modules.forEach((module) => {
      if (!module.startsWith(OFFICIAL_PLUGIN_PREFIX)) {
        return;
      }
      const name = module.replace(OFFICIAL_PLUGIN_PREFIX, '');
      if (!modules.includes(name)) {
        return;
      }
      toBeDeleted.push(module);
    });
    if (!toBeDeleted.length) {
      return;
    }
    await this.db.getRepository('localizationTexts').destroy({
      filter: {
        module: {
          $in: toBeDeleted.map((module) => `resources.${module}`),
        },
      },
    });
  }
}
