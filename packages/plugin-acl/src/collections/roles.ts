import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'roles',
  autoGenId: false,
  fields: [
    {
      type: 'uid',
      name: 'name',
      prefix: 'r_',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'title',
      unique: true,
    },
    {
      type: 'boolean',
      name: 'default',
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'json',
      name: 'strategy',
    },
    {
      type: 'boolean',
      name: 'default',
      defaultValue: false,
    },
    {
      type: 'boolean',
      name: 'allowConfigure',
    },
    {
      type: 'boolean',
      name: 'allowNewMenu',
    },
    {
      type: 'belongsToMany',
      name: 'menuUiSchemas',
      target: 'uiSchemas',
      targetKey: 'uid',
    },
    {
      type: 'hasMany',
      name: 'resources',
      target: 'rolesResources',
      sourceKey: 'name',
      targetKey: 'name',
    },
  ],
} as CollectionOptions;
