/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import type { BarTask } from '../../../types/bar-task';
import { TaskItem } from '../task-item';

const createTask = (name: string, overrides: Partial<BarTask> = {}): BarTask =>
  ({
    id: name,
    name,
    type: 'task',
    typeInternal: 'task',
    start: new Date('2026-05-25T00:00:00'),
    end: new Date('2026-05-26T00:00:00'),
    progress: 0,
    index: 0,
    x1: 10,
    x2: 90,
    y: 20,
    height: 20,
    progressX: 10,
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
    ...overrides,
  }) as BarTask;

const renderTaskItem = (
  task: BarTask,
  options: { isDateChangeable?: boolean; onEventStart?: ReturnType<typeof vi.fn> } = {},
) => {
  const engine = new FlowEngine();
  return render(
    <FlowEngineProvider engine={engine}>
      <svg>
        <TaskItem
          task={task}
          arrowIndent={8}
          taskHeight={20}
          isProgressChangeable={false}
          isDateChangeable={options.isDateChangeable ?? false}
          isDelete={false}
          isSelected={false}
          rtl={false}
          onEventStart={options.onEventStart ?? vi.fn()}
        />
      </svg>
    </FlowEngineProvider>,
  );
};

describe('TaskItem', () => {
  beforeEach(() => {
    SVGElement.prototype.getBBox = vi.fn(() => ({ width: 40, height: 12, x: 0, y: 0 }) as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('centers the label when it fits inside the task bar', () => {
    renderTaskItem(createTask('Task 1'));

    expect(screen.getByText('Task 1')).toHaveAttribute('text-anchor', 'middle');
    expect(screen.getByText('Task 1')).toHaveAttribute('y', '30');
  });

  test('places the label outside when it does not fit inside the task bar', async () => {
    SVGElement.prototype.getBBox = vi.fn(() => ({ width: 120, height: 12, x: 0, y: 0 }) as DOMRect);

    renderTaskItem(createTask('Task 2'));

    await waitFor(() => {
      expect(screen.getByText('Task 2')).toHaveAttribute('text-anchor', 'start');
    });
  });

  test('keeps resize handles available for small tasks', () => {
    const onEventStart = vi.fn();
    const { container } = renderTaskItem(
      createTask('Small Task', {
        typeInternal: 'smalltask',
        x1: 0,
        x2: 16,
      }),
      {
        isDateChangeable: true,
        onEventStart,
      },
    );

    const handles = container.querySelectorAll('.barHandle');
    expect(handles).toHaveLength(2);

    fireEvent.mouseDown(handles[0]);
    fireEvent.mouseDown(handles[1]);

    expect(onEventStart).toHaveBeenNthCalledWith(
      1,
      'start',
      expect.objectContaining({ id: 'Small Task' }),
      expect.anything(),
    );
    expect(onEventStart).toHaveBeenNthCalledWith(
      2,
      'end',
      expect.objectContaining({ id: 'Small Task' }),
      expect.anything(),
    );
  });
});
