/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App } from 'antd';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddNodeContextProvider } from '../AddNodeContext';
import { useAddNodeContext } from '../AddNodeContext.shared';
import { FlowContext } from '../contexts';

const drawer = vi.fn();

class MockWebhookResponseInstruction {
  type = 'response';
  group = 'extended';
  title = 'Webhook response';

  isAvailable({
    engine,
    workflow,
  }: {
    engine: { isWorkflowSync?: (workflow: object) => boolean };
    workflow: object & { type?: string };
  }) {
    return workflow.type === 'webhook' && Boolean(engine.isWorkflowSync?.(workflow));
  }
}

vi.mock('../../locale', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../locale')>();
  return {
    ...actual,
    useT: () => (key: string, options?: Record<string, unknown>) =>
      String(key)
        .replace(/\{\{t\("([^"]+)"(?:,\s*\{[^}]*\})?\)\}\}/g, (_match, text) => text)
        .replace(/\{\{(\w+)\}\}/g, (_match, name) => String(options?.[name] ?? `{{${name}}}`)),
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => ({
      app: {
        pm: {
          get: () => ({
            instructions: {
              getValues: () => [new MockWebhookResponseInstruction()],
            },
            instructionGroups: {
              getValues: () => [{ key: 'extended', label: '{{t("Extended types")}}' }],
            },
            getInstruction: (type: string) => (type === 'response' ? new MockWebhookResponseInstruction() : undefined),
            isWorkflowSync: (workflow: { sync?: boolean }) => Boolean(workflow.sync),
          }),
        },
      },
      api: {},
      viewer: {
        drawer,
        dialog: vi.fn(),
      },
    }),
    useFlowView: () => ({
      close: vi.fn(),
    }),
  };
});

function MenuProbe() {
  const addNodeContext = useAddNodeContext();

  return (
    <button onClick={() => addNodeContext?.onMenuOpen?.({ upstream: { id: 1 }, branchIndex: 0 })} type="button">
      open-menu
    </button>
  );
}

describe('AddNodeContextProvider', () => {
  it('disables unavailable instruction items in the add-node menu', () => {
    render(
      <App>
        <FlowContext.Provider value={{ workflow: { id: 1, type: 'webhook', sync: false } as any, nodes: [] }}>
          <AddNodeContextProvider>
            <MenuProbe />
          </AddNodeContextProvider>
        </FlowContext.Provider>
      </App>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'open-menu' }));

    expect(drawer).toHaveBeenCalledTimes(1);

    const config = drawer.mock.calls[0][0];

    render(<App>{config.content()}</App>);

    expect(screen.getByText('Webhook response').closest('[role="menuitem"]')).toHaveAttribute('aria-disabled', 'true');
  });
});
