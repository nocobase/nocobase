/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  ctx: null as any,
  executionCanvasProps: null as any,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, useFlowContext: () => holder.ctx };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useParams: () => ({ id: '369411612409856' }),
  };
});

vi.mock('../../locale', () => ({
  useWorkflowTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../ExecutionCanvas', () => ({
  __esModule: true,
  default: (props: any) => {
    holder.executionCanvasProps = props;
    return <div data-testid="execution-canvas">execution-canvas</div>;
  },
}));

import ExecutionViewPage from '../ExecutionViewPage';

function renderWithApp(node: React.ReactNode) {
  return render(<App>{node}</App>);
}

describe('ExecutionViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.executionCanvasProps = null;
  });

  it('loads execution canvas data and renders ExecutionCanvas instead of the empty placeholder', async () => {
    const executions = {
      get: vi.fn().mockResolvedValue({
        data: {
          data: {
            id: 369411612409856,
            key: 'exec-key',
            jobs: [],
            workflow: {
              id: 11,
              key: 'wf-key',
              title: 'WF',
              type: 'schedule',
              nodes: [],
              versionStats: { executed: 1 },
              stats: { executed: 1 },
            },
          },
        },
      }),
    };
    holder.ctx = {
      api: { resource: (name: string) => ({ executions })[name] },
    };

    renderWithApp(<ExecutionViewPage />);

    await screen.findByTestId('execution-canvas');

    await waitFor(() => {
      expect(executions.get).toHaveBeenCalledWith({
        filterByTk: '369411612409856',
        appends: ['jobs', 'workflow', 'workflow.nodes', 'workflow.versionStats', 'workflow.stats'],
        except: ['jobs.result', 'workflow.options'],
      });
    });

    expect(holder.executionCanvasProps?.record?.id).toBe(369411612409856);
    expect(screen.queryByText('Workflow canvas editor is being migrated to the new UI.')).toBeNull();
  });
});
