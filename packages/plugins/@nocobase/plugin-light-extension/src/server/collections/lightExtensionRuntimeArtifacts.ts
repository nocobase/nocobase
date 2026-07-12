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
  name: 'lightExtensionRuntimeArtifacts',
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  fields: [
    {
      type: 'string',
      name: 'artifactHash',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'runtimeCodeHash',
      allowNull: false,
    },
    {
      type: 'text',
      name: 'code',
      allowNull: false,
    },
    {
      type: 'text',
      name: 'sourceMap',
    },
    {
      type: 'string',
      name: 'version',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'entryPath',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'runtimeContract',
      allowNull: false,
    },
    {
      type: 'bigInt',
      name: 'byteSize',
      allowNull: false,
    },
  ],
});
