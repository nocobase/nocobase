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
    group: 'log',
  },
  migrationRules: ['schema-only'],
  name: 'jobs',
  shared: true,
  fields: [
    {
      type: 'belongsTo',
      name: 'execution',
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'flow_nodes',
    },
    {
      type: 'string',
      name: 'nodeKey',
    },
    {
      type: 'belongsTo',
      name: 'upstream',
      target: 'jobs',
    },
    {
      type: 'integer',
      name: 'status',
    },
    {
      type: 'json',
      name: 'result',
    },
  ],
} as CollectionOptions;
