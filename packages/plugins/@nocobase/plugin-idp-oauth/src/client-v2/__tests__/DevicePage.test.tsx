/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import DevicePage from '../pages/DevicePage';

const navigateMock = vi.fn();
const mockState = vi.hoisted(() => ({
  token: 'test-token',
  authenticator: 'oidc',
  request: vi.fn().mockResolvedValue({
    data: {
      data: {
        status: 'pending',
        userCode: 'TKHX-NNCC',
        clientName: 'Codex CLI',
      },
    },
  }) as ReturnType<typeof vi.fn>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      auth: {
        getToken: () => mockState.token,
        getAuthenticator: () => mockState.authenticator,
      },
      request: (...args: unknown[]) => mockState.request(...args),
    },
    app: {
      name: 'main',
    },
  }),
}));

vi.mock('../locale', () => ({
  useT: () => (key: string, params?: Record<string, string>) => {
    if (!params) {
      return key;
    }
    return Object.entries(params).reduce((message, [paramKey, value]) => {
      return message.replace(`{{${paramKey}}}`, value);
    }, key);
  },
}));

describe('plugin-idp-oauth client-v2 DevicePage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    mockState.token = 'test-token';
    mockState.authenticator = 'oidc';
    mockState.request = vi.fn().mockResolvedValue({
      data: {
        data: {
          status: 'pending',
          userCode: 'TKHX-NNCC',
          clientName: 'Codex CLI',
        },
      },
    });
  });

  it('should send the current auth context when loading the device state', async () => {
    render(
      <MemoryRouter initialEntries={['/idpOAuth/device?user_code=TKHX-NNCC']}>
        <DevicePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockState.request).toHaveBeenCalledTimes(1);
      expect(mockState.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'idpOAuth/device/verification',
          method: 'get',
          withCredentials: true,
          headers: {
            Authorization: 'Bearer test-token',
            'X-Authenticator': 'oidc',
          },
          params: { user_code: 'TKHX-NNCC' },
        }),
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockState.request).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
