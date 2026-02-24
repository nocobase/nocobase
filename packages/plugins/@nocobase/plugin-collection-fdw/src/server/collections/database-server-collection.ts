/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'databaseServers',
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  autoGenId: false,
  model: 'DatabaseServerModel',
  fields: [
    {
      type: 'string',
      name: 'name',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'json',
      name: 'options',
    },
  ],
});
