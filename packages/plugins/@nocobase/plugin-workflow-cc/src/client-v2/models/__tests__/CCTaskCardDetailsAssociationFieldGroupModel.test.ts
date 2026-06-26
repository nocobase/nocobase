/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/client-v2', () => ({
  DetailsAssociationFieldGroupModel: class DetailsAssociationFieldGroupModel {
    static define = vi.fn();
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  DisplayItemModel: {
    getDefaultBindingByField: vi.fn((ctx: unknown, field: { name: string }) => ({
      modelName: `${field.name}FieldModel`,
    })),
  },
}));

vi.mock('../../locale', () => ({
  NAMESPACE: '@nocobase/plugin-workflow-cc',
  tExpr: (key: string) => key,
}));

import { CCTaskCardDetailsAssociationFieldGroupModel } from '../CCTaskCardDetailsAssociationFieldGroupModel';

describe('CCTaskCardDetailsAssociationFieldGroupModel', () => {
  it('builds CC task association groups when target collections can be resolved', () => {
    const collection = {
      dataSourceKey: 'main',
      name: 'workflowCcTasks',
      getToOneAssociationFields: () => [
        {
          name: 'node',
          title: 'CC node',
          target: 'flow_nodes',
          targetCollection: {
            getFields: () => [
              { name: 'title', title: 'Title' },
              { name: 'type', title: 'Type' },
              { name: 'workflow', title: 'Workflow', target: 'workflows' },
            ],
          },
        },
        {
          name: 'workflow',
          title: 'Workflow',
          target: 'workflows',
          targetCollection: {
            getFields: () => [
              { name: 'title', title: 'Name' },
              { name: 'description', title: 'Description' },
              { name: 'config', title: 'Config' },
            ],
          },
        },
      ],
    };

    const children = CCTaskCardDetailsAssociationFieldGroupModel.defineChildren({ collection } as never);

    expect(children.map((item) => item?.label)).toEqual(['CC node', 'Workflow']);
    expect(children[0]?.children()).toEqual([
      expect.objectContaining({
        key: 'node-children-collectionField',
        label: 'Display fields',
        children: [
          expect.objectContaining({
            key: 'c-node.title',
            label: 'Title',
            useModel: 'CCTaskCardDetailsItemModel',
          }),
        ],
      }),
    ]);
    expect(children[0]?.children()[0].children[0].createModelOptions.stepParams.fieldSettings.init).toEqual({
      associationPathName: 'node',
      collectionName: 'workflowCcTasks',
      dataSourceKey: 'main',
      fieldPath: 'node.title',
    });
    expect(children[1]?.children()[0].children.map((item) => item.key)).toEqual(['c-workflow.title']);
  });

  it('skips unavailable association targets without logging runtime errors', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const collection = {
      dataSourceKey: 'main',
      name: 'workflowCcTasks',
      getToOneAssociationFields: () => [
        { name: 'job', title: 'Job', target: 'jobs' },
        { name: 'execution', title: 'Execution', target: undefined },
        { name: 'node', title: 'CC node', target: 'flow_nodes' },
        { name: 'workflow', title: 'Workflow', target: 'workflows' },
      ],
    };

    const children = CCTaskCardDetailsAssociationFieldGroupModel.defineChildren({ collection } as never);

    expect(children).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
