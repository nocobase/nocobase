import lodash from 'lodash';
import fs from 'fs';
import path from 'path';

export async function readConfig(dir: string) {
  const repository = new ConfigurationRepository();
  await loadConfiguration(dir, repository);
  return repository.toObject();
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
        if (!['ts', 'js'].includes(file.name.split('.').slice(1).join('.'))) {
          continue;
        }

        const filePath = path.join(dir, file.name);
        const keyName = path.parse(filePath).name;
        const configuration = require(filePath).default;

        repository.set([...prefix, keyName].join('.'), configuration);
      }
    }
  };

  await getConfigurationFiles(configurationDir);
}
