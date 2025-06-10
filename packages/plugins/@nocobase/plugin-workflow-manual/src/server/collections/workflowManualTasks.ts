/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';
import { NAMESPACE } from '../../common/constants';

export default defineCollection({
  name: 'workflowManualTasks',
  dumpRules: {
    group: 'log',
  },
  migrationRules: ['schema-only'],
  shared: true,
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
    },
    {
      type: 'belongsTo',
      name: 'job',
      target: 'jobs',
      foreignKey: 'jobId',
      primaryKey: false,
    },
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      foreignKey: 'userId',
      primaryKey: false,
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: `{{t("Task title", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input',
      },
    },
    {
      type: 'belongsTo',
      name: 'execution',
      onDelete: 'CASCADE',
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'flow_nodes',
    },
    {
      type: 'belongsTo',
      name: 'workflow',
      target: 'workflows',
      foreignKey: 'workflowId',
      onDelete: 'CASCADE',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: `{{t("Workflow", { ns: "workflow" })}}`,
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            label: 'title',
            value: 'id',
          },
        },
      },
    },
    {
      type: 'integer',
      name: 'status',
    },
    {
      type: 'jsonb',
      name: 'result',
    },
  ],
});
