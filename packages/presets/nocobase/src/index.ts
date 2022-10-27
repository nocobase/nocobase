import { Plugin } from '@nocobase/server';

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
      'audit-logs',
    ];
    await this.app.pm.add(plugins, {
      enabled: true,
      builtIn: true,
      installed: true,
    });
    await this.app.reload();
  }

  afterAdd() {
    this.app.on('beforeUpgrade', async () => {
      const result = await this.app.version.satisfies('<0.8.0-alpha.1');
      if (result) {
        await this.addBuiltInPlugins();
      }
    });
    this.app.on('beforeInstall', async () => {
      await this.addBuiltInPlugins();
    });
  }
  beforeLoad() {}
}

export default PresetNocoBase;
