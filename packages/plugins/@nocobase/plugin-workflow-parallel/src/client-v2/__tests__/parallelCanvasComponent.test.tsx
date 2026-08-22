/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ParallelCanvasComponent } from '../nodes/components/parallel';

type MockNode = {
  id: number;
  upstreamId?: number | null;
  branchIndex?: number | null;
};

let mockNodes: MockNode[] = [];
let mockWorkflow = { versionStats: { executed: 0 } };

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  Branch: ({
    entry,
    branchIndex,
    controller,
  }: {
    entry?: { id?: number };
    branchIndex?: number | null;
    controller?: React.ReactNode;
  }) => (
    <div data-testid="branch" data-entry-id={entry?.id ?? ''} data-branch-index={String(branchIndex ?? '')}>
      {controller}
    </div>
  ),
  NodeDefaultView: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="node-default-view">{children}</div>
  ),
  RadioWithTooltip: () => null,
  useFlowContext: () => ({ nodes: mockNodes, workflow: mockWorkflow }),
  useStyles: () => ({
    styles: {
      nodeSubtreeClass: 'node-subtree',
      branchBlockClass: 'branch-block',
    },
  }),
}));

describe('ParallelCanvasComponent', () => {
  it('renders branches in branchIndex order and keeps at least two branch columns', () => {
    mockWorkflow = { versionStats: { executed: 0 } };
    mockNodes = [
      { id: 12, upstreamId: 1, branchIndex: 2 },
      { id: 11, upstreamId: 1, branchIndex: 1 },
    ];

    render(<ParallelCanvasComponent data={{ id: 1, type: 'parallel', title: 'Parallel branch' }} />);

    const branches = screen.getAllByTestId('branch');
    expect(branches).toHaveLength(2);
    expect(branches[0]).toHaveAttribute('data-entry-id', '11');
    expect(branches[0]).toHaveAttribute('data-branch-index', '1');
    expect(branches[1]).toHaveAttribute('data-entry-id', '12');
    expect(branches[1]).toHaveAttribute('data-branch-index', '2');
  });

  it('adds temporary branch placeholders from the add-branch button', () => {
    mockWorkflow = { versionStats: { executed: 0 } };
    mockNodes = [{ id: 11, upstreamId: 1, branchIndex: 1 }];

    render(<ParallelCanvasComponent data={{ id: 1, type: 'parallel', title: 'Parallel branch' }} />);

    expect(screen.getAllByTestId('branch')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'add-button-parallel-Parallel branch-add-branch' }));

    expect(screen.getAllByTestId('branch')).toHaveLength(3);
  });

  it('disables branch editing once the workflow has executions', () => {
    mockWorkflow = { versionStats: { executed: 1 } };
    mockNodes = [{ id: 11, upstreamId: 1, branchIndex: 1 }];

    render(<ParallelCanvasComponent data={{ id: 1, type: 'parallel', title: 'Parallel branch' }} />);

    expect(
      screen.getByLabelText('add-button-parallel-Parallel branch-add-branch', { selector: 'button' }),
    ).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'remove-button-parallel-Parallel branch-2', hidden: true })).toBeNull();
  });
});
