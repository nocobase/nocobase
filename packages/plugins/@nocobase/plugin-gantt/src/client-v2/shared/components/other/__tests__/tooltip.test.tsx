/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import type { BarTask } from '../../../types/bar-task';
import type { Task } from '../../../types/public-types';
import { StandardTooltipContent, getTooltipPosition } from '../tooltip';

vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({
    context: {
      t: (key: string, options?: Record<string, unknown>) => {
        const templates: Record<string, string> = {
          'Task date range': '{{name}}: {{start}} ~ {{end}}',
          'Duration: {{value}} day(s)': 'Duration: {{value}} day(s)',
          'Progress: {{value}}%': 'Progress: {{value}}%',
        };
        const template = templates[key] || key;
        return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, name: string) => {
          const value = options?.[name];
          return value === undefined || value === null ? '' : String(value);
        });
      },
    },
  }),
  tExpr: (key: string) => key,
}));

const createBarTask = (overrides: Partial<BarTask> = {}): BarTask =>
  ({
    id: '1',
    name: 'Task 1',
    type: 'task',
    typeInternal: 'task',
    start: new Date('2026-04-25T00:00:00'),
    end: new Date('2026-04-26T00:00:00'),
    progress: 50,
    index: 0,
    x1: 100,
    x2: 180,
    y: 40,
    height: 20,
    progressX: 100,
    progressWidth: 40,
    barCornerRadius: 2,
    handleWidth: 8,
    barChildren: [],
    styles: {
      backgroundColor: '#1677ff',
      backgroundSelectedColor: '#1677ff',
      progressColor: '#1677ff',
      progressSelectedColor: '#1677ff',
    },
    ...overrides,
  }) as BarTask;

describe('StandardTooltipContent', () => {
  test('renders date ranges without HTML-escaped slash entities', () => {
    const task = {
      id: '1',
      name: 'sssaadasfasfd',
      start: new Date('2026-04-25T00:00:00'),
      end: new Date('2026-06-02T00:00:00'),
      progress: 50,
      type: 'task',
    } as Task;

    render(<StandardTooltipContent task={task} fontSize="12px" fontFamily="Arial" />);

    expect(screen.getByLabelText('nb-gantt-tooltip')).toHaveTextContent('sssaadasfasfd: 2026/4/25 ~ 2026/6/2');
  });
});

describe('getTooltipPosition', () => {
  test('prefers placing the tooltip above the task bar without covering it', () => {
    const position = getTooltipPosition({
      task: createBarTask({ y: 100 }),
      arrowIndent: 8,
      rtl: false,
      svgContainerHeight: 300,
      svgContainerWidth: 400,
      headerHeight: 40,
      scrollX: 0,
      scrollY: 0,
      tooltipHeight: 60,
      tooltipWidth: 120,
    });

    expect(position).toEqual({ left: 80, top: 72 });
  });

  test('falls back to below the task bar when there is no room above', () => {
    const position = getTooltipPosition({
      task: createBarTask({ y: 4 }),
      arrowIndent: 8,
      rtl: false,
      svgContainerHeight: 300,
      svgContainerWidth: 400,
      headerHeight: 40,
      scrollX: 0,
      scrollY: 0,
      tooltipHeight: 60,
      tooltipWidth: 120,
    });

    expect(position).toEqual({ left: 80, top: 72 });
  });

  test('falls back to the side when neither above nor below fits', () => {
    const position = getTooltipPosition({
      task: createBarTask({ y: 24 }),
      arrowIndent: 8,
      rtl: false,
      svgContainerHeight: 120,
      svgContainerWidth: 400,
      headerHeight: 40,
      scrollX: 0,
      scrollY: 0,
      tooltipHeight: 80,
      tooltipWidth: 120,
    });

    expect(position).toEqual({ left: 188, top: 40 });
  });

  test('keeps a tooltip clamped at the left edge visible', () => {
    const position = getTooltipPosition({
      task: createBarTask({ x1: 10, x2: 50 }),
      arrowIndent: 8,
      rtl: false,
      svgContainerHeight: 300,
      svgContainerWidth: 400,
      headerHeight: 40,
      scrollX: 0,
      scrollY: 0,
      tooltipHeight: 60,
      tooltipWidth: 120,
    });

    expect(position.left).toBe(0);
  });
});
