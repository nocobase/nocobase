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
import { AddNodeSlot } from '../AddNodeSlot';
import { AddNodeContext } from '../AddNodeContext.shared';
import { FlowContext } from '../contexts';
import { BranchContext } from '../BranchContext';

vi.mock('../style', () => ({
  default: () => ({
    styles: {
      addButtonClass: 'add-button-class',
      dropZoneClass: 'drop-zone-class',
      pasteButtonClass: 'paste-button-class',
    },
    cx: (...args: any[]) => args.filter(Boolean).join(' '),
  }),
}));

vi.mock('../NodeClipboardContext', () => ({
  useNodeClipboardContext: () => null,
}));

vi.mock('../NodeDragContext', () => ({
  useNodeDragContext: () => ({ dragging: false }),
}));

vi.mock('../contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts')>();
  return {
    ...actual,
    useWorkflowCanvasExecuted: () => 0n,
  };
});

describe('AddNodeSlot', () => {
  it('opens the runtime-provided add-node drawer via the shared AddNodeContext', () => {
    const onMenuOpen = vi.fn();

    render(
      <FlowContext.Provider value={{ workflow: { id: 1 } as any }}>
        <BranchContext.Provider value={{ branchIndex: 0, addable: true }}>
          <AddNodeContext.Provider value={{ creating: null, onMenuOpen }}>
            <AddNodeSlot upstream={{ id: 123 }} branchIndex={0} />
          </AddNodeContext.Provider>
        </BranchContext.Provider>
      </FlowContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'add-button' }));

    expect(onMenuOpen).toHaveBeenCalledWith({
      upstream: { id: 123 },
      branchIndex: 0,
      branchContext: {
        syncOnly: false,
      },
    });
  });
});
