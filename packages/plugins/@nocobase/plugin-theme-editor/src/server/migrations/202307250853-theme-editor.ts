import { Model } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import { compact, compactDark, dark, defaultTheme } from '../builtinThemes';

export default class extends Migration {
  appVersion = '<0.14.0-alpha.8';
  async up() {
    const result = await this.app.version.satisfies('<0.14.0-alpha.8');

    if (!result) {
      return;
    }

    const repository = this.db.getRepository('themeConfig');
    if (!repository) {
      return;
    }

    const collection = this.db.getCollection('themeConfig');

    await collection.sync();

    const themes = {
      [defaultTheme.uid]: defaultTheme,
      [dark.uid]: dark,
      [compact.uid]: compact,
      [compactDark.uid]: compactDark,
    };
    const items: Model[] = await repository.find();

    for (const item of items) {
      // 1. 已经有 uid，说明已经 migrate 过了
      if (item.uid) {
        if (themes[item.uid]) {
          delete themes[item.uid];
        }
        continue;
      }

      const config = item.get('config');

      // 2. 如果是之前旧版本的内置主题（通过 name 判断），需要设置上 uid，并更改默认主题的 name
      if (config.name === 'Default theme of antd') {
        item.set('uid', defaultTheme.uid);
        config.name = defaultTheme.config.name;
        item.set('config', config);
        item.changed('config', true);
        delete themes[defaultTheme.uid];
      } else if (config.name === dark.config.name) {
        item.set('uid', dark.uid);
        delete themes[dark.uid];
      } else if (config.name === compact.config.name) {
        item.set('uid', compact.uid);
        delete themes[compact.uid];
      } else if (config.name === compactDark.config.name) {
        item.set('uid', compactDark.uid);
        delete themes[compactDark.uid];
      } else {
        // 3. 如果是用户自定义的主题，需要设置上 uid
        item.set('uid', uid());
      }

      await item.save();
    }

    // 4. 创建新的内置主题
    if (Object.values(themes).length > 0) {
      await repository.create({ values: Object.values(themes) });
    }
  }

  async down() {}
}
