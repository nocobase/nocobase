import * as path from 'path';
import { ApplicationFactory, ConfigurationRepository, loadConfiguration } from '../application-factory';
import databaseConfiguration from './config/database';
import userConfiguration from './config/plugins/users';

describe('config', () => {
  it('should load configuration from directory', async () => {
    const configurationDir = path.join(__dirname, './config');
    const configurationRepository = new ConfigurationRepository();
    await loadConfiguration(configurationDir, configurationRepository);

    expect(configurationRepository.get('not-exists')).toBeUndefined();
    expect(configurationRepository.get('database')).toEqual(databaseConfiguration);
  });

  it('should load configuration to object', async () => {
    const configurationDir = path.join(__dirname, './config');
    const configurationRepository = new ConfigurationRepository();
    await loadConfiguration(configurationDir, configurationRepository);

    const result = configurationRepository.toObject();
    expect(result['database']).toEqual(databaseConfiguration);
    expect(result['plugins']['users']).toEqual(userConfiguration);
  });
});
