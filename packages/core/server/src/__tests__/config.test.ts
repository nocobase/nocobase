import * as path from 'path';
import Application from '../application';
import { PluginManager } from '../plugin-manager';
import { readConfig } from '../read-config';
import databaseConfiguration from './config/database';
import userConfiguration from './config/plugins-options/users';

const configurationDir = path.join(__dirname, './config');

describe('config', () => {
  it('should read configuration from directory', async () => {
    const config = await readConfig(configurationDir);
    expect(config['fake']).toBeUndefined();
    expect(config['not-exists']).toBeUndefined();
    expect(config['database']).toEqual(databaseConfiguration);
    expect(config['plugins-options']['users']).toEqual(userConfiguration);
  });

  it('should create application from configuration', async () => {
    const TestA = require('./plugins/test-a').default;
    const TestB = require('./plugins/test-b').default;

    PluginManager.resolvePlugin = (name) => {
      if (name === 'test-a') {
        return TestA;
      }

      if (name === 'test-b') {
        return TestB;
      }
    };

    const config = await readConfig(configurationDir);

    const app = new Application(config);

    await app.load();

    const appPluginA = app.getPlugin('test-a');

    expect(appPluginA).toBeInstanceOf(TestA);

    const appPluginB = app.getPlugin('test-b');

    expect(appPluginB).toBeInstanceOf(TestB);
    expect(appPluginB.options).toBeDefined();
  });
});
