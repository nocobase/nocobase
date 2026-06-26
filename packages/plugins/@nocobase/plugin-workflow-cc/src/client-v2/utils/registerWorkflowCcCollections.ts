/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, type CollectionOptions, type FlowEngine } from '@nocobase/flow-engine';

import workflowCcTasksCollection from '../../common/collections/workflowCcTasks';

const flowNodesCollection: CollectionOptions = {
  name: 'flow_nodes',
  dataCategory: 'system',
  shared: true,
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
      primaryKey: true,
      allowNull: false,
    },
    {
      type: 'uid',
      name: 'key',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Title")}}',
        'x-component': 'Input',
      },
    },
    {
      name: 'workflow',
      type: 'belongsTo',
      target: 'workflows',
    },
    {
      name: 'upstream',
      type: 'belongsTo',
      target: 'flow_nodes',
    },
    {
      name: 'downstream',
      type: 'belongsTo',
      target: 'flow_nodes',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'json',
      name: 'config',
      defaultValue: {},
    },
  ],
};

const workflowsCollection: CollectionOptions = {
  name: 'workflows',
  dataCategory: 'system',
  shared: true,
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
      primaryKey: true,
      allowNull: false,
      interface: 'id',
      uiSchema: {
        type: 'number',
        title: '{{t("ID")}}',
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      },
    },
    {
      name: 'key',
      type: 'uid',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Name")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'jsonb',
      name: 'config',
      defaultValue: {},
    },
    {
      type: 'boolean',
      name: 'enabled',
      defaultValue: false,
    },
  ],
};

const workflowCcCollections = [workflowCcTasksCollection, flowNodesCollection, workflowsCollection];

export function registerWorkflowCcCollections(flowEngine: FlowEngine) {
  const dataSource = flowEngine.dataSourceManager?.getDataSource?.('main');
  if (!dataSource) {
    return;
  }

  workflowCcCollections.forEach((collection) => {
    if (dataSource.getCollection?.(collection.name)) {
      return;
    }
    dataSource.addCollection(new Collection({ ...collection, hidden: true }));
  });
}
