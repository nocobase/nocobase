import { Migration, PluginManager } from '@nocobase/server';
import { getAutoDeletePluginsWarning, getNotExistsEnabledPluginsError } from '../wording';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.0.0-alpha.2';

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

  async processRemovedPlugins() {
    const repository = this.pm.repository;
    const plugins = await repository.find();
    if (!plugins.length) {
      return;
    }
    const pluginsToBeDeleted = new Map();
    const notExistsEnabledPlugins = new Map();
    for (const plugin of plugins) {
      try {
        await PluginManager.getPackageName(plugin.name);
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
    const proPlugins = Array.from(notExistsEnabledPlugins.keys()).filter((name) => this.proPlugins.includes(name));
    const errMsg = getNotExistsEnabledPluginsError(notExistsEnabledPlugins, proPlugins);
    const error = new Error(errMsg);
    error.stack = undefined;
    error.cause = undefined;
    throw error;
  }

  async up() {
    await this.processRemovedPlugins();
  }
}
