/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'dataSources',
  model: 'DataSourceModel',
  autoGenId: false,
  shared: true,
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  fields: [
    {
      type: 'string',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'displayName',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'boolean',
      name: 'enabled',
      defaultValue: true,
    },
    {
      type: 'boolean',
      name: 'fixed',
      defaultValue: false,
    },
    {
      type: 'hasMany',
      name: 'collections',
      target: 'dataSourcesCollections',
      foreignKey: 'dataSourceKey',
      targetKey: 'name',
    },
    {
      type: 'hasMany',
      name: 'rolesResourcesScopes',
      target: 'dataSourcesRolesResourcesScopes',
      foreignKey: 'dataSourceKey',
    },
  ],
});
