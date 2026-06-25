/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, type FlowEngine } from '@nocobase/flow-engine';

import workflowCcTasksCollection from '../../common/collections/workflowCcTasks';

export function registerWorkflowCcCollections(flowEngine: FlowEngine) {
  const dataSource = flowEngine.dataSourceManager?.getDataSource?.('main');
  if (!dataSource || dataSource.getCollection?.(workflowCcTasksCollection.name)) {
    return;
  }

  dataSource.addCollection(new Collection({ ...workflowCcTasksCollection, hidden: true }));
}
