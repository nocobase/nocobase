/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  define: vi.fn(),
  fetchChannels: vi.fn(),
  flowContext: {
    user: {
      id: 7,
    },
  },
  userIdObs: {
    value: null as number | null,
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  BasePageMenuModel: class {
    static define = holder.define;

    context = {
      isMobileLayout: false,
    };
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => holder.flowContext,
}));

vi.mock('../../components/InboxContent', () => ({
  InboxContent: () => <div data-testid="inbox-content" />,
}));

vi.mock('../../components/MobileNotificationContent', () => ({
  MobileNotificationContent: () => <div data-testid="mobile-notification-content" />,
}));

vi.mock('../../locale', () => ({
  tExpr: (key: string) => key,
}));

vi.mock('../../state', () => ({
  fetchChannels: holder.fetchChannels,
  userIdObs: holder.userIdObs,
}));

import { NotificationPageMenuModel } from '../NotificationPageMenuModel';

describe('NotificationPageMenuModel', () => {
  beforeEach(() => {
    holder.fetchChannels.mockReset();
    holder.fetchChannels.mockResolvedValue(undefined);
    holder.userIdObs.value = null;
  });

  it('defines the notification page menu route', () => {
    expect(holder.define).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'BellOutlined',
        label: 'Notification',
        routeType: 'notification',
      }),
    );
  });

  it('renders the desktop inbox and initializes its user and channels', async () => {
    const model = new NotificationPageMenuModel();

    render(model.render() as React.ReactElement);

    expect(screen.getByTestId('inbox-content')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-notification-content')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(holder.userIdObs.value).toBe(7);
      expect(holder.fetchChannels).toHaveBeenCalledWith({ limit: 30 });
    });
  });

  it('reuses mobile notification content without initializing the desktop inbox', () => {
    const model = new NotificationPageMenuModel();
    model.context.isMobileLayout = true;

    render(model.render() as React.ReactElement);

    expect(screen.getByTestId('mobile-notification-content')).toBeInTheDocument();
    expect(screen.queryByTestId('inbox-content')).not.toBeInTheDocument();
    expect(holder.fetchChannels).not.toHaveBeenCalled();
  });
});
