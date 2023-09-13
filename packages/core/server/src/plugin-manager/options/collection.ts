import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'applicationPlugins',
  namespace: 'core.applicationPlugins',
  duplicator: 'required',
  repository: 'PluginManagerRepository',
  fields: [
    { type: 'string', name: 'name', unique: true },
    { type: 'string', name: 'packageName', unique: true },
    { type: 'string', name: 'version' },
    { type: 'boolean', name: 'enabled' },
    { type: 'boolean', name: 'installed' },
    { type: 'boolean', name: 'builtIn' },
    { type: 'json', name: 'options' },
  ],
});
