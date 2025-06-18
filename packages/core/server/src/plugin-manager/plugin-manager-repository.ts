/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Topo from '@hapi/topo';
import { logger } from '@nocobase/logger';
import { Repository } from '@nocobase/database';
import { default as _, default as lodash } from 'lodash';
import { PluginManager } from './plugin-manager';

export class PluginManagerRepository extends Repository {
  /**
   * @internal
   */
  pm: PluginManager;

  /**
   * @internal
   */
  setPluginManager(pm: PluginManager) {
    this.pm = pm;
  }

  async createByName(nameOrPkgs) {}

  async has(nameOrPkg: string) {
    const { name } = await PluginManager.parseName(nameOrPkg);
    const instance = await this.findOne({
      filter: {
        name,
      },
    });
    return !!instance;
  }

  /**
   * @deprecated
   */
  async remove(name: string | string[]) {
    await this.destroy({
      filter: {
        name,
      },
    });
  }

  /**
   * @deprecated
   */
  async enable(name: string | string[]) {
    const pluginNames = lodash.castArray(name);
    const plugins = pluginNames.map((name) => this.pm.get(name));

    for (const plugin of plugins) {
      const requiredPlugins = plugin.requiredPlugins();
      for (const requiredPluginName of requiredPlugins) {
        const requiredPlugin = this.pm.get(requiredPluginName);
        if (!requiredPlugin.enabled) {
          throw new Error(`${plugin.name} plugin need ${requiredPluginName} plugin enabled`);
        }
      }
    }

    for (const plugin of plugins) {
      await plugin.beforeEnable();
    }

    await this.update({
      filter: {
        name,
      },
      values: {
        enabled: true,
        installed: true,
      },
    });
    return pluginNames;
  }

  async updateVersions() {
    const items = await this.find({
      filter: {
        enabled: true,
      },
    });
    for (const item of items) {
      try {
        const json = await PluginManager.getPackageJson(item.packageName);
        item.set('version', json.version);
        await item.save();
      } catch (error) {
        this.pm.app.log.error(error);
      }
    }
  }

  /**
   * @deprecated
   */
  async disable(name: string | string[]) {
    name = lodash.cloneDeep(name);

    const pluginNames = lodash.castArray(name);
    logger.debug(`disable ${name}, ${pluginNames}`);
    const filter = {
      name,
    };

    logger.trace(JSON.stringify(filter, null, 2));
    await this.update({
      filter,
      values: {
        enabled: false,
        installed: false,
      },
    });
    return pluginNames;
  }

  async sort(names: string[]) {
    const pluginNames = _.castArray(names);
    if (pluginNames.length === 1) {
      return pluginNames;
    }
    const sorter = new Topo.Sorter<string>();
    for (const pluginName of pluginNames) {
      let packageJson: any = {};
      try {
        packageJson = await PluginManager.getPackageJson(pluginName);
      } catch (error) {
        packageJson = {};
      }
      const peerDependencies = Object.keys(packageJson?.peerDependencies || {});
      sorter.add(pluginName, { after: peerDependencies, group: packageJson?.packageName || pluginName });
    }
    return sorter.nodes;
  }

  async getItems() {
    const exists = await this.collection.existsInDb();
    if (!exists) {
      return [];
    }
    const items = await this.find({
      sort: 'id',
      filter: {
        enabled: true,
      },
    });
    const sortedItems = [];
    const map = {};
    for (const item of items) {
      if (item.packageName) {
        map[item.packageName] = item;
      } else {
        sortedItems.push(item);
      }
    }
    const names = await this.sort(Object.keys(map));
    for (const name of names) {
      sortedItems.push(map[name]);
    }
    return sortedItems;
  }

  async init() {
    const items = await this.getItems();
    for (const item of items) {
      const { options, ...others } = item.toJSON();
      await this.pm.add(item.get('name'), {
        ...others,
        ...options,
      });
    }
  }
}
