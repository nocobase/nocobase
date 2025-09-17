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
  dumpRules: {
    group: 'required',
  },
  migrationRules: ['overwrite', 'schema-only'],
  shared: true,
  name: 'collectionCategories',
  sortable: true,
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
      primaryKey: true,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'name',
      translation: true,
    },
    {
      type: 'string',
      name: 'color',
      defaultValue: 'default',
    },
    {
      type: 'belongsToMany',
      name: 'collections',
      target: 'collections',
      foreignKey: 'categoryId',
      otherKey: 'collectionName',
      targetKey: 'name',
      through: 'collectionCategory',
    },
  ],
} as CollectionOptions;
