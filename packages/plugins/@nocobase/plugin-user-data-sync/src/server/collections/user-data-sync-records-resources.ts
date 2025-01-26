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
  name: 'userDataSyncRecordsResources',
  migrationRules: ['schema-only', 'overwrite'],
  fields: [
    {
      name: 'recordId',
      type: 'bigInt',
      interface: 'id',
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
  ],
});
