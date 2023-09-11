import { Plugin, PluginManager } from '@nocobase/server';
import _ from 'lodash';
import path from 'path';

export class PresetNocoBase extends Plugin {
  builtInPlugins = [
    '@nocobase/plugin-error-handler',
    '@nocobase/plugin-collection-manager',
    '@nocobase/plugin-ui-schema-storage',
    '@nocobase/plugin-ui-routes-storage',
    '@nocobase/plugin-file-manager',
    '@nocobase/plugin-system-settings',
    '@nocobase/plugin-sequence-field',
    '@nocobase/plugin-verification',
    '@nocobase/plugin-users',
    '@nocobase/plugin-acl',
    '@nocobase/plugin-china-region',
    '@nocobase/plugin-workflow',
    '@nocobase/plugin-client',
    '@nocobase/plugin-export',
    '@nocobase/plugin-import',
    '@nocobase/plugin-duplicator',
    '@nocobase/plugin-iframe-block',
    '@nocobase/plugin-formula-field',
    '@nocobase/plugin-charts',
    '@nocobase/plugin-data-visualization',
    '@nocobase/plugin-auth',
    '@nocobase/plugin-sms-auth',
  ];

  localPlugins = [
    '@nocobase/plugin-audit-logs',
    '@nocobase/plugin-sample-hello',
    '@nocobase/plugin-multi-app-manager',
    '@nocobase/plugin-multi-app-share-collection',
    '@nocobase/plugin-oidc',
    '@nocobase/plugin-saml',
    '@nocobase/plugin-cas',
    '@nocobase/plugin-map',
    '@nocobase/plugin-snapshot-field',
    '@nocobase/plugin-graph-collection-manager',
    '@nocobase/plugin-mobile-client',
    '@nocobase/plugin-api-keys',
    '@nocobase/plugin-localization-management',
    '@nocobase/plugin-theme-editor',
    '@nocobase/plugin-api-doc',
  ];

  splitNames(name: string) {
    return (name || '').split(',').filter(Boolean);
  }

  getBuiltInPlugins() {
    const { PRESET_NOCOBASE_PLUGINS, APPEND_PRESET_BUILT_IN_PLUGINS } = process.env;
    return _.uniq(
      this.splitNames(APPEND_PRESET_BUILT_IN_PLUGINS || PRESET_NOCOBASE_PLUGINS).concat(this.builtInPlugins),
    );
  }

  getLocalPlugins() {
    const { APPEND_PRESET_LOCAL_PLUGINS } = process.env;
    return _.uniq(this.splitNames(APPEND_PRESET_LOCAL_PLUGINS).concat(this.localPlugins));
  }

  beforeLoad() {
    this.db.addMigrations({
      namespace: this.getName(),
      directory: path.resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });
    this.app.on('beforeUpgrade', async () => {
      await this.createIfNotExist();
    });
  }

  get allPlugins() {
    return this.builtInPlugins
      .map((name) => {
        const packageName = PluginManager.getPackageName(name);
        const packageJson = PluginManager.getPackageJson(packageName);
        return { name, enabled: true, builtIn: true, version: packageJson.version } as any;
      })
      .concat(
        this.localPlugins.map((name) => {
          const packageName = PluginManager.getPackageName(name);
          const packageJson = PluginManager.getPackageJson(packageName);
          return { name, version: packageJson.version };
        }),
      );
  }

  async createIfNotExist() {
    const repository = this.app.db.getRepository<any>('applicationPlugins');
    const existPlugins = await repository.find();
    const existPluginNames = existPlugins.map((item) => item.name);
    const plugins = this.allPlugins.filter((item) => !existPluginNames.includes(item.name));
    await repository.create({ values: plugins });
  }

  async install() {
    const repository = this.app.db.getRepository<any>('applicationPlugins');
    const existPlugins = await repository.find();
    const existPluginNames = existPlugins.map((item) => item.name);
    const plugins = this.allPlugins.filter((item) => !existPluginNames.includes(item.name));
    await repository.create({ values: plugins });
    this.log.debug('install preset plugins');
    await repository.init();
    await this.app.pm.load();
    await this.app.pm.install();
  }
}

export default PresetNocoBase;
