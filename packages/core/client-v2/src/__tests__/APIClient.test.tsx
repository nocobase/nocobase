/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient } from '@nocobase/client-v2';
import type { NotificationInstance } from 'antd/es/notification/interface';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

function createAPIClient() {
  const notification = {
    error: vi.fn(),
    success: vi.fn(),
  } as unknown as NotificationInstance;
  const apiClient = new APIClient();
  apiClient.app = { context: { notification } };
  const apiMock = new MockAdapter(apiClient.axios);
  return { apiClient, apiMock, notification };
}

describe('APIClient response notifications', () => {
  it('shows error messages returned by failed requests', async () => {
    const { apiClient, apiMock, notification } = createAPIClient();
    apiMock.onPost('/posts:create').reply(400, { errors: [{ message: 'Request rejected by workflow' }] });

    await expect(apiClient.request({ url: '/posts:create', method: 'post' })).rejects.toBeDefined();

    expect(notification.error).toHaveBeenCalledOnce();
    const [{ message }] = vi.mocked(notification.error).mock.calls[0];
    expect(renderToStaticMarkup(<>{message}</>)).toContain('Request rejected by workflow');
  });

  it('does not show errors when skipNotify is enabled', async () => {
    const { apiClient, apiMock, notification } = createAPIClient();
    apiMock.onGet('/health').reply(500, { errors: [{ message: 'Health check failed' }] });

    await expect(apiClient.request({ url: '/health', skipNotify: true })).rejects.toBeDefined();

    expect(notification.error).not.toHaveBeenCalled();
  });

  it('shows messages returned by successful requests', async () => {
    const { apiClient, apiMock, notification } = createAPIClient();
    apiMock.onPost('/posts:create').reply(200, { messages: [{ message: 'Created successfully' }] });

    await apiClient.request({ url: '/posts:create', method: 'post' });

    expect(notification.success).toHaveBeenCalledOnce();
    const [{ message }] = vi.mocked(notification.success).mock.calls[0];
    expect(renderToStaticMarkup(<>{message}</>)).toContain('Created successfully');
  });
});
