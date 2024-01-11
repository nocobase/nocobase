import { Op } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import { getTextsFromDB, getTextsFromMenu } from '../actions/localization';
import { NAMESPACE_COLLECTIONS, NAMESPACE_MENUS } from '../constans';

export default class FixModuleMigration extends Migration {
  appVersion = '<0.17.0-alpha.3';
  async up() {
    const result = await this.app.version.satisfies('<=0.17.0-alpha.4');

    if (!result) {
      return;
    }

    const resources = await this.app.localeManager.getCacheResources('zh-CN');
    const menus = await getTextsFromMenu(this.context.db, true);
    const collections = await getTextsFromDB(this.context.db);

    const db = this.context.db;
    await db.getCollection('localizationTexts').sync();
    await db.sequelize.transaction(async (t) => {
      const menuTexts = Object.keys(menus);
      await db.getModel('localizationTexts').update(
        {
          module: `resources.${NAMESPACE_MENUS}`,
        },
        {
          where: {
            text: {
              [Op.in]: menuTexts,
            },
          },
          transaction: t,
        },
      );

      const collectionTexts = Object.keys(collections);
      await db.getModel('localizationTexts').update(
        {
          module: `resources.${NAMESPACE_COLLECTIONS}`,
        },
        {
          where: {
            text: {
              [Op.in]: collectionTexts,
            },
          },
          transaction: t,
        },
      );

      for (const [module, resource] of Object.entries(resources)) {
        if (module === 'client') {
          continue;
        }
        const texts = Object.keys(resource);
        await db.getModel('localizationTexts').update(
          {
            module: `resources.${module}`,
          },
          {
            where: {
              text: {
                [Op.in]: texts,
              },
            },
            transaction: t,
          },
        );
      }
    });
  }

  async down() {}
}
