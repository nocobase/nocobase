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
  origin: '@nocobase/plugin-acl',
  dumpRules: 'required',
  description: 'Role data',
  migrationRules: ['overwrite', 'schema-only'],
  name: 'roles',
  title: '{{t("Roles")}}',
  autoGenId: false,
  model: 'RoleModel',
  filterTargetKey: 'name',
  // targetKey: 'name',
  sortable: true,
  fields: [
    {
      type: 'uid',
      name: 'name',
      prefix: 'r_',
      primaryKey: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Role UID")}}',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'title',
      unique: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Role name")}}',
        'x-component': 'Input',
      },
      translation: true,
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
      name: 'hidden',
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
      targetKey: 'x-uid',
    },
    {
      type: 'hasMany',
      name: 'resources',
      target: 'dataSourcesRolesResources',
      sourceKey: 'name',
      foreignKey: 'roleName',
    },
    {
      type: 'set',
      name: 'snippets',
      defaultValue: ['!ui.*', '!pm', '!pm.*'],
    },
    {
      type: 'belongsToMany',
      name: 'users',
      target: 'users',
      foreignKey: 'roleName',
      otherKey: 'userId',
      onDelete: 'CASCADE',
      sourceKey: 'name',
      targetKey: 'id',
      through: 'rolesUsers',
    },
  ],
});
