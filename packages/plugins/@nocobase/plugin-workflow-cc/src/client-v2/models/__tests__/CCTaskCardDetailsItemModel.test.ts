/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  addField: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  DetailsItemModel: class DetailsItemModel {
    static define = vi.fn();

    static getDefaultBindingByField(_ctx: unknown, field: { binding?: boolean; name: string }) {
      if (field.binding === false) {
        return null;
      }
      return {
        modelName: `${field.name}FieldModel`,
        defaultProps: {
          fieldName: field.name,
        },
      };
    }
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  CollectionField: class CollectionField {
    options: Record<string, unknown>;

    constructor(options: Record<string, unknown>) {
      this.options = options;
    }
  },
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  parseCollectionName: (value: string) => {
    const parts = value.split('.');
    return parts.length > 1 ? [parts[0], parts.slice(1).join('.')] : ['main', value];
  },
}));

vi.mock('../../locale', () => ({
  NAMESPACE: '@nocobase/plugin-workflow-cc',
  tExpr: (key: string) => key,
}));

import { CCTaskCardDetailsItemModel, getEligibleTempAssociationSources } from '../CCTaskCardDetailsItemModel';

describe('CCTaskCardDetailsItemModel', () => {
  it('builds the task-card CC information field menu without excluded runtime fields', () => {
    const collection = {
      dataSourceKey: 'main',
      name: 'workflowCcTasks',
      getFields: () => [
        { name: 'title', title: 'Title' },
        { name: 'status', title: 'Status' },
        { name: 'node', title: 'Node' },
        { name: 'workflow', title: 'Workflow' },
        { name: 'ccTempAssoc_node_upstream', title: 'Upstream temporary association' },
        { name: 'unsupported', title: 'Unsupported', binding: false },
      ],
    };
    const ctx = {
      collection,
      model: {
        context: {
          blockModel: {
            collection,
          },
        },
      },
    };

    const children = CCTaskCardDetailsItemModel.defineChildren(ctx as never);

    expect(children.map((item) => item?.key)).toEqual(['title', 'status']);
    expect(children[0]).toEqual(
      expect.objectContaining({
        key: 'title',
        label: 'Title',
        useModel: 'CCTaskCardDetailsItemModel',
      }),
    );
    expect(children[0]?.createModelOptions()).toEqual(
      expect.objectContaining({
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'workflowCcTasks',
              fieldPath: 'title',
            },
          },
        },
        subModels: {
          field: {
            props: {
              fieldName: 'title',
            },
            use: 'titleFieldModel',
          },
        },
      }),
    );
  });

  it('adds task-card temporary association fields only for eligible upstream sources', () => {
    const existingCollection = {
      getField: (name: string) => (name === 'ccTempAssoc_node_existing' ? { name } : null),
    };

    const fields = getEligibleTempAssociationSources(
      [
        {
          collection: 'main.orders',
          nodeId: 1,
          nodeKey: 'existing',
          nodeType: 'node',
        },
        {
          collection: 'main.orders',
          nodeId: 2,
          nodeKey: 'upstream-a',
          nodeType: 'node',
        },
        {
          collection: 'main.orders',
          nodeId: 2,
          nodeKey: 'upstream-a',
          nodeType: 'node',
        },
        {
          collection: '',
          nodeId: 3,
          nodeKey: 'broken',
          nodeType: 'node',
        },
      ],
      existingCollection as never,
    );

    expect(fields).toEqual([
      expect.objectContaining({
        dataSourceKey: 'main',
        fieldName: 'ccTempAssoc_node_upstream_a',
        nodeId: 2,
        nodeKey: 'upstream-a',
        nodeType: 'node',
        target: 'orders',
      }),
    ]);
    expect(holder.addField).not.toHaveBeenCalled();
  });
});
