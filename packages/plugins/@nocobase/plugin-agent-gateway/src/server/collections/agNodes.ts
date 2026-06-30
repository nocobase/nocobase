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
  name: 'agNodes',
  tableName: 'ag_nodes',
  dataCategory: 'business',
  migrationRules: ['schema-only'],
  autoGenId: false,
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'nodeKey',
      unique: true,
      allowNull: false,
    },
    {
      type: 'string',
      name: 'displayName',
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'active',
      index: true,
    },
    {
      type: 'string',
      name: 'endpointUrl',
    },
    {
      type: 'string',
      name: 'authMode',
    },
    {
      type: 'string',
      name: 'nodeTokenHash',
      hidden: true,
    },
    {
      type: 'string',
      name: 'tokenLast4',
    },
    {
      type: 'jsonb',
      name: 'capabilitiesJson',
    },
    {
      type: 'jsonb',
      name: 'labelsJson',
    },
    {
      type: 'jsonb',
      name: 'metadataJson',
    },
    {
      type: 'date',
      name: 'registeredAt',
    },
    {
      type: 'date',
      name: 'lastHeartbeatAt',
    },
    {
      type: 'date',
      name: 'disabledAt',
    },
  ],
});
