import * as fs from 'fs';
import * as path from 'path';

export class ApplicationFactory {
  static async buildWithConfigDir(configDir: string) {
    const configurationRepository = new ConfigurationRepository();
    await loadConfiguration(configDir, configurationRepository);
  }
}

export class ConfigurationRepository {
  protected items = new Map<string, any>();

  get(key) {
    return this.items.get(key);
  }

  set(key, value) {
    return this.items.set(key, value);
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
