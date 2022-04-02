import * as path from 'path';
import { ApplicationFactory, ConfigurationRepository, loadConfiguration } from '../application-factory';
import databaseConfiguration from './config/database';
import userConfiguration from './config/plugins-options/users';

const configurationDir = path.join(__dirname, './config');

describe('config', () => {
  it('should load configuration from directory', async () => {
    const configurationRepository = new ConfigurationRepository();
    await loadConfiguration(configurationDir, configurationRepository);

    expect(configurationRepository.get('not-exists')).toBeUndefined();
    expect(configurationRepository.get('database')).toEqual(databaseConfiguration);
  });

  it('should load configuration to object', async () => {
    const configurationRepository = new ConfigurationRepository();
    await loadConfiguration(configurationDir, configurationRepository);

    const result = configurationRepository.toObject();
    expect(result['database']).toEqual(databaseConfiguration);
    expect(result['plugins-options']['users']).toEqual(userConfiguration);
  });

  it('should create application from configuration', async () => {
    const TestA = require('./plugins/test-a').default;
    const TestB = require('./plugins/test-b').default;

    ApplicationFactory.resolvePlugin = (name) => {
      if (name === 'test-a') {
        return TestA;
      }

      if (name === 'test-b') {
        return TestB;
      }
    };

    const app = await ApplicationFactory.buildWithConfiguration(configurationDir);

    const appPluginA = app.getPlugin('test-a');

    expect(appPluginA).toBeInstanceOf(TestA);

    const appPluginB = app.getPlugin('test-b');

    expect(appPluginB).toBeInstanceOf(TestB);
    expect(appPluginB.options).toBeDefined();
  });
});
