import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'applicationPlugins',
  namespace: 'core.applicationPlugins',
  duplicator: 'required',
  repository: 'PluginManagerRepository',
  fields: [
    { type: 'string', name: 'name', unique: true },
    { type: 'string', name: 'version' },
    { type: 'string', name: 'preVersion' },
    { type: 'string', name: 'registry' },
    { type: 'string', name: 'type' },
    { type: 'string', name: 'clientUrl' },
    { type: 'string', name: 'zipUrl' },
    { type: 'boolean', name: 'enabled' },
    { type: 'boolean', name: 'isOfficial' },
    { type: 'boolean', name: 'installed' },
    { type: 'boolean', name: 'builtIn' },
    { type: 'json', name: 'options' },
  ],
});
