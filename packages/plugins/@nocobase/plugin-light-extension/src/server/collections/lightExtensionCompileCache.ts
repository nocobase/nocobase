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
  name: 'lightExtensionCompileCache',
  dataCategory: 'system',
  autoGenId: false,
  timestamps: true,
  indexes: [{ fields: ['artifactHash'] }, { fields: ['compilerBuildId'] }, { fields: ['compiledAt'] }],
  fields: [
    {
      type: 'string',
      name: 'compileKey',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'artifactHash',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'compilerBuildId',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'runtimeContract',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'filesHash',
      allowNull: false,
    },
    {
      type: 'string',
      name: 'artifactFilesHash',
      allowNull: false,
    },
    {
      type: 'json',
      name: 'inputManifest',
      allowNull: false,
    },
    {
      type: 'json',
      name: 'diagnostics',
      allowNull: false,
      defaultValue: [],
    },
    {
      type: 'date',
      name: 'compiledAt',
      allowNull: false,
    },
  ],
});
