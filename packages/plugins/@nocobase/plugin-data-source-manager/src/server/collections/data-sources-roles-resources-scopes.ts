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
  name: 'dataSourcesRolesResourcesScopes',
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
      primaryKey: true,
      allowNull: false,
    },
    {
      type: 'uid',
      name: 'key',
    },
    {
      name: 'dataSourceKey',
      type: 'string',
      defaultValue: 'main',
    },
    {
      type: 'belongsTo',
      name: 'dataSources',
      foreignKey: 'dataSourceKey',
      onDelete: 'CASCADE',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'resourceName',
    },
    {
      type: 'json',
      name: 'scope',
    },
  ],
});
