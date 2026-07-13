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
  name: 'agMaintenanceLeases',
  tableName: 'ag_maintenance_leases',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  timestamps: false,
  fields: [
    {
      type: 'string',
      name: 'key',
      primaryKey: true,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'ownerId',
      allowNull: false,
    },
    {
      type: 'date',
      name: 'expiresAt',
      allowNull: false,
      index: true,
    },
  ],
});
