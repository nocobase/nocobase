import { importModule } from '@nocobase/utils';
import * as path from 'path';
import { sleep } from 'testUtils';
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
    expect(config['database']).toEqual(databaseConfiguration);
    expect(config['plugins-options']['users']).toEqual(userConfiguration);
  });

  it('should create application from configuration', async () => {
    const TestA = await importModule(path.join(__dirname, './plugins/test-a'));
    const TestB = await importModule(path.join(__dirname, './plugins/test-b'));

    PluginManager.resolvePlugin = async (name) => {
      if (name === 'test-a') {
        return TestA;
      }

      if (name === 'test-b') {
        return TestB;
      }
    };

    const config = await readConfig(configurationDir);

    const app = new Application(config);

    // 等待插件加载完成
    await sleep();

    const appPluginA = app.getPlugin('test-a');

    expect(appPluginA).toBeInstanceOf(TestA);

    const appPluginB = app.getPlugin('test-b');

    expect(appPluginB).toBeInstanceOf(TestB);
    expect(appPluginB.options).toBeDefined();
  });
});
