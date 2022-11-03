import { Plugin } from '@nocobase/server';
import path from 'path';

export class PresetNocoBase extends Plugin {
  async addBuiltInPlugins() {
    const plugins = [
      'error-handler',
      'collection-manager',
      'ui-schema-storage',
      'ui-routes-storage',
      'file-manager',
      'system-settings',
      'verification',
      'users',
      'acl',
      'china-region',
      'workflow',
      'client',
      'export',
      'import',
      'audit-logs',
    ];
    await this.app.pm.add(plugins, {
      enabled: true,
      builtIn: true,
      installed: true,
    });
    const samples = ['sample-hello'];
    await this.app.pm.add(samples, {});
    await this.app.reload();
  }

  afterAdd() {
    this.app.on('beforeLoad', async (app, options) => {
      if (options?.method !== 'upgrade') {
        return;
      }
      const version = await this.app.version.get();
      console.log(`The version number before upgrade is ${version}`);
      const result = await this.app.version.satisfies('<0.8.0-alpha.1');
      if (result) {
        const r = await this.db.collectionExistsInDb('applicationPlugins');
        if (r) {
          console.log(`Clear the installed application plugins`);
          await this.db.getRepository('applicationPlugins').destroy({ truncate: true });
          await this.app.reload();
        }
      }
    });
    this.app.on('beforeUpgrade', async () => {
      const result = await this.app.version.satisfies('<0.8.0-alpha.1');
      if (result) {
        console.log(`Initialize all built-in plugins`);
        await this.addBuiltInPlugins();
      }
    });
    this.app.on('beforeInstall', async () => {
      console.log(`Initialize all built-in plugins`);
      await this.addBuiltInPlugins();
    });
  }
  beforeLoad() {
    this.db.addMigrations({
      namespace: this.getName(),
      directory: path.resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });
  }
}

export default PresetNocoBase;
