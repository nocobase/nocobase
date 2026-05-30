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
import type { Task } from '../../../types/public-types';
import { StandardTooltipContent } from '../tooltip';

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
