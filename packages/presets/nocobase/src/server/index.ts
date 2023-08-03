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
    'audit-logs',
    'duplicator',
    'iframe-block',
    'formula-field',
    'charts',
    'data-visualization',
    'auth',
    'sms-auth',
  ];

  localPlugins = [
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
    'localization-management',
    'theme-editor',
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

  async addBuiltInPlugins(options?: any) {
    const builtInPlugins = this.getBuiltInPlugins();

    await this.app.pm.add(builtInPlugins, {
      enabled: true,
      builtIn: true,
      installed: true,
    });

    const localPlugins = this.getLocalPlugins();
    await this.app.pm.add(localPlugins, {});
    await this.app.reload({ method: options.method });
  }

  get allPlugins() {
    return this.builtInPlugins
      .map((name) => {
        return { name, enabled: true, builtIn: true } as any;
      })
      .concat(this.localPlugins.map((name) => ({ name })));
  }

  afterAdd() {
    // TODO: 这段代码最好可以直接写到 afterAdd 里
    this.app.on('beforeLoad', async (app, options) => {
      const repository = this.app.db.getRepository('applicationPlugins');
      console.log('options?.method', options?.method);
      if (options?.method === 'install') {
        console.log('installing all plugins');
        await repository.create({ values: this.allPlugins });
        return;
      }
      if (options?.method === 'upgrade') {
        const version = await this.app.version.get();
        console.log(`The version number before upgrade is ${version}`);
        return;
      }
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
