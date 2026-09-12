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
  stringMetaTree: [
    { name: '$context', title: 'String variables', type: 'object', paths: ['$context'], children: [] },
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

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
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
  useNotificationEmailTranslation: () => ({ t: (key: string) => key }),
}));

import { MessageConfigForm } from '../forms/MessageConfigForm';

const META_TREE: MetaTreeNode[] = [
  { name: '$context', title: 'Trigger variables', type: 'object', paths: ['$context'], children: [] },
];

describe('email MessageConfigForm (v2)', () => {
  beforeEach(() => {
    holder.inputs.length = 0;
    holder.textAreas.length = 0;
    holder.useWorkflowVariableOptions.mockReset().mockReturnValue(holder.stringMetaTree);
  });

  it('computes string variables once and reuses each variable tree across its matching fields', () => {
    render(
      <Form initialValues={{ config: { to: [''], cc: [''], bcc: [''] } }}>
        <MessageConfigForm namePrefix={['config']} variableOptions={META_TREE} />
      </Form>,
    );

    expect(holder.inputs.length).toBeGreaterThanOrEqual(4);
    expect(holder.textAreas.length).toBeGreaterThanOrEqual(2);
    for (const props of holder.inputs) {
      expect([META_TREE, holder.stringMetaTree]).toContain(props.metaTree);
    }
    expect(holder.inputs.some((props) => props.metaTree === holder.stringMetaTree)).toBe(true);
    for (const props of holder.textAreas) {
      expect(props.metaTree).toBe(META_TREE);
    }
    expect(holder.useWorkflowVariableOptions).toHaveBeenCalledTimes(1);
    expect(holder.useWorkflowVariableOptions).toHaveBeenCalledWith({ types: ['string'] });
  });
});
