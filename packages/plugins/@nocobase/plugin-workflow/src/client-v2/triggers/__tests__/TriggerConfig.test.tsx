/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowContext } from '../../canvas/contexts';
import type { Trigger } from '..';
import { TriggerConfig, openTriggerConfigDrawer } from '../TriggerConfig';

const holder = vi.hoisted(() => ({
  close: vi.fn(),
  update: vi.fn(),
  workflowPlugin: {
    getTriggerOptions: vi.fn((type?: string) => (type === 'approval' ? { title: 'Approval event' } : undefined)),
    getWorkflowNotices: vi.fn(() => []),
  },
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    DrawerFormLayout: ({
      children,
      footer,
      title,
    }: {
      children: React.ReactNode;
      footer?: React.ReactNode;
      title: string;
    }) => (
      <section aria-label={title}>
        {children}
        <footer>{footer}</footer>
      </section>
    ),
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: () => ({
          update: holder.update,
        }),
      },
      app: {
        pm: {
          get: () => holder.workflowPlugin,
        },
      },
    }),
    useFlowView: () => ({
      close: holder.close,
    }),
  };
});

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  tExpr: (key: string) => key,
  useT: () => (key: string) => {
    const matched = key.match(/^{{t\(['"](.+?)['"]/);
    return matched?.[1] ?? key;
  },
}));

describe('TriggerConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.workflowPlugin.getTriggerOptions.mockImplementation((type?: string) =>
      type === 'approval' ? { title: 'Approval event' } : undefined,
    );
    holder.workflowPlugin.getWorkflowNotices.mockReturnValue([]);
  });

  it('renders trigger node card notices with compact alert styles when the workflow is editable', async () => {
    const notice = {
      key: 'legacy-initiator-ui',
      message: 'Initiator interface needs reconfiguration',
      description:
        'This initiator interface was created in an earlier version. Reconfigure it before using this workflow.',
    };
    holder.workflowPlugin.getWorkflowNotices.mockReturnValue([notice]);

    render(
      <FlowContext.Provider
        value={{
          workflow: { id: 1, type: 'approval', config: { applyForm: 'legacy_schema' } },
          refresh: vi.fn(),
        }}
      >
        <TriggerConfig />
      </FlowContext.Provider>,
    );

    const message = await screen.findByText('Initiator interface needs reconfiguration');
    expect(message).toHaveStyle({ fontWeight: 'normal' });
    expect(
      screen.queryByText(
        'This initiator interface was created in an earlier version. Reconfigure it before using this workflow.',
      ),
    ).not.toBeInTheDocument();
    const alert = message.closest('.ant-alert');
    expect(alert).not.toHaveClass('ant-alert-with-description');
    expect(alert).toHaveStyle({ alignItems: 'flex-start' });
    expect(holder.workflowPlugin.getWorkflowNotices).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: 'trigger-node-card',
        workflow: expect.objectContaining({ id: 1 }),
      }),
    );
  });

  it('uses the notice type to render the compact alert icon and color', async () => {
    holder.workflowPlugin.getWorkflowNotices.mockReturnValue([
      {
        key: 'invalid-trigger-ui',
        message: 'Invalid trigger interface',
        description: 'The trigger interface is invalid.',
        type: 'error',
      },
    ]);

    const { container } = render(
      <FlowContext.Provider
        value={{
          workflow: { id: 1, type: 'approval', config: {} },
          refresh: vi.fn(),
        }}
      >
        <TriggerConfig />
      </FlowContext.Provider>,
    );

    expect(await screen.findByText('Invalid trigger interface')).toBeInTheDocument();
    expect(screen.queryByText('The trigger interface is invalid.')).not.toBeInTheDocument();
    const alert = screen.getByText('Invalid trigger interface').closest('.ant-alert');
    expect(alert).toHaveClass('ant-alert-error');
    expect(alert).not.toHaveClass('ant-alert-with-description');
    expect(alert).toHaveStyle({ alignItems: 'flex-start' });
    expect(container.querySelector('.anticon-close-circle')).toBeInTheDocument();
    expect(container.querySelector('.anticon-exclamation-circle')).not.toBeInTheDocument();
  });

  it('hides trigger node card notices when the workflow version has been executed', () => {
    holder.workflowPlugin.getWorkflowNotices.mockReturnValue([
      {
        key: 'legacy-initiator-ui',
        message: 'Initiator interface needs reconfiguration',
        description:
          'This initiator interface was created in an earlier version. Reconfigure it before using this workflow.',
      },
    ]);

    render(
      <FlowContext.Provider
        value={{
          workflow: {
            id: 1,
            type: 'approval',
            config: { applyForm: 'legacy_schema' },
            versionStats: { executed: 1 },
          },
          refresh: vi.fn(),
        }}
      >
        <TriggerConfig />
      </FlowContext.Provider>,
    );

    expect(screen.queryByText('Initiator interface needs reconfiguration')).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'This initiator interface was created in an earlier version. Reconfigure it before using this workflow.',
      ),
    ).not.toBeInTheDocument();
  });

  it('renders trigger type tag without the v2 thunderbolt icon in the config drawer', async () => {
    const drawer = vi.fn();
    const trigger: Trigger = {
      title: `{{t('Approval event', { ns: "@nocobase/plugin-workflow-approval" })}}`,
      description: 'Approval event description',
      FieldsetLoader: () =>
        Promise.resolve({
          default: () => (
            <Form.Item name={['config', 'collection']} label="Collection:" rules={[{ required: true }]}>
              <input data-testid="fieldset" />
            </Form.Item>
          ),
        }),
    };

    openTriggerConfigDrawer({
      ctx: { viewer: { drawer } },
      trigger,
      workflow: {
        id: 1,
        config: {},
      },
    });

    const Content = drawer.mock.calls[0][0].content;
    const { container } = render(<Content />);

    expect(container.querySelector('dl dt')).toHaveTextContent('Trigger type');
    expect(container.querySelector('dl dd .ant-tag')).toHaveTextContent('Approval event');
    expect(container.querySelector('section > div')).toHaveStyle({ paddingBottom: '48px' });
    expect(container.querySelector('.anticon-thunderbolt')).toBeNull();
    await waitFor(() => {
      expect(screen.getByTestId('fieldset')).toBeInTheDocument();
    });
    expect(container.querySelector('.ant-form-item-label label')?.textContent).toBe('*Collection:');
  });
});
