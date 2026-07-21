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
import ProblemsPanel from '../components/DiagnosticsPanel';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

describe('ProblemsPanel', () => {
  it('renders clickable source locations with line and column', () => {
    const onOpenProblem = vi.fn();

    render(
      <ProblemsPanel
        problems={[
          createLightExtensionProblem({
            phase: 'compile',
            source: 'runjs-compiler',
            code: 'RUNJS_IMPORT_NOT_FOUND',
            severity: 'error',
            message: 'Import target was not found',
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            range: { start: { line: 3, column: 12 } },
            snapshotId: 'snapshot-1',
            requestId: 'request-1',
            kind: 'js-block',
            entryName: 'sales-kpi',
          }),
        ]}
        onOpenProblem={onOpenProblem}
      />,
    );

    expect(screen.getByText('Import target was not found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Line 3.*Column 12/ }));

    expect(onOpenProblem).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        range: { start: { line: 3, column: 12 } },
      }),
    );
  });
});
