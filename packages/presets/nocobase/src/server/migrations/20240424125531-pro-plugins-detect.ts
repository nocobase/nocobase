import { Migration, OFFICIAL_PLUGIN_PREFIX, PluginManager } from '@nocobase/server';
import { getAutoDeletePluginsWarning, getNotExistsEnabledPluginsError } from '../wording';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.0.0-alpha.1';

  names = ['oidc', 'auth-oidc', 'cas', 'auth-cas', 'saml', 'auth-saml'];

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
          $in: this.names,
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
    for (const plugin of enabledPlugins) {
      if (plugin.name.startsWith('auth-')) {
        continue;
      }
      await repository.update({
        filter: {
          name: plugin.name,
        },
        values: {
          name: `auth-${plugin.name}`,
          packageName: `@nocobase/plugin-auth-${plugin.name}`,
        },
      });
    }

    const notExistsEnabledPlugins = new Map();
    for (const plugin of enabledPlugins) {
      const pluginName = plugin.name.startsWith('auth-') ? plugin.name : `auth-${plugin.name}`;
      const packageName = plugin.name.startsWith('auth-')
        ? `${OFFICIAL_PLUGIN_PREFIX}${plugin.name}`
        : `${OFFICIAL_PLUGIN_PREFIX}auth-${plugin.name}`;
      try {
        await PluginManager.getPackageName(pluginName);
      } catch (error) {
        notExistsEnabledPlugins.set(pluginName, packageName);
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
  }

  async up() {
    await this.processRemovedPlugins();
  }
}
