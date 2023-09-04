import { Plugin } from '@nocobase/server';
import _ from 'lodash';
import path from 'path';

export class PresetNocoBase extends Plugin {
  builtInPlugins = [
    'error-handler',
    'collection-manager',
    'ui-schema-storage',
    'ui-routes-storage',
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
    'duplicator',
    'iframe-block',
    'formula-field',
    'charts',
    'data-visualization',
    'auth',
    'sms-auth',
  ];

  localPlugins = [
    'audit-logs',
    'sample-hello',
    'multi-app-manager',
    'multi-app-share-collection',
    'oidc',
    'saml',
    'cas',
    'map',
    'snapshot-field',
    'graph-collection-manager',
    'mobile-client',
    'api-keys',
    'localization-management',
    'theme-editor',
    'api-doc',
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
        return { name, enabled: true, builtIn: true } as any;
      })
      .concat(this.localPlugins.map((name) => ({ name })));
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
