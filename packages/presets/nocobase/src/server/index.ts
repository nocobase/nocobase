/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, PluginManager } from '@nocobase/server';
import { findBuiltInPlugins, findLocalPlugins } from './findPackageNames';

export class PresetNocoBase extends Plugin {
  splitNames(name: string) {
    return (name || '').split(',').filter(Boolean);
  }

  async getBuiltInPlugins() {
    return await findBuiltInPlugins();
  }

  async getLocalPlugins() {
    return (await findLocalPlugins()).map((name) => name.split('>='));
  }

  async getPackageJson(name) {
    const { packageName } = await PluginManager.parseName(name);
    const packageJson = await PluginManager.getPackageJson(packageName);
    return { ...packageJson, name: packageName };
  }

  async allPlugins() {
    const builtInPlugins = await this.getBuiltInPlugins();
    const localPlugins = await this.getLocalPlugins();
    return (
      await Promise.all(
        builtInPlugins.map(async (pkgOrName) => {
          const { name } = await PluginManager.parseName(pkgOrName);
          const packageJson = await this.getPackageJson(pkgOrName);
          return {
            name,
            packageName: packageJson.name,
            enabled: true,
            builtIn: true,
            version: packageJson.version,
          } as any;
        }),
      )
    ).concat(
      await Promise.all(
        localPlugins.map(async (plugin) => {
          const { name } = await PluginManager.parseName(plugin[0]);
          const packageJson = await this.getPackageJson(plugin[0]);
          return { name, packageName: packageJson.name, version: packageJson.version };
        }),
      ),
    );
  }

  async getPluginToBeUpgraded() {
    const repository = this.app.db.getRepository<any>('applicationPlugins');
    const items = (await repository.find()).map((item) => item.name);
    const builtInPlugins = await this.getBuiltInPlugins();
    const localPlugins = await this.getLocalPlugins();
    const plugins = await Promise.all(
      builtInPlugins.map(async (pkgOrName) => {
        const { name } = await PluginManager.parseName(pkgOrName);
        const packageJson = await this.getPackageJson(pkgOrName);
        return {
          name,
          packageName: packageJson.name,
          enabled: true,
          builtIn: true,
          version: packageJson.version,
        } as any;
      }),
    );
    for (const plugin of localPlugins) {
      if (plugin[1]) {
        // 不在插件列表，并且插件最低版本小于当前应用版本，跳过不处理
        if (!items.includes(plugin[0]) && (await this.app.version.satisfies(`>${plugin[1]}`))) {
          continue;
        }
      }
      const pkgOrName = plugin[0];
      const { name } = await PluginManager.parseName(pkgOrName);
      const packageJson = await this.getPackageJson(pkgOrName);
      plugins.push({ name, packageName: packageJson.name, version: packageJson.version });
    }
    return plugins;
  }

  async updateOrCreatePlugins() {
    const repository = this.pm.repository;
    const plugins = await this.getPluginToBeUpgraded();
    await this.db.sequelize.transaction((transaction) => {
      return Promise.all(
        plugins.map((values) =>
          repository.updateOrCreate({
            transaction,
            values,
            filterKeys: ['name'],
          }),
        ),
      );
    });
  }

  async createIfNotExists() {
    const repository = this.pm.repository;
    const existPlugins = await repository.find();
    const existPluginNames = existPlugins.map((item) => item.name);
    const plugins = (await this.allPlugins()).filter((item) => !existPluginNames.includes(item.name));
    await repository.create({ values: plugins });
  }

  async install() {
    await this.createIfNotExists();
    this.log.info('start install built-in plugins');
    await this.pm.repository.init();
    await this.pm.load();
    await this.pm.install();
    this.log.info('finish install built-in plugins');
  }

  async upgrade() {
    this.log.info('update built-in plugins');
    await this.updateOrCreatePlugins();
  }
}

export default PresetNocoBase;
