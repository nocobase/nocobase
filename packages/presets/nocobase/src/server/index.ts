/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, PluginManager } from '@nocobase/server';
import _ from 'lodash';
import { findBuiltInPlugins, findPackageNames } from './findPackageNames';

export class PresetNocoBase extends Plugin {
  builtInPlugins = [];
  localPlugins = [];

  get allPlugins() {
    return this.builtInPlugins.concat(this.localPlugins);
  }

  async getPackageJson(name: string) {
    const { packageName } = await PluginManager.parseName(name);
    const packageJson = await PluginManager.getPackageJson(packageName);
    return { ...packageJson, name: packageName };
  }

  async updateOrCreatePlugins() {
    const repository = this.pm.repository;
    await this.db.sequelize.transaction((transaction) => {
      return Promise.all(
        this.allPlugins.map((values) =>
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
    const plugins = this.allPlugins.filter((item) => !existPluginNames.includes(item.name));
    await repository.create({ values: plugins });
  }

  async toModelData(pkgOrNames: string[], builtIn = false) {
    return await Promise.all(
      pkgOrNames.map(async (pkgOrName) => {
        const { name } = await PluginManager.parseName(pkgOrName);
        const packageJson = await this.getPackageJson(pkgOrName);
        const data = {
          name,
          packageName: packageJson.name,
          version: packageJson.version,
        };
        if (builtIn) {
          data['enabled'] = true;
          data['builtIn'] = true;
        }

        return data;
      }),
    );
  }

  async load() {
    const allPlugins = await findPackageNames();
    const builtInPlugins = await findBuiltInPlugins();
    this.builtInPlugins = await this.toModelData(builtInPlugins, true);
    this.localPlugins = await this.toModelData(_.difference(allPlugins, builtInPlugins));
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
