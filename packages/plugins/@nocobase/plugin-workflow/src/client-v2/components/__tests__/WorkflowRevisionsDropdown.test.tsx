/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  dropdownProps: null as any,
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    router: { navigate: vi.fn() },
  }),
}));

vi.mock('../../locale', () => ({
  useWorkflowTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../hooks/useWorkflowRuntimePaths', () => ({
  useWorkflowRuntimePaths: () => ({
    getWorkflowCanvasPath: (id: string | number) => `/admin/workflow/workflows/${id}`,
  }),
}));

vi.mock('../../canvas/style', () => ({
  default: () => ({
    cx: (...classes: Array<string | Record<string, any>>) =>
      classes
        .flatMap((item) => {
          if (typeof item === 'string') return [item];
          return Object.entries(item)
            .filter(([, enabled]) => Boolean(enabled))
            .map(([name]) => name);
        })
        .join(' '),
    styles: {
      dropdownClass: 'dropdown-class',
      workflowVersionDropdownClass: 'workflow-version-dropdown-class',
    },
  }),
}));

vi.mock('antd', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Dropdown: (props: any) => {
    holder.dropdownProps = props;
    return <div>{props.children}</div>;
  },
  theme: {
    useToken: () => ({ token: {} }),
  },
}));

vi.mock('ahooks', () => ({
  useMemoizedFn: (fn: any) => fn,
  useRequest: () => ({
    data: [
      {
        id: 369886707974144,
        createdAt: '2026-06-16T00:00:00.000Z',
        current: true,
        enabled: true,
        versionStats: { executed: 1 },
      },
      {
        id: 369813449801731,
        createdAt: '2026-06-15T00:00:00.000Z',
        current: false,
        enabled: false,
        versionStats: { executed: 0 },
      },
    ],
    run: vi.fn(),
  }),
}));

import { WorkflowRevisionsDropdown } from '../WorkflowRevisionsDropdown';

describe('WorkflowRevisionsDropdown', () => {
  it('uses the shared v1-aligned dropdown classes and strong+time label structure', () => {
    render(
      <WorkflowRevisionsDropdown record={{ id: 369886707974144, key: 'wf-key' } as any} resource={{ list: vi.fn() }} />,
    );

    expect(screen.getByRole('button', { name: /Version/i })).toBeInTheDocument();
    expect(holder.dropdownProps.className).toBe('workflow-versions');
    expect(holder.dropdownProps.menu.className).toBe('dropdown-class workflow-version-dropdown-class');

    const [first] = holder.dropdownProps.menu.items;
    expect(first.className).toContain('enabled');
    expect(first.label.type).toBe(React.Fragment);
  });
});
