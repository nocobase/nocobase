/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionOptions } from '@nocobase/flow-engine';

const workflowsCollection: CollectionOptions = {
  name: 'workflows',
  dataCategory: 'system',
  hidden: true,
  shared: true,
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
      primaryKey: true,
      allowNull: false,
    },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Name")}}',
        'x-component': 'Input',
      },
    },
  ],
};

const workflowManualTasksCollection: CollectionOptions = {
  name: 'workflowManualTasks',
  dataCategory: 'business',
  filterTargetKey: 'id',
  hidden: true,
  shared: true,
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
      primaryKey: true,
      allowNull: false,
    },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Task title", { ns: "workflow-manual" })}}',
        'x-component': 'Input',
      },
    },
    {
      name: 'workflow',
      type: 'belongsTo',
      target: 'workflows',
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: '{{t("Workflow", { ns: "workflow" })}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            label: 'title',
            value: 'id',
          },
        },
      },
    },
  ],
};

export const workflowManualTaskCollections = [workflowsCollection, workflowManualTasksCollection];
