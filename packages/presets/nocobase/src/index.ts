import { Plugin } from '@nocobase/server';

export class PresetNocoBase<O = any> extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad(): void {
    this.app.loadPluginConfig([
      '@nocobase/plugin-error-handler',
      '@nocobase/plugin-collection-manager',
      '@nocobase/plugin-ui-schema-storage',
      '@nocobase/plugin-ui-routes-storage',
      '@nocobase/plugin-file-manager',
      '@nocobase/plugin-system-settings',
      '@nocobase/plugin-verification',
      '@nocobase/plugin-user-groups',
      '@nocobase/plugin-users',
      '@nocobase/plugin-acl',
      '@nocobase/plugin-china-region',
      '@nocobase/plugin-workflow',
      '@nocobase/plugin-client',
      '@nocobase/plugin-export',
      '@nocobase/plugin-audit-logs',
    ]);
  }
}

export default PresetNocoBase;
