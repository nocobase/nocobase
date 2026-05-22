/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';
import { SETTINGS } from '../utils';

export default defineCollection({
  name: `${SETTINGS}`,
  tags: 'business',
  dumpRules: 'required',
  migrationRules: ['overwrite', 'skip'],
  fields: [
    {
      type: 'boolean',
      name: 'scheduled',
    },
    {
      type: 'string',
      name: 'cron',
    },
    {
      type: 'integer',
      name: 'keep',
    },
    {
      type: 'boolean',
      name: 'enableFilesBackup',
    },
    {
      type: 'belongsTo',
      name: 'storage',
      target: 'storages',
      targetKey: 'id',
      foreignKey: 'storageId',
    },
    {
      type: 'string',
      name: 'encryptionPassword',
    },
  ],
});
