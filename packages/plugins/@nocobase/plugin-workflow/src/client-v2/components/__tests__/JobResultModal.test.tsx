/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobResultModal } from '../JobResultModal';

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      resource: () => ({
        get: vi.fn(),
      }),
    },
  }),
}));

vi.mock('ahooks', () => ({
  useRequest: () => ({
    loading: false,
    data: {
      status: 1,
      updatedAt: '2026-06-17T07:27:07.888Z',
      result: '1234',
      log: null,
    },
  }),
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../../canvas/useWorkflowInstruction', () => ({
  useInstruction: () => ({
    title: 'Output',
  }),
}));

vi.mock('../../canvas/contexts', () => ({
  useFlowContext: () => ({
    viewJob: {
      id: 11,
      node: {
        type: 'output',
        title: '流程输出',
      },
    },
    setViewJob: vi.fn(),
  }),
}));

vi.mock('../jobStatus', () => ({
  JobStatusTag: () => <div>Resolved</div>,
}));

vi.mock('../workflowCanvas', () => ({
  formatTime: () => '2026-06-17 15:27:07',
}));

vi.mock('../../canvas/style', () => ({
  default: () => ({
    styles: {
      nodeTitleClass: 'node-title',
      nodeJobResultClass: 'node-job-result',
    },
  }),
}));

describe('JobResultModal', () => {
  it('matches the v1 Input.JSON display semantics for numeric-looking string results', () => {
    render(<JobResultModal />);

    expect(screen.getByRole('textbox')).toHaveValue('1234');
    expect(screen.getByRole('textbox')).not.toHaveValue('"1234"');
  });
});
