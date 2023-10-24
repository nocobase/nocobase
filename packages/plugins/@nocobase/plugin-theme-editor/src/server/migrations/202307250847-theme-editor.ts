import { Migration } from '@nocobase/server';
import { antd, compact, compactDark, dark } from '../builtinThemes';

export default class ThemeEditorMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<0.14.0-alpha.8');

    if (!result) {
      return;
    }

    const themeRepo = this.db.getRepository('themeConfig');
    if (!themeRepo) {
      return;
    }

    themeRepo.collection.addField('uid', {
      type: 'uid',
    });
    await this.db.sync();

    // 为之前的数据添加上 uid
    await themeRepo.update({
      filter: {
        'config.name': 'Default theme of antd',
      },
      values: {
        config: {
          // 更改名字
          name: 'Default',
        },
        uid: 'default',
      },
    });
    await themeRepo.update({
      filter: {
        'config.name': 'Dark',
      },
      values: {
        uid: 'dark',
      },
    });
    await themeRepo.update({
      filter: {
        'config.name': 'Compact',
      },
      values: {
        uid: 'compact',
      },
    });
    await themeRepo.update({
      filter: {
        'config.name': 'Compact dark',
      },
      values: {
        uid: 'compact_dark',
      },
    });

    // 补充默认主题
    if (
      !(await themeRepo.findOne({
        filter: {
          uid: 'default',
        },
      }))
    ) {
      await themeRepo.create({
        values: [antd],
      });
    }
    if (
      !(await themeRepo.findOne({
        filter: {
          uid: 'dark',
        },
      }))
    ) {
      await themeRepo.create({
        values: [dark],
      });
    }
    if (
      !(await themeRepo.findOne({
        filter: {
          uid: 'compact',
        },
      }))
    ) {
      await themeRepo.create({
        values: [compact],
      });
    }
    if (
      !(await themeRepo.findOne({
        filter: {
          uid: 'compact_dark',
        },
      }))
    ) {
      await themeRepo.create({
        values: [compactDark],
      });
    }
  }

  async down() {}
}
