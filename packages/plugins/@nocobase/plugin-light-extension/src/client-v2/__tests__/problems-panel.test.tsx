/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { createLightExtensionProblem } from '../../shared/problems';
import ProblemsPanel from '../components/ProblemsPanel';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

function problem(
  overrides: { requestId?: string; path?: string; range?: { start: { line: number; column: number } } } = {},
) {
  return createLightExtensionProblem({
    phase: 'compile',
    source: 'runjs-compiler',
    code: 'RUNJS_IMPORT_NOT_FOUND',
    severity: 'error',
    message: 'Import target was not found',
    path: 'src/client/js-blocks/sales-kpi/index.tsx',
    range: { start: { line: 3, column: 12 } },
    snapshotId: 'snapshot-1',
    requestId: overrides.requestId || 'request-1',
    kind: 'js-block',
    entryName: 'sales-kpi',
    ...overrides,
  });
}

describe('ProblemsPanel', () => {
  it('renders problem source and phase with a keyboard-accessible location button', () => {
    const onOpenProblem = vi.fn();

    render(<ProblemsPanel problems={[problem()]} onOpenProblem={onOpenProblem} />);

    expect(screen.getByText('compile')).toBeInTheDocument();
    expect(screen.getByText('runjs-compiler')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Open problem source.*Line 3.*Column 12/ });
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.click(button);

    expect(onOpenProblem).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        range: { start: { line: 3, column: 12 } },
      }),
    );
  });

  it('excludes stale problems from current counts and labels them', () => {
    render(<ProblemsPanel problems={[]} staleProblems={[problem()]} />);

    expect(screen.getByText('Errors: 0')).toBeInTheDocument();
    expect(screen.getByText('Stale: 1')).toBeInTheDocument();
    expect(screen.getAllByText('Stale')).toHaveLength(1);
  });

  it('does not make problems without a complete source range interactive', () => {
    render(<ProblemsPanel problems={[problem({ range: undefined })]} onOpenProblem={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Open problem source/ })).not.toBeInTheDocument();
    expect(screen.getByText(/src\/client\/js-blocks\/sales-kpi\/index.tsx/)).toBeInTheDocument();
  });
});
