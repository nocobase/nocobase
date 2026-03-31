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
  name: 'blockTemplates',
  autoGenId: false,
  migrationRules: ['overwrite', 'schema-only'],
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'string',
      name: 'type',
      defaultValue: 'Desktop',
    },
    {
      type: 'belongsTo',
      name: 'uiSchema',
      target: 'uiSchemas',
      foreignKey: 'uid',
    },
    {
      type: 'boolean',
      name: 'configured',
      defaultValue: false,
    },
    {
      type: 'string',
      name: 'collection',
    },
    {
      type: 'string',
      name: 'dataSource',
    },
    {
      type: 'string',
      name: 'componentType',
    },
    {
      type: 'string',
      name: 'menuName',
    },
    {
      type: 'hasMany',
      name: 'links',
      target: 'blockTemplateLinks',
      foreignKey: 'templateKey',
      targetKey: 'key',
    },
  ],
});
