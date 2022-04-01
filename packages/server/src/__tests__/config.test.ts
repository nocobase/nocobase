import * as path from 'path';
import { ApplicationFactory, ConfigurationRepository, loadConfiguration } from '../application-factory';
import databaseConfiguration from './config/database';

describe('config', () => {
  it('should load configuration from directory', async () => {
    const configurationDir = path.join(__dirname, './config');
    const configurationRepository = new ConfigurationRepository();
    await loadConfiguration(configurationDir, configurationRepository);

    expect(configurationRepository.get('not-exists')).toBeUndefined();
    expect(configurationRepository.get('database')).toEqual(databaseConfiguration);
  });
});
