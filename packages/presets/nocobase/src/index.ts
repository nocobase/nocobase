import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class PresetNocoBase extends Plugin {
  async addBuiltInPlugins() {
    const nodeModules = resolve(__dirname, '../../node_modules');

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
      nodeModules,
    });

    const samples = [
      'sample-command',
      'sample-custom-block',
      'sample-custom-page',
      'sample-custom-signup-page',
      'sample-hello',
      'sample-ratelimit',
      'sample-shop-actions',
      'sample-shop-events',
      'sample-shop-i18n',
      'sample-shop-modeling',
    ];

    await this.app.pm.add(samples, {
      nodeModules,
    });

    await this.app.reload();
  }

  afterAdd() {
    this.app.on('beforeLoad', async (app, options) => {
      if (options?.method !== 'upgrade') {
        return;
      }
      const result = await this.app.version.satisfies('<0.8.0-alpha.1');
      if (result) {
        const r = await this.db.collectionExistsInDb('applicationPlugins');
        if (r) {
          await this.db.getRepository('applicationPlugins').destroy({ truncate: true });
          await this.app.reload();
        }
      }
    });
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
