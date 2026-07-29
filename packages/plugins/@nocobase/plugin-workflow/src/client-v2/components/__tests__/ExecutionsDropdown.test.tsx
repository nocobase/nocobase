/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

type DropdownProps = {
  children?: React.ReactNode;
  menu: {
    onClick: (info: { key: string }) => void;
  };
};

const holder = vi.hoisted(() => ({
  dropdownProps: null as DropdownProps | null,
  navigate: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: { resource: () => ({ list: vi.fn() }) },
    router: { navigate: holder.navigate },
  }),
}));

vi.mock('../../hooks/useWorkflowRuntimePaths', () => ({
  useWorkflowRuntimePaths: () => ({
    getWorkflowExecutionPath: (id: string | number) => `/workflow/executions/${id}`,
  }),
}));

vi.mock('../ExecutionStatusIcon', () => ({
  ExecutionStatusIcon: () => null,
}));

vi.mock('../workflowCanvas', () => ({
  formatTime: () => 'formatted time',
}));

vi.mock('ahooks', () => ({
  useMemoizedFn: (fn: (...args: unknown[]) => unknown) => fn,
  useRequest: () => ({
    data: [
      { id: 2, key: 'workflow-key', createdAt: '2026-07-29T00:00:00.000Z' },
      { id: 1, key: 'workflow-key', createdAt: '2026-07-28T00:00:00.000Z' },
    ],
    run: vi.fn(),
  }),
}));

vi.mock('antd', () => ({
  Button: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
  Dropdown: (props: DropdownProps) => {
    holder.dropdownProps = props;
    return <div>{props.children}</div>;
  },
  Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  theme: {
    useToken: () => ({ token: {} }),
  },
}));

import { ExecutionsDropdown } from '../ExecutionsDropdown';

describe('ExecutionsDropdown', () => {
  it('uses the runtime-derived path when switching executions', () => {
    render(<ExecutionsDropdown execution={{ id: 1, key: 'workflow-key' }} />);

    expect(holder.dropdownProps).not.toBeNull();
    holder.dropdownProps?.menu.onClick({ key: '2' });

    expect(holder.navigate).toHaveBeenCalledWith('/workflow/executions/2');
  });
});
