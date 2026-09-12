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
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import { useFlowContext as useLegacyFlowContext } from '../../../client/FlowContext';
import { openNodeConfigDrawer } from '../NodeConfigDrawer';

const holder = vi.hoisted(() => ({
  ctx: null as { api: { resource: (name: string) => { update: ReturnType<typeof vi.fn> } } } | null,
  view: { close: vi.fn() },
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useFlowContext: () => holder.ctx,
    useFlowView: () => holder.view,
  };
});

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/client-v2', () => ({
  DrawerFormLayout: ({
    children,
    footer,
    title,
  }: {
    children?: React.ReactNode;
    footer?: React.ReactNode;
    title?: React.ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <div>{children}</div>
      <div>{footer}</div>
    </div>
  ),
}));

vi.mock('../../components/TestRunButton', () => ({
  TestRunButton: () => <div data-testid="test-run-button" />,
}));

function LegacyWorkflowReader() {
  const { workflow } = useLegacyFlowContext();
  return <div data-testid="legacy-workflow-collection">{workflow?.config?.collection ?? 'missing'}</div>;
}

function renderWithApp(node: React.ReactNode) {
  return render(<App>{node}</App>);
}

describe('openNodeConfigDrawer', () => {
  it('re-provides workflow through the legacy FlowContext for reused v1 fieldsets', async () => {
    const drawer = vi.fn();
    const update = vi.fn().mockResolvedValue({});

    holder.ctx = {
      api: {
        resource: () => ({ update }),
      },
    };

    openNodeConfigDrawer({
      ctx: { viewer: { drawer } },
      data: { id: 9, key: 'node_9', type: 'update', config: {} },
      instruction: {
        title: 'Update record',
        FieldsetLoader: () => Promise.resolve({ default: LegacyWorkflowReader }),
      },
      t: (key: string) => key,
      workflow: {
        id: 1,
        config: {
          collection: 'main.posts',
        },
      },
    });

    const content = drawer.mock.calls[0][0].content as () => React.ReactElement;
    renderWithApp(content());

    expect(await screen.findByTestId('legacy-workflow-collection')).toHaveTextContent('main.posts');
  });

  it('keeps the drawer title weight aligned with the v1 title layout', () => {
    const drawer = vi.fn();

    holder.ctx = {
      api: {
        resource: () => ({ update: vi.fn() }),
      },
    };

    openNodeConfigDrawer({
      ctx: { viewer: { drawer } },
      data: { id: 9, key: 'node_9', title: 'Webhook response', type: 'update', config: {} },
      instruction: {
        title: 'Webhook response',
      },
      t: (key: string) => key,
      workflow: { id: 1, config: {} },
    });

    const content = drawer.mock.calls[0][0].content as () => React.ReactElement;
    renderWithApp(content());

    expect(screen.getByText('Webhook response')).toHaveStyle({ fontWeight: 'bold' });
    expect(screen.getByText('node_9')).toHaveStyle({ fontWeight: 'normal' });
  });
});
