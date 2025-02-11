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
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  name: 'dataSourcesRolesResourcesActions',
  model: 'DataSourcesRolesResourcesActionModel',
  fields: [
    {
      type: 'belongsTo',
      name: 'resource',
      foreignKey: 'rolesResourceId',
      target: 'dataSourcesRolesResources',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'array',
      name: 'fields',
      defaultValue: [],
    },
    {
      type: 'belongsTo',
      name: 'scope',
      target: 'dataSourcesRolesResourcesScopes',
      onDelete: 'RESTRICT',
      foreignKey: 'scopeId',
    },
  ],
});
