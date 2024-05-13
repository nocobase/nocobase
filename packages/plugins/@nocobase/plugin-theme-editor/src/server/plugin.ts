/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InstallOptions, Plugin } from '@nocobase/server';
import path, { resolve } from 'path';
import { compact, compactDark, dark, defaultTheme } from './builtinThemes';

export class PluginThemeEditorServer extends Plugin {
  theme: any;

  afterAdd() {}

  async beforeLoad() {}

  async load() {
    await this.importCollections(path.resolve(__dirname, './collections'));
    this.db.addMigrations({
      namespace: 'theme-editor',
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });

    this.app.acl.allow('themeConfig', 'list', 'public');

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.themeConfig`,
      actions: ['themeConfig:*'],
    });
  }

  async install(options?: InstallOptions) {
    const themeRepo = this.db.getRepository('themeConfig');

    if (!themeRepo) {
      throw new Error(`themeConfig repository does not exist`);
    }

    if ((await themeRepo.count()) === 0) {
      await themeRepo.create({
        values: [defaultTheme, dark, compact, compactDark],
      });
    }
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginThemeEditorServer;
