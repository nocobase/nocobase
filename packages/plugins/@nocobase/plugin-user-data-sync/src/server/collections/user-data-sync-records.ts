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
  dumpRules: {
    group: 'third-party',
  },
  shared: true,
  name: 'userDataSyncRecords',
  createdAt: true,
  updatedAt: true,
  logging: true,
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      interface: 'id',
    },
    {
      name: 'sourceName',
      interface: 'Input',
      type: 'string',
      allowNull: false,
    },
    {
      name: 'sourceUk',
      interface: 'Input',
      type: 'string',
      allowNull: false,
    },
    {
      name: 'resource',
      interface: 'Select',
      type: 'string',
      allowNull: false,
    },
    {
      name: 'resourcePk',
      interface: 'Input',
      type: 'string',
      allowNull: true,
    },
    {
      type: 'text',
      name: 'metaData',
    },
    {
      type: 'text',
      name: 'lastMetaData',
    },
  ],
});
