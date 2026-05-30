/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import type { BarTask } from '../../../types/bar-task';
import type { GanttEvent } from '../../../types/gantt-task-actions';
import { TaskGanttContent } from '../task-gantt-content';

const createTask = (id: string, name: string, x1: number): BarTask =>
  ({
    id,
    name,
    type: 'task',
    typeInternal: 'task',
    start: new Date('2026-05-25T00:00:00'),
    end: new Date('2026-05-26T00:00:00'),
    progress: 0,
    index: Number(id),
    x1,
    x2: x1 + 80,
    y: Number(id) * 40,
    height: 20,
    progressX: x1,
    progressWidth: 0,
    barCornerRadius: 2,
    handleWidth: 8,
    barChildren: [],
    isDisabled: false,
    styles: {
      backgroundColor: '#1677ff',
      backgroundSelectedColor: '#1677ff',
      progressColor: '#1677ff',
      progressSelectedColor: '#1677ff',
    },
  }) as BarTask;

const tasks = [createTask('1', 'Task 1', 0), createTask('2', 'Task 2', 120)];

const renderHarness = (node: React.ReactElement) => {
  const engine = new FlowEngine();
  return render(<FlowEngineProvider engine={engine}>{node}</FlowEngineProvider>);
};

const Harness = ({ onClick = vi.fn() }: { onClick?: (task: BarTask) => void }) => {
  const [ganttEvent, setGanttEvent] = useState<GanttEvent>({ action: '' });

  return (
    <>
      <svg>
        <TaskGanttContent
          tasks={tasks}
          dates={[new Date('2026-05-25T00:00:00'), new Date('2026-05-26T00:00:00')]}
          ganttEvent={ganttEvent}
          selectedTask={undefined}
          rowHeight={40}
          columnWidth={80}
          timeStep={300000}
          svgWidth={240}
          taskHeight={20}
          arrowColor="#999"
          arrowIndent={8}
          fontSize="12px"
          fontFamily="Arial"
          rtl={false}
          setGanttEvent={setGanttEvent}
          setFailedTask={vi.fn()}
          setSelectedTask={vi.fn()}
          onClick={onClick}
        />
      </svg>
      <div data-testid="hovered-task-id">{ganttEvent.changedTask?.id || ''}</div>
      <div data-testid="hover-action">{ganttEvent.action}</div>
    </>
  );
};

describe('TaskGanttContent tooltip hover', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    SVGElement.prototype.getBBox = vi.fn(() => ({ width: 40, height: 12, x: 0, y: 0 }) as DOMRect);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('does not clear the second task tooltip when leaving the first task quickly', () => {
    renderHarness(<Harness />);

    fireEvent.mouseEnter(screen.getByText('Task 1').parentElement as Element);
    expect(screen.getByTestId('hovered-task-id')).toHaveTextContent('1');

    fireEvent.mouseLeave(screen.getByText('Task 1').parentElement as Element);
    fireEvent.mouseEnter(screen.getByText('Task 2').parentElement as Element);
    expect(screen.getByTestId('hovered-task-id')).toHaveTextContent('2');
    expect(screen.getByTestId('hover-action')).toHaveTextContent('mouseenter');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('hovered-task-id')).toHaveTextContent('2');
    expect(screen.getByTestId('hover-action')).toHaveTextContent('mouseenter');
  });

  test('opens the task when clicking the task label text', () => {
    const handleClick = vi.fn();

    renderHarness(<Harness onClick={handleClick} />);

    fireEvent.click(screen.getByText('Task 1'));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({ id: '1', name: 'Task 1' }));
  });
});
