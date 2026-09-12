/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  ctx: {
    api: {
      resource: vi.fn(),
    },
  },
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
  return {
    ...actual,
    randomId: () => 's_generated',
    useFlowContext: () => testState.ctx,
  };
});

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');
  return {
    ...actual,
    DrawerFormLayout: ({
      children,
      onSubmit,
    }: React.PropsWithChildren<{
      onSubmit: () => Promise<void>;
    }>) => (
      <>
        {children}
        <button onClick={() => onSubmit().catch(() => undefined)}>Submit drawer</button>
      </>
    ),
  };
});

vi.mock('../locale', () => ({
  useNotificationTranslation: () => ({ t: (key: string) => key }),
  useT: () => (key: string) => key,
}));

import PluginNotificationManagerClientV2 from '../plugin';
import { ChannelFormView } from '../pages/ChannelsPage';

function OverwriteChannelName() {
  const form = Form.useFormInstance();
  React.useEffect(() => {
    form.setFieldValue('name', 's_overwritten');
  }, [form]);
  return null;
}

function createPlugin(ChannelConfigFormLoader?: () => Promise<{ default: React.ComponentType }>) {
  return {
    channelTypes: {
      get: () => ({
        components: {
          ChannelConfigFormLoader,
        },
      }),
    },
  } as unknown as PluginNotificationManagerClientV2;
}

describe('ChannelFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.ctx.api.resource.mockReturnValue({
      create: testState.create,
      update: testState.update,
    });
  });

  it('submits an edited channel identifier when creating a channel', async () => {
    testState.create.mockResolvedValue({});
    render(<ChannelFormView mode="create" notificationType="email" plugin={createPlugin()} onSubmitted={vi.fn()} />);

    const identifier = screen.getByRole('textbox', { name: 'Channel name' });
    expect(identifier).toHaveValue('s_generated');
    expect(identifier).toBeEnabled();

    fireEvent.change(identifier, { target: { value: 'custom_email' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Channel display name' }), {
      target: { value: 'Custom email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit drawer' }));

    await waitFor(() => {
      expect(testState.create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          name: 'custom_email',
          title: 'Custom email',
          notificationType: 'email',
        }),
      });
    });
  });

  it('rejects an invalid channel identifier', async () => {
    render(<ChannelFormView mode="create" notificationType="email" plugin={createPlugin()} onSubmitted={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Channel name' }), { target: { value: '1-invalid' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Channel display name' }), {
      target: { value: 'Invalid channel' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit drawer' }));

    expect(
      await screen.findByText('Support letters, numbers and underscores, must start with a letter.'),
    ).toBeInTheDocument();
    expect(testState.create).not.toHaveBeenCalled();
  });

  it('preserves the original channel identifier when editing', async () => {
    testState.update.mockResolvedValue({});
    const loader = () => Promise.resolve({ default: OverwriteChannelName });

    render(
      <ChannelFormView
        mode="edit"
        notificationType="email"
        plugin={createPlugin(loader)}
        record={{ name: 's_original', title: 'Email', notificationType: 'email', options: {} }}
        onSubmitted={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Channel name' })).toHaveValue('s_overwritten');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit drawer' }));

    await waitFor(() => {
      expect(testState.update).toHaveBeenCalledWith({
        filterByTk: 's_original',
        values: expect.objectContaining({
          name: 's_original',
          title: 'Email',
          notificationType: 'email',
          options: {},
        }),
      });
    });
  });
});
