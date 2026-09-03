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
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  input: vi.fn(() => null),
  selector: vi.fn(({ children }) => children),
  useWorkflowVariableOptions: vi.fn(() => []),
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  FlowContextSelector: holder.selector,
  VariableHybridInput: holder.input,
}));

vi.mock('../useWorkflowVariableOptions', () => ({
  useWorkflowVariableOptions: holder.useWorkflowVariableOptions,
}));

import { WorkflowVariableInput } from '../WorkflowVariableInput';
import { WorkflowVariableTextArea } from '../WorkflowVariableTextArea';

const META_TREE: MetaTreeNode[] = [
  { name: '$context', title: 'Trigger variables', type: 'object', paths: ['$context'], children: [] },
];

describe('workflow variable fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not rebuild workflow variables when WorkflowVariableInput receives a meta tree', () => {
    render(<WorkflowVariableInput metaTree={META_TREE} />);

    expect(holder.useWorkflowVariableOptions).not.toHaveBeenCalled();
    expect(holder.input).toHaveBeenCalledWith(expect.objectContaining({ metaTree: META_TREE }), expect.anything());
  });

  it('does not rebuild workflow variables when WorkflowVariableTextArea receives a meta tree', () => {
    render(<WorkflowVariableTextArea metaTree={META_TREE} />);

    expect(holder.useWorkflowVariableOptions).not.toHaveBeenCalled();
    expect(holder.selector).toHaveBeenCalledWith(
      expect.objectContaining({ metaTree: expect.any(Function) }),
      expect.anything(),
    );
  });
});
