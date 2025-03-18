/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: 'required',
  name: 'uiSchemas',
  migrationRules: ['overwrite', 'schema-only'],
  autoGenId: false,
  timestamps: false,
  repository: 'UiSchemaRepository',
  model: 'UiSchemaModel',
  magicAttribute: 'schema',
  fields: [
    {
      type: 'uid',
      name: 'x-uid',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'hasMany',
      name: 'serverHooks',
      target: 'uiSchemaServerHooks',
      foreignKey: 'uid',
    },
    {
      type: 'json',
      name: 'schema',
      defaultValue: {},
    },
    {
      type: 'belongsToMany',
      name: 'roles',
      onDelete: 'CASCADE',
      through: 'uiButtonSchemasRoles',
      target: 'roles',
      foreignKey: 'uid',
      otherKey: 'roleName',
      sourceKey: 'x-uid',
      targetKey: 'name',
    },
  ],
} as CollectionOptions;
