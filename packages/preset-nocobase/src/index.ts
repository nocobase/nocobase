export default function (api) {
  const plugins = [
    '@nocobase/plugin-collections',
    '@nocobase/plugin-ui-router',
    '@nocobase/plugin-ui-schema',
    '@nocobase/plugin-users',
    '@nocobase/plugin-action-logs',
    '@nocobase/plugin-file-manager',
    '@nocobase/plugin-permissions',
    '@nocobase/plugin-export',
    '@nocobase/plugin-system-settings',
    // // '@nocobase/plugin-automations',
    '@nocobase/plugin-china-region',
  ];
  console.log(plugins);
  for (const plugin of plugins) {
    this.registerPlugin(plugin, [require(`${plugin}/${__filename.endsWith('.ts') ? 'src' : 'lib'}/server`).default]);
  }
}
