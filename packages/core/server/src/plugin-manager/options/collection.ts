export default {
  name: 'applicationPlugins',
  repository: 'PluginManagerRepository',
  fields: [
    { type: 'string', name: 'name', unique: true },
    { type: 'string', name: 'version' },
    { type: 'boolean', name: 'enabled' },
    { type: 'boolean', name: 'installed' },
    { type: 'boolean', name: 'builtIn' },
    { type: 'json', name: 'options' },
  ],
};
