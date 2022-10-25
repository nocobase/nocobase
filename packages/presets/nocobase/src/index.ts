import { Plugin } from '@nocobase/server';

export class PresetNocoBase<O = any> extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  initialize() {
    this.app.on('beforeInstall', async (app, options) => {
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
    });
  }
}

export default PresetNocoBase;
