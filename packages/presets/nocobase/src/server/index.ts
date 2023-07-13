import { Plugin } from '@nocobase/server';

export class PresetNocoBase extends Plugin {
  builtInPlugins = [
    'error-handler',
    'collection-manager',
    'ui-schema-storage',
    // 'ui-routes-storage',
    'file-manager',
    'system-settings',
    'sequence-field',
    'verification',
    'users',
    'acl',
    'china-region',
    'workflow',
    'client',
    'export',
    'import',
    'audit-logs',
    'duplicator',
    'iframe-block',
    'formula-field',
    'charts',
    'data-visualization',
    'auth',
    'sms-auth',
  ];

  customPlugins = [
    'sample-hello',
    'multi-app-manager',
    'multi-app-share-collection',
    'oidc',
    'saml',
    'map',
    'snapshot-field',
    'graph-collection-manager',
    'mobile-client',
    'api-keys',
  ];

  async addBuiltInPlugins(options?: any) {
    for await (const plugin of this.builtInPlugins) {
      await this.app.pm.add(plugin, {
        enabled: true,
        builtIn: true,
        installed: true,
      });
    }
    for await (const plugin of this.customPlugins) {
      await this.app.pm.add(plugin, { enabled: false, installed: true, builtIn: false, isOfficial: true });
    }
    // await this.app.reload({ method: options.method });
  }

  async afterAdd() {
    this.app.on('beforeLoad', async (app, options) => {
      if (options?.method !== 'upgrade') {
        return;
      }
      const version = await this.app.version.get();
      console.log(`The version number before upgrade is ${version}`);
    });

    this.app.on('beforeUpgrade', async () => {
      const result = await this.app.version.satisfies('<0.8.0-alpha.1');

      if (result) {
        console.log(`Initialize all built-in plugins beforeUpgrade`);
        await this.addBuiltInPlugins({ method: 'upgrade' });
      }
    });

    this.app.on('beforeInstall', async () => {
      console.log(`Initialize all built-in plugins beforeInstall in ${this.app.name}`);
      await this.addBuiltInPlugins({ method: 'install' });
    });
  }
}

export default PresetNocoBase;
