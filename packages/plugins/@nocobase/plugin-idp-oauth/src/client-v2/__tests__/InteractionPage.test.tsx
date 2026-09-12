/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InteractionPage from '../pages/InteractionPage';

type InteractionResponse = {
  prompt?: 'login' | 'consent';
  redirectTo?: string;
  clientName?: string;
  details?: string;
};

type ApiResponse = {
  data: {
    data: InteractionResponse;
  };
};

const navigateMock = vi.fn();
const mockState = vi.hoisted(() => ({
  token: 'test-token' as string | null,
  authenticator: 'oidc',
  responses: [] as ApiResponse[],
  request: vi.fn<(config: unknown) => Promise<ApiResponse>>(),
  translate: (key: string, params?: Record<string, unknown>) => {
    if (!params) {
      return key;
    }
    return Object.entries(params).reduce((message, [paramKey, value]) => {
      return message.replace(`{{${paramKey}}}`, String(value));
    }, key);
  },
  context: {
    api: {
      auth: {
        getToken: () => mockState.token,
        getAuthenticator: () => mockState.authenticator,
      },
      request: (config: unknown) => mockState.request(config),
    },
    app: {
      name: 'main',
    },
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => mockState.context,
}));

vi.mock('../locale', () => ({
  useT: () => mockState.translate,
}));

function renderPage(path = '/idp-oauth/interaction/uid-1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/idp-oauth/interaction/:uid" element={<InteractionPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('plugin-idp-oauth client-v2 InteractionPage', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    navigateMock.mockReset();
    mockState.token = 'test-token';
    mockState.authenticator = 'oidc';
    mockState.responses = [];
    mockState.request = vi.fn(async () => {
      const next = mockState.responses.shift();
      if (!next) {
        throw new Error('No mocked interaction response available');
      }
      return next;
    });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        replace: vi.fn(),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('should redirect to signin when the interaction requires login and no token is present', async () => {
    mockState.token = null;
    mockState.responses = [
      {
        data: {
          data: {
            prompt: 'login',
          },
        },
      },
    ];

    renderPage();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/signin?redirect=%2Fidp-oauth%2Finteraction%2Fuid-1', {
        replace: true,
      });
    });
  });

  it('should automatically continue the interaction after login and render consent details', async () => {
    mockState.responses = [
      {
        data: {
          data: {
            prompt: 'login',
          },
        },
      },
      {
        data: {
          data: {
            prompt: 'consent',
            clientName: 'Codex CLI',
            details: 'profile email',
          },
        },
      },
    ];

    renderPage();

    await waitFor(() => {
      expect(mockState.request).toHaveBeenCalledTimes(2);
      expect(mockState.request).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          method: 'post',
          url: 'idpOAuth/interaction/uid-1',
          headers: {
            Authorization: 'Bearer test-token',
            'X-Authenticator': 'oidc',
          },
        }),
      );
    });

    expect(await screen.findByText('Authorize application')).toBeInTheDocument();
    expect(screen.getByText('Codex CLI requests access to your account.')).toBeInTheDocument();
    expect(screen.getByText('Requested permissions')).toBeInTheDocument();
    expect(screen.getByText('profile email')).toBeInTheDocument();
  });

  it('should submit cancellation when Escape is pressed on the consent screen', async () => {
    mockState.responses = [
      {
        data: {
          data: {
            prompt: 'consent',
            clientName: 'Codex CLI',
          },
        },
      },
      {
        data: {
          data: {},
        },
      },
    ];

    renderPage();

    expect(await screen.findByText('Authorize application')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(mockState.request).toHaveBeenCalledTimes(2);
      expect(mockState.request).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          method: 'post',
          data: { cancel: 1 },
        }),
      );
    });
  });

  it('should redirect immediately when the server returns a redirect target', async () => {
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        replace,
      },
    });

    mockState.responses = [
      {
        data: {
          data: {
            redirectTo: '/callback?code=123',
          },
        },
      },
    ];

    renderPage();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/callback?code=123');
    });
  });
});
