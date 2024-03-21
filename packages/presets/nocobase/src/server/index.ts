import { Plugin, PluginManager } from '@nocobase/server';
import _ from 'lodash';

export class PresetNocoBase extends Plugin {
  builtInPlugins = [
    'data-source-manager',
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
    'workflow-action-trigger',
    'workflow-aggregate',
    'workflow-delay',
    'workflow-dynamic-calculation',
    'workflow-loop',
    'workflow-manual',
    'workflow-parallel',
    'workflow-request',
    'workflow-sql',
    'client',
    'export',
    'import',
    'backup-restore',
    'iframe-block',
    'formula-field',
    'data-visualization',
    'auth',
    'logger',
    'custom-request',
    'calendar',
    'action-bulk-update',
    'action-bulk-edit',
    'gantt',
    'kanban',
    'action-duplicate',
    'action-print',
  ];

  localPlugins = [
    'multi-app-manager>=0.7.0-alpha.1',
    'audit-logs>=0.7.1-alpha.4',
    'map>=0.8.1-alpha.3',
    'saml>=0.8.1-alpha.3',
    'snapshot-field>=0.8.1-alpha.3',
    'graph-collection-manager>=0.9.0-alpha.1',
    'multi-app-share-collection>=0.9.2-alpha.1',
    'oidc>=0.9.2-alpha.1',
    'mobile-client>=0.10.0-alpha.2',
    'api-keys>=0.10.1-alpha.1',
    'localization-management>=0.11.1-alpha.1',
    'theme-editor>=0.11.1-alpha.1',
    'api-doc>=0.13.0-alpha.1',
    'cas>=0.13.0-alpha.5',
    'sms-auth>=0.10.0-alpha.2',
  ];

  splitNames(name: string) {
    return (name || '').split(',').filter(Boolean);
  }

  getBuiltInPlugins() {
    const { APPEND_PRESET_BUILT_IN_PLUGINS } = process.env;
    return _.uniq(this.splitNames(APPEND_PRESET_BUILT_IN_PLUGINS).concat(this.builtInPlugins));
  }

  getLocalPlugins() {
    const { APPEND_PRESET_LOCAL_PLUGINS } = process.env;
    const plugins = this.splitNames(APPEND_PRESET_LOCAL_PLUGINS)
      .concat(this.localPlugins)
      .map((name) => name.split('>='));
    return plugins;
  }

  async getPackageJson(name) {
    let packageName = name;
    try {
      packageName = await PluginManager.getPackageName(name);
    } catch (error) {
      packageName = name;
    }
    const packageJson = await PluginManager.getPackageJson(packageName);
    return packageJson;
  }

  async allPlugins() {
    return (
      await Promise.all(
        this.getBuiltInPlugins().map(async (name) => {
          const packageJson = await this.getPackageJson(name);
          return {
            name,
            packageName: packageJson.name,
            enabled: true,
            builtIn: true,
            version: packageJson.version,
          } as any;
        }),
      )
    ).concat(
      await Promise.all(
        this.getLocalPlugins().map(async (plugin) => {
          const name = plugin[0];
          const packageJson = await this.getPackageJson(name);
          return { name, packageName: packageJson.name, version: packageJson.version };
        }),
      ),
    );
  }

  async getPluginToBeUpgraded() {
    const repository = this.app.db.getRepository<any>('applicationPlugins');
    const items = (await repository.find()).map((item) => item.name);
    const plugins = await Promise.all(
      this.getBuiltInPlugins().map(async (name) => {
        const packageJson = await this.getPackageJson(name);
        return {
          name,
          packageName: packageJson.name,
          enabled: true,
          builtIn: true,
          version: packageJson.version,
        } as any;
      }),
    );
    for (const plugin of this.getLocalPlugins()) {
      if (plugin[1]) {
        // 不在插件列表，并且插件最低版本小于当前应用版本，跳过不处理
        if (!items.includes(plugin[0]) && (await this.app.version.satisfies(`>${plugin[1]}`))) {
          continue;
        }
      }
      const name = plugin[0];
      const packageJson = await this.getPackageJson(name);
      plugins.push({ name, packageName: packageJson.name, version: packageJson.version });
    }
    return plugins;
  }

  async updateOrCreatePlugins() {
    const repository = this.pm.repository;
    const plugins = await this.getPluginToBeUpgraded();
    await this.db.sequelize.transaction((transaction) => {
      return Promise.all(
        plugins.map((values) =>
          repository.updateOrCreate({
            transaction,
            values,
            filterKeys: ['name'],
          }),
        ),
      );
    });
  }

  async createIfNotExists() {
    const repository = this.pm.repository;
    const existPlugins = await repository.find();
    const existPluginNames = existPlugins.map((item) => item.name);
    const plugins = (await this.allPlugins()).filter((item) => !existPluginNames.includes(item.name));
    await repository.create({ values: plugins });
  }

  async install() {
    await this.createIfNotExists();
    this.log.info('start install built-in plugins');
    await this.pm.repository.init();
    await this.pm.load();
    await this.pm.install();
    this.log.info('finish install built-in plugins');
  }

  async upgrade() {
    this.log.info('update built-in plugins');
    await this.updateOrCreatePlugins();
  }
}

export default PresetNocoBase;
