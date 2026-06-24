/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App, Form } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFlowContext as useLegacyFlowContext } from '../../../client/FlowContext';
import { openNodeConfigDrawer } from '../NodeConfigDrawer';

const holder = vi.hoisted(() => ({
  ctx: null as { api: { resource: (name: string) => { update: ReturnType<typeof vi.fn> } } } | null,
  view: {
    close: vi.fn(),
    beforeClose: undefined as ((payload?: { force?: boolean }) => Promise<boolean> | boolean) | undefined,
  },
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

function PromptFieldset() {
  return (
    <Form.Item name={['config', 'prompt']} label="Prompt">
      <input aria-label="Prompt" />
    </Form.Item>
  );
}

function renderWithApp(node: React.ReactNode) {
  return render(<App>{node}</App>);
}

describe('openNodeConfigDrawer', () => {
  beforeEach(() => {
    holder.view = {
      close: vi.fn(),
      beforeClose: undefined,
    };
  });

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

  it('confirms before closing when node config has unsaved changes', async () => {
    const drawer = vi.fn();
    const update = vi.fn().mockResolvedValue({});

    holder.ctx = {
      api: {
        resource: () => ({ update }),
      },
    };

    openNodeConfigDrawer({
      ctx: { viewer: { drawer } },
      data: { id: 9, key: 'node_9', type: 'llm', config: { prompt: 'old prompt' } },
      instruction: {
        title: 'LLM',
        FieldsetLoader: () => Promise.resolve({ default: PromptFieldset }),
      },
      t: (key: string) => key,
    });

    const content = drawer.mock.calls[0][0].content as () => React.ReactElement;
    renderWithApp(content());

    fireEvent.change(await screen.findByLabelText('Prompt'), { target: { value: 'new prompt' } });

    const closeResult = holder.view.beforeClose?.({ force: false });
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' }).at(-1) as HTMLButtonElement);

    await expect(closeResult).resolves.toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it('merges instruction default config into the drawer initial values', async () => {
    const drawer = vi.fn();
    const update = vi.fn().mockResolvedValue({});

    holder.ctx = {
      api: {
        resource: () => ({ update }),
      },
    };

    openNodeConfigDrawer({
      ctx: { viewer: { drawer } },
      data: { id: 9, key: 'node_9', type: 'llm', config: {} },
      instruction: {
        title: 'LLM',
        createDefaultConfig: () => ({ prompt: 'default prompt' }),
        FieldsetLoader: () => Promise.resolve({ default: PromptFieldset }),
      },
      t: (key: string) => key,
    });

    const content = drawer.mock.calls[0][0].content as () => React.ReactElement;
    renderWithApp(content());

    expect(await screen.findByLabelText('Prompt')).toHaveValue('default prompt');
    await expect(holder.view.beforeClose?.({ force: false })).resolves.toBe(true);
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });
});
