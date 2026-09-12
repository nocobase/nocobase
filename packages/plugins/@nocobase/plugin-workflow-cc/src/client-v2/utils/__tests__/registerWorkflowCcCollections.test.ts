/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';

import { registerWorkflowCcCollections } from '../registerWorkflowCcCollections';

function createMainDataSource() {
  const flowEngine = new FlowEngine();
  const dataSource = flowEngine.dataSourceManager.getDataSource('main');
  if (!dataSource) {
    throw new Error('Main data source should be initialized by FlowEngine');
  }
  return {
    dataSource,
    flowEngine,
  };
}

describe('registerWorkflowCcCollections', () => {
  it('registers hidden workflowCcTasks and its association target collections when they are missing', () => {
    const { dataSource, flowEngine } = createMainDataSource();

    registerWorkflowCcCollections(flowEngine);

    expect(dataSource.getCollection('workflowCcTasks')?.hidden).toBe(true);
    expect(dataSource.getCollection('flow_nodes')?.hidden).toBe(true);
    expect(dataSource.getCollection('workflows')?.hidden).toBe(true);
    expect(dataSource.getCollection('workflowCcTasks')?.getField('node')?.targetCollection?.name).toBe('flow_nodes');
    expect(dataSource.getCollection('workflowCcTasks')?.getField('workflow')?.targetCollection?.name).toBe('workflows');
  });

  it('keeps registering other missing collections when one collection already exists', () => {
    const { dataSource, flowEngine } = createMainDataSource();
    dataSource.addCollection({ name: 'workflowCcTasks', fields: [] });

    registerWorkflowCcCollections(flowEngine);

    expect(dataSource.getCollection('workflowCcTasks')?.hidden).toBe(false);
    expect(dataSource.getCollection('flow_nodes')?.hidden).toBe(true);
    expect(dataSource.getCollection('workflows')?.hidden).toBe(true);
  });
});
