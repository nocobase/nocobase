import * as fs from 'fs';
import * as path from 'path';
import lodash from 'lodash';
import Application from './application';

type PluginConfiguration = string | [string, any];
type PluginsConfigurations = Array<PluginConfiguration>;

export class ApplicationFactory {
  static async buildWithConfiguration(configurationDir: string): Promise<Application> {
    const configurationRepository = new ConfigurationRepository();
    await loadConfiguration(configurationDir, configurationRepository);

    const app = new Application(configurationRepository.toObject());

    this.loadPlugins(app, configurationRepository.get('plugins', []));

    return app;
  }

  static loadPlugins(app: Application, pluginsConfigurations: PluginsConfigurations) {
    for (let pluginConfiguration of pluginsConfigurations) {
      if (typeof pluginConfiguration == 'string') {
        pluginConfiguration = [pluginConfiguration, {}];
      }

      const plugin = this.resolvePlugin(pluginConfiguration[0]);
      const pluginOptions = pluginConfiguration[1];

      app.plugin(plugin, pluginOptions);
    }
  }

  static resolvePlugin(pluginName: string) {
    return require(pluginName).default;
  }
}

export class ConfigurationRepository {
  protected items = new Map<string, any>();

  get(key: string, defaultValue = undefined) {
    if (this.items.has(key)) {
      return this.items.get(key);
    }

    return defaultValue;
  }

  set(key: string, value: any) {
    return this.items.set(key, value);
  }

  toObject() {
    const result = {};

    for (const [key, value] of this.items.entries()) {
      lodash.set(result, key, value);
    }

    return result;
  }
}

export async function loadConfiguration(configurationDir: string, repository: ConfigurationRepository) {
  const getConfigurationFiles = async (dir: string, prefix = []) => {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        await getConfigurationFiles(path.join(dir, file.name), [...prefix, file.name]);
      } else {
        const filePath = path.join(dir, file.name);
        const keyName = path.parse(filePath).name;
        const configuration = require(filePath).default;

        repository.set([...prefix, keyName].join('.'), configuration);
      }
    }
  };

  await getConfigurationFiles(configurationDir);
}
