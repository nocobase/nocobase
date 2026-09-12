/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  ctx: null as any,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useFlowContext: () => holder.ctx,
  };
});

vi.mock('../locale', () => ({
  NAMESPACE: 'notification-manager',
  useT: () => (key: string) => key,
  useNotificationTranslation: () => ({ t: (key: string) => key }),
  tExpr: (key: string) => key,
}));

import { MessageConfigForm } from '../components/MessageConfigForm';

function Body() {
  return <div>Loaded message config</div>;
}

function renderForm(initialValues: Record<string, unknown>) {
  return render(
    <Form initialValues={initialValues}>
      <MessageConfigForm namePrefix={['config']} />
    </Form>,
  );
}

describe('MessageConfigForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the registered message body directly from the channel list metadata', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ name: 'in-app', title: 'In-app', notificationType: 'in-app-message' }],
      },
    });
    const request = vi.fn();
    const loader = () => Promise.resolve({ default: Body });

    holder.ctx = {
      api: {
        resource: () => ({ list }),
        request,
      },
      app: {
        pm: {
          get: () => ({
            channelTypes: {
              get: (type: string) =>
                type === 'in-app-message' ? { components: { MessageConfigFormLoader: loader } } : undefined,
            },
          }),
        },
      },
    };

    renderForm({ config: { channelName: 'in-app' } });

    expect(await screen.findByText('Loaded message config')).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(1);
    expect(request).not.toHaveBeenCalled();
  });

  it('falls back to loading channel detail when the list response omits notificationType', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ name: 'in-app', title: 'In-app' }],
      },
    });
    const request = vi.fn().mockResolvedValue({
      data: {
        data: { notificationType: 'in-app-message' },
      },
    });
    const loader = () => Promise.resolve({ default: Body });

    holder.ctx = {
      api: {
        resource: () => ({ list }),
        request,
      },
      app: {
        pm: {
          get: () => ({
            channelTypes: {
              get: (type: string) =>
                type === 'in-app-message' ? { components: { MessageConfigFormLoader: loader } } : undefined,
            },
          }),
        },
      },
    };

    renderForm({ config: { channelName: 'in-app' } });

    expect(await screen.findByText('Loaded message config')).toBeInTheDocument();
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        url: '/notificationChannels:get',
        method: 'get',
        params: { filterByTk: 'in-app' },
      });
    });
  });

  it('uses the legacy notification-manager plugin registry when running in the v1 app runtime', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ name: 'in-app', title: 'In-app', notificationType: 'in-app-message' }],
      },
    });
    const request = vi.fn();
    const loader = () => Promise.resolve({ default: Body });

    holder.ctx = {
      api: {
        resource: () => ({ list }),
        request,
      },
      app: {
        pm: {
          get: (token: unknown) =>
            token === 'notification-manager'
              ? {
                  channelTypes: {
                    get: (type: string) =>
                      type === 'in-app-message' ? { components: { MessageConfigFormLoader: loader } } : undefined,
                  },
                }
              : undefined,
        },
      },
    };

    renderForm({ config: { channelName: 'in-app' } });

    expect(await screen.findByText('Loaded message config')).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });
});
