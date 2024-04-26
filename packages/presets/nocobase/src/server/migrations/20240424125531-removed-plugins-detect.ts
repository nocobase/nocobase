import { Migration, PluginManager } from '@nocobase/server';
import { getAutoDeletePluginsWarning, getNotExistsEnabledPluginsError } from '../wording';
import { fsExists } from '@nocobase/utils/plugin-symlink';
import { resolve } from 'path';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.0.0-alpha.1';

  proPlugins = [
    'oidc',
    '@nocobase/plugin-oidc',
    'auth-oidc',
    '@nocobase/plugin-auth-oidc',
    'cas',
    '@nocobase/plugin-cas',
    'auth-cas',
    '@nocobase/plugin-auth-cas',
    'saml',
    '@nocobase/plugin-saml',
    'auth-saml',
    '@nocobase/plugin-auth-saml',
  ];

  async getPackageName(name: string) {
    const prefixes = PluginManager.getPluginPkgPrefix();
    for (const prefix of prefixes) {
      const pkgName = name.startsWith(prefix) ? name : `${prefix}${name}`;
      const pkg = resolve(process.env.NODE_MODULES_PATH, pkgName, 'package.json');
      const exists = await fsExists(pkg);
      if (exists) {
        return pkgName;
      }
    }
    throw new Error(`${name} plugin does not exist`);
  }

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
          $in: this.proPlugins,
        },
      },
    });
    if (!plugins.length) {
      return;
    }
    const pluginsToBeDeleted = new Map();
    const notExistsEnabledPlugins = new Map();
    for (const plugin of plugins) {
      try {
        await this.getPackageName(plugin.name);
      } catch (error) {
        if (!plugin.enabled) {
          pluginsToBeDeleted.set(plugin.name, plugin.packageName);
          continue;
        }
        notExistsEnabledPlugins.set(plugin.name, plugin.packageName);
      }
    }
    if (pluginsToBeDeleted.size) {
      await repository.destroy({
        filter: {
          name: {
            $in: Array.from(pluginsToBeDeleted.keys()),
          },
        },
      });
      this.app.log.warn(getAutoDeletePluginsWarning(pluginsToBeDeleted));
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
  }

  async up() {
    await this.processRemovedPlugins();
  }
}
