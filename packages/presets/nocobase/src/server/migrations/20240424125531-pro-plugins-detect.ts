/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration, PluginManager } from '@nocobase/server';
import { getAutoDeletePluginsWarning, getNotExistsEnabledPluginsError } from '../wording';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.0.0-alpha.1';

  oldNames = ['oidc', 'cas', 'saml'];

  async getSystemLang() {
    const repo = this.db.getRepository('systemSettings');
    if (!repo) {
      return 'en-US';
    }
    const systemSettings = await repo.findOne();
    if (!systemSettings) {
      return 'en-US';
    }
    return systemSettings.enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
  }

  async processRemovedPlugins() {
    const repository = this.pm.repository;
    const plugins = await repository.find({
      filter: {
        name: {
          $in: this.oldNames,
        },
      },
    });
    if (!plugins.length) {
      return;
    }
    const pluginsToBeDeleted = plugins.filter((plugin: { enabled: boolean }) => !plugin.enabled);
    if (pluginsToBeDeleted.length) {
      await repository.destroy({
        filter: {
          name: {
            $in: pluginsToBeDeleted.map((plugin: { name: string }) => plugin.name),
          },
        },
      });
      this.app.log.warn(
        getAutoDeletePluginsWarning(
          pluginsToBeDeleted.map((plugin: { name: string; packageName?: string }) => plugin.packageName || plugin.name),
        ),
      );
    }

    const enabledPlugins = plugins.filter((plugin: { enabled: boolean }) => plugin.enabled);
    if (!enabledPlugins.length) {
      return;
    }
    await this.sequelize.transaction(async (t) => {
      for (const plugin of enabledPlugins) {
        await repository.update({
          filter: {
            name: plugin.name,
          },
          values: {
            name: `auth-${plugin.name}`,
            packageName: `@nocobase/plugin-auth-${plugin.name}`,
          },
          transaction: t,
        });
      }

      const notExistsEnabledPlugins = new Map();
      for (const plugin of enabledPlugins) {
        try {
          await PluginManager.getPackageName(`auth-${plugin.name}`);
        } catch (error) {
          notExistsEnabledPlugins.set(plugin.name, plugin.packageName || plugin.name);
        }
      }
      if (!notExistsEnabledPlugins.size) {
        return;
      }
      const lang = await this.getSystemLang();
      const errMsg = getNotExistsEnabledPluginsError(notExistsEnabledPlugins, this.app.name);
      const error = new Error(errMsg[lang]) as any;
      error.stack = undefined;
      error.cause = undefined;
      error.onlyLogCause = true;
      throw error;
    });
  }

  async up() {
    await this.processRemovedPlugins();
  }
}
