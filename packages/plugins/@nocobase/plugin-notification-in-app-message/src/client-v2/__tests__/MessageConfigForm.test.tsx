/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MetaTreeNode } from '@nocobase/flow-engine';
import { render } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  inputs: [] as Array<{ metaTree?: MetaTreeNode[] }>,
  textAreas: [] as Array<{ metaTree?: MetaTreeNode[] }>,
  userSelects: [] as Array<{ variableOptions?: MetaTreeNode[] }>,
  stringMetaTree: [
    { name: '$context', title: 'String variables', type: 'object', paths: ['$context'], children: [] },
  ] as MetaTreeNode[],
  userMetaTree: [
    { name: '$context', title: 'User variables', type: 'object', paths: ['$context'], children: [] },
  ] as MetaTreeNode[],
  useWorkflowVariableOptions: vi.fn(),
}));

vi.mock('@dnd-kit/core', () => ({
  closestCenter: vi.fn(),
  DndContext: ({ children }: React.PropsWithChildren) => children,
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: React.PropsWithChildren) => children,
  useSortable: () => ({
    attributes: {},
    isDragging: false,
    listeners: {},
    setActivatorNodeRef: vi.fn(),
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
  }),
  verticalListSortingStrategy: {},
}));

vi.mock('@nocobase/plugin-notification-manager/client-v2', () => ({
  UserAddition: () => null,
  UserSelect: (props: { variableOptions?: MetaTreeNode[] }) => {
    holder.userSelects.push(props);
    return <input />;
  },
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  isUserKeyField: vi.fn(),
  useWorkflowVariableOptions: holder.useWorkflowVariableOptions,
  WorkflowVariableInput: (props: { metaTree?: MetaTreeNode[] }) => {
    holder.inputs.push(props);
    return <input />;
  },
  WorkflowVariableTextArea: (props: { metaTree?: MetaTreeNode[] }) => {
    holder.textAreas.push(props);
    return <textarea />;
  },
}));

vi.mock('../locale', () => ({
  useInAppMessageTranslation: () => ({ t: (key: string) => key }),
  useT: () => (key: string) => key,
}));

import { MessageConfigForm } from '../components/MessageConfigForm';

const META_TREE: MetaTreeNode[] = [
  { name: '$context', title: 'Trigger variables', type: 'object', paths: ['$context'], children: [] },
];

describe('in-app-message MessageConfigForm (v2)', () => {
  beforeEach(() => {
    holder.inputs.length = 0;
    holder.textAreas.length = 0;
    holder.userSelects.length = 0;
    holder.useWorkflowVariableOptions
      .mockReset()
      .mockImplementation((options: { types?: unknown[] }) =>
        options.types?.[0] === 'string' ? holder.stringMetaTree : holder.userMetaTree,
      );
  });

  it('computes filtered variables once per type and reuses them across matching fields', () => {
    render(
      <Form initialValues={{ config: { receivers: [''] } }}>
        <MessageConfigForm namePrefix={['config']} variableOptions={META_TREE} />
      </Form>,
    );

    expect(holder.inputs.length).toBeGreaterThanOrEqual(3);
    expect(holder.textAreas.length).toBeGreaterThanOrEqual(1);
    expect(holder.userSelects.length).toBeGreaterThanOrEqual(1);
    for (const props of holder.inputs) {
      expect(props.metaTree).toBe(holder.stringMetaTree);
    }
    for (const props of holder.textAreas) {
      expect(props.metaTree).toBe(META_TREE);
    }
    for (const props of holder.userSelects) {
      expect(props.variableOptions).toBe(holder.userMetaTree);
    }
    expect(holder.useWorkflowVariableOptions).toHaveBeenCalledTimes(2);
  });
});
