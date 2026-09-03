/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Branch } from '../Branch';
import { BranchRenderContext } from '../BranchRenderContext';

vi.mock('../Node', () => ({
  Node: ({ data }: any) => <div data-testid={`node-${data.id}`}>{data.title}</div>,
}));

vi.mock('../AddNodeSlot', () => ({
  AddNodeSlot: ({ branchIndex }: any) => <div data-testid={`add-slot-${branchIndex ?? 'root'}`} />,
}));

vi.mock('../style', () => ({
  default: () => ({
    styles: {
      branchClass: 'branch-class',
    },
    cx: (...args: any[]) => args.filter(Boolean).join(' '),
  }),
}));

describe('Branch', () => {
  it('renders the branch controller before the node list', () => {
    render(
      <Branch
        branchIndex={1}
        controller={<div data-testid="branch-controller">controller</div>}
        entry={{ id: 1, title: 'Node 1', downstream: null }}
      />,
    );

    expect(screen.getByTestId('branch-controller')).toBeInTheDocument();
    expect(screen.getByTestId('node-1')).toBeInTheDocument();
  });

  it('supports runtime-injected node renderer and add-button aria label', () => {
    render(
      <Branch
        branchIndex={0}
        addButtonAriaLabel="legacy-add-button"
        NodeComponent={({ data }: any) => <div data-testid={`legacy-node-${data.id}`}>{data.title}</div>}
        entry={{ id: 2, title: 'Legacy Node', downstream: null }}
      />,
    );

    expect(screen.getByTestId('legacy-node-2')).toBeInTheDocument();
    expect(screen.getByTestId('add-slot-0')).toBeInTheDocument();
  });

  it('falls back to the runtime-provided branch node renderer when NodeComponent is omitted', () => {
    render(
      <BranchRenderContext.Provider
        value={({ data }: any) => <div data-testid={`injected-node-${data.id}`}>{data.title}</div>}
      >
        <Branch branchIndex={0} entry={{ id: 3, title: 'Injected Node', downstream: null }} />
      </BranchRenderContext.Provider>,
    );

    expect(screen.getByTestId('injected-node-3')).toBeInTheDocument();
  });
});
