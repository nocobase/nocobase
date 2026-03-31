/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/database';

export default function () {
  return {
    dumpRules: 'required',
    migrationRules: ['overwrite', 'schema-only'],
    name: 'workflowTasks',
    shared: true,
    repository: 'WorkflowTasksRepository',
    fields: [
      {
        name: 'user',
        type: 'belongsTo',
      },
      {
        name: 'workflow',
        type: 'belongsTo',
      },
      {
        type: 'string',
        name: 'type',
      },
      {
        type: 'string',
        name: 'key',
      },
    ],
    indexes: [
      {
        unique: true,
        fields: ['type', 'key'],
      },
    ],
  } as CollectionOptions;
}
