/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App } from 'antd';
import { get } from 'lodash';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EXECUTION_STATUS } from '../../../common/executionStatus';

const holder = vi.hoisted(() => ({ ctx: null as any }));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useFlowContext: () => holder.ctx,
    useFlowEngine: () => ({
      context: {
        dataSourceManager: {
          getDataSource: () => ({
            getCollection: () => undefined,
          }),
        },
      },
    }),
  };
});

vi.mock('../../locale', () => ({
  useT: () => (key: string) => {
    const matched = key.match(/^{{t\("(.+?)"(?:, \{.*\})?\)}}$/);
    return matched?.[1] ?? key;
  },
  useWorkflowTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../hooks/useWorkflowRuntimePaths', () => ({
  useWorkflowRuntimePaths: () => ({
    getWorkflowExecutionPath: (id: string | number) => `/admin/workflow/executions/${id}`,
  }),
}));

vi.mock('@nocobase/client-v2', () => ({
  CollectionFilter: () => null,
  ExtendCollectionsProvider: ({ children }: any) => <>{children}</>,
  Table: ({ dataSource = [], columns = [] }: any) => (
    <table>
      <tbody>
        {dataSource.map((record: any) => (
          <tr key={record.id}>
            {columns.map((col: any, index: number) => (
              <td key={index}>
                {typeof col.render === 'function'
                  ? col.render(col.dataIndex ? get(record, col.dataIndex) : undefined, record)
                  : col.dataIndex
                    ? get(record, col.dataIndex)
                    : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

import { ExecutionHistoryDrawer } from '../ExecutionHistoryDrawer';

function renderWithApp(node: React.ReactNode) {
  return render(<App>{node}</App>);
}

describe('ExecutionHistoryDrawer', () => {
  it('renders the v1-style loading status tag and icon-only cancel action for started executions', async () => {
    const executions = {
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              id: 370295881138176,
              createdAt: '2026-06-16T07:27:15.000Z',
              workflowId: 370295837097984,
              status: EXECUTION_STATUS.STARTED,
            },
          ],
          meta: { count: 1 },
        },
      }),
      cancel: vi.fn(),
      destroy: vi.fn(),
    };

    holder.ctx = {
      api: { resource: (name: string) => ({ executions })[name] },
      router: { navigate: vi.fn() },
      view: { close: vi.fn() },
    };

    renderWithApp(<ExecutionHistoryDrawer workflowKey="wf-key" />);

    await waitFor(() => {
      expect(executions.list).toHaveBeenCalled();
    });

    expect(screen.getByText('On going')).toBeInTheDocument();
    expect(document.querySelector('.anticon-loading')).not.toBeNull();
    expect(screen.queryByText('Cancel the execution')).toBeNull();

    const cancelButton = screen.getByRole('button', { name: 'stop' });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton.className).toContain('ant-btn-link');
  });
});
