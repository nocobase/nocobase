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
  name: 'applicationPlugins',
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  repository: 'PluginManagerRepository',
  origin: '@nocobase/server',
  fields: [
    { type: 'string', name: 'name', unique: true },
    { type: 'string', name: 'packageName', unique: true },
    { type: 'string', name: 'version' },
    { type: 'boolean', name: 'enabled' },
    { type: 'boolean', name: 'installed' },
    { type: 'boolean', name: 'builtIn' },
    { type: 'json', name: 'options' },
  ],
});
