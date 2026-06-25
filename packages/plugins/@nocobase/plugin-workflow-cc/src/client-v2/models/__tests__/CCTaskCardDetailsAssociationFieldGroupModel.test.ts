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
