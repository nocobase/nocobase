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
  name: 'fieldsHistory',
  autoGenId: false,
  model: 'FieldModel',
  timestamps: false,
  shared: true,
  sortable: {
    name: 'sort',
    scopeKey: 'collectionName',
  },
  indexes: [
    {
      type: 'UNIQUE',
      fields: ['collectionName', 'name'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'uid',
      name: 'name',
      prefix: 'f_',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'string',
      name: 'interface',
      allowNull: true,
    },
    {
      type: 'belongsTo',
      name: 'collection',
      target: 'collectionsHistory',
      foreignKey: 'collectionName',
      targetKey: 'name',
      onDelete: 'CASCADE',
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'fieldsHistory',
      sourceKey: 'key',
      foreignKey: 'parentKey',
    },
    {
      type: 'hasOne',
      name: 'reverseField',
      target: 'fieldsHistory',
      sourceKey: 'key',
      foreignKey: 'reverseKey',
    },
    // {
    //   type: 'belongsTo',
    //   name: 'uiSchema',
    //   target: 'uiSchemas',
    //   foreignKey: 'uiSchemaUid',
    // },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
  ],
});
