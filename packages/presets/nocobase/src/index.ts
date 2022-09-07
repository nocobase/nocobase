import { Plugin } from '@nocobase/server';

export class PresetNocoBase<O = any> extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  initialize() {
    this.app.on('beforeInstall', async () => {
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
        'hello',
      ];
      for (const plugin of plugins) {
        const instance = await this.app.pm.add(plugin);
        if (instance.model && plugin !== 'hello') {
          instance.model.enabled = true;
          instance.model.builtIn = true;
          await instance.model.save();
        }
      }
    });
  }
}

export default PresetNocoBase;
