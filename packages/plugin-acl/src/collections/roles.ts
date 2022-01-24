import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'roles',
  autoGenId: false,
  fields: [
    {
      type: 'uid',
      name: 'name',
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
      name: 'allowConfigure',
    },
    {
      type: 'boolean',
      name: 'allowNewMenu',
    },
    {
      type: 'belongsToMany',
      name: 'menuUiSchemas',
      target: 'ui_schemas',
    },
    {
      type: 'hasMany',
      name: 'resources',
      target: 'rolesResources',
      sourceKey: 'name',
    },
  ],
} as CollectionOptions;
