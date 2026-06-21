/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../../../flowEngine';
import { FlowEngineProvider } from '../../../provider';
import { DndProvider } from '../index';

let latestDndProps: any = null;

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, ...props }: any) => {
    latestDndProps = props;
    return <div data-testid="dnd-context">{children}</div>;
  },
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
  }),
  useDroppable: () => ({
    active: null,
    isOver: false,
    setNodeRef: vi.fn(),
  }),
}));

const renderDndProvider = (
  props: React.ComponentProps<typeof DndProvider> = {},
  setupEngine?: (engine: FlowEngine) => void,
) => {
  const engine = new FlowEngine();
  setupEngine?.(engine);
  return render(
    <FlowEngineProvider engine={engine}>
      <DndProvider {...props}>
        <div>content</div>
      </DndProvider>
    </FlowEngineProvider>,
  );
};

describe('DndProvider', () => {
  afterEach(() => {
    latestDndProps = null;
  });

  it('keeps the drag overlay visible when a custom onDragStart is provided', () => {
    const onDragStart = vi.fn();
    renderDndProvider({ onDragStart });

    act(() => {
      latestDndProps.onDragStart({ active: { id: 'block-1' } });
    });

    expect(onDragStart).toHaveBeenCalledWith({ active: { id: 'block-1' } });
    expect(screen.getByTestId('flow-drag-preview')).toBeInTheDocument();
    expect(screen.getByText('Dragging')).toBeInTheDocument();
  });

  it('clears the drag overlay when custom drag callbacks finish', () => {
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const onDragCancel = vi.fn();
    renderDndProvider({ onDragStart, onDragEnd, onDragCancel });

    act(() => {
      latestDndProps.onDragStart({ active: { id: 'block-1' } });
    });
    expect(screen.getByText('Dragging')).toBeInTheDocument();

    act(() => {
      latestDndProps.onDragEnd({ active: { id: 'block-1' }, over: null });
    });
    expect(onDragEnd).toHaveBeenCalledWith({ active: { id: 'block-1' }, over: null });
    expect(screen.queryByText('Dragging')).not.toBeInTheDocument();

    act(() => {
      latestDndProps.onDragStart({ active: { id: 'block-1' } });
    });
    expect(screen.getByText('Dragging')).toBeInTheDocument();

    act(() => {
      latestDndProps.onDragCancel({ active: { id: 'block-1' } });
    });
    expect(onDragCancel).toHaveBeenCalledWith({ active: { id: 'block-1' } });
    expect(screen.queryByText('Dragging')).not.toBeInTheDocument();
  });
});
