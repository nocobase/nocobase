import { PluginsConfigurations } from '@nocobase/server';
import { resolve } from 'path';

export default [
  '@nocobase/plugin-error-handler',
  '@nocobase/plugin-collection-manager',
  '@nocobase/plugin-ui-schema-storage',
  '@nocobase/plugin-ui-routes-storage',
  '@nocobase/plugin-file-manager',
  '@nocobase/plugin-system-settings',
  ['@nocobase/plugin-users', {}],
  '@nocobase/plugin-acl',
  '@nocobase/plugin-china-region',
  '@nocobase/plugin-workflow',
  [
    '@nocobase/plugin-client',
    {
      dist: resolve(__dirname, '../../../app-client/dist'),
    },
  ],
] as PluginsConfigurations;
