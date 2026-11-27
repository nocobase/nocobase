/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application as LegacyApplication, Plugin } from '@nocobase/client';
import { Application as ModernApplication } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import { render, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ModernProvider from '../../client-v2/providers/AuthProvider';
import { AuthProvider as LegacyProvider } from '../AuthProvider';

describe.each([
  { name: 'legacy', Application: LegacyApplication, Provider: LegacyProvider },
  { name: 'modern', Application: ModernApplication, Provider: ModernProvider },
])('$name callback startup', ({ Application, Provider }) => {
  afterEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it.each(['wecom', 'oidc', 'saml', 'cas', 'dingtalk', 'oauth2'])(
    'authenticates the first protected request after a %s callback',
    async (authenticator) => {
      window.history.replaceState(null, '', '/admin?token=new-session&authenticator=' + authenticator);
      const app = new Application({ initializeAuthFromUrl: true, apiClient: { storageType: 'memory' }, ws: false });
      const api = app.apiClient;
      const mock = new MockAdapter(api.axios);
      mock
        .onGet('customIconRepos:getSettings')
        .reply((config) =>
          config.headers?.Authorization === 'Bearer new-session' &&
          config.headers?.['X-Authenticator'] === authenticator
            ? [200, {}]
            : [401, { errors: [{ code: 'EMPTY_TOKEN' }] }],
        );

      expect((await api.request({ url: 'customIconRepos:getSettings' })).status).toBe(200);
    },
  );

  it('authenticates the WebSocket with the callback authenticator when the connection opens', async () => {
    window.history.replaceState(null, '', '/?authenticator=work-account&token=new-session');
    const app = new Application({ initializeAuthFromUrl: true, apiClient: { storageType: 'memory' }, ws: false });
    const send = vi.spyOn(app.ws, 'send');
    await app.loadWebSocket();
    app.ws.emit('open', {});
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'auth:token', payload: { token: 'new-session', authenticator: 'work-account' } }),
    );
  });

  it.each(['renewed-session', ''])('cleans the callback URL without replaying a replaced token (%s)', async (next) => {
    window.history.replaceState(null, '', '/apps/sub/admin?tab=recent&authenticator=wecom&token=initial#panel');
    const app = new Application({ initializeAuthFromUrl: true, publicPath: '/', ws: false });
    expect(app.apiClient.auth.token).toBe('initial');
    app.apiClient.auth.setToken(next);
    render(
      <FlowEngineProvider engine={app.flowEngine}>
        <BrowserRouter>
          <Provider />
        </BrowserRouter>
      </FlowEngineProvider>,
    );
    await waitFor(() => expect(window.location.search).toBe('?tab=recent'));
    expect(window.location.pathname + window.location.hash).toBe('/apps/sub/admin#panel');
    expect(app.apiClient.auth.token).toBe(next);
    const other = new Application({ name: 'other', ws: false });
    expect(other.apiClient.auth.token).toBeFalsy();
  });

  it('keeps an existing session on an ordinary visit and supports password sign-in and sign-out', async () => {
    const previous = new Application({ ws: false });
    previous.apiClient.auth.setAuthenticator('basic');
    previous.apiClient.auth.setToken('existing');
    window.history.replaceState(null, '', '/signin?redirect=%2Fadmin');
    const app = new Application({ initializeAuthFromUrl: true, ws: false });
    const api = app.apiClient;
    expect(api.auth.token).toBe('existing');
    const mock = new MockAdapter(api.axios);
    mock.onPost('auth:signOut').reply(200, {});
    mock.onPost('auth:signIn').reply(200, { data: { token: 'password-session' } });
    await api.auth.signOut();
    expect(api.auth.token).toBeFalsy();
    await api.auth.signIn({ account: 'tester', password: 'test-only' }, 'basic');
    expect(api.auth.token).toBe('password-session');
    expect(api.auth.authenticator).toBe('basic');
  });

  it('still consumes a token-only callback when the router mounts', async () => {
    window.history.replaceState(null, '', '/admin?token=legacy-session');
    const app = new Application({ initializeAuthFromUrl: true, ws: false });
    expect(app.apiClient.auth.token).toBeFalsy();
    render(
      <FlowEngineProvider engine={app.flowEngine}>
        <BrowserRouter>
          <Provider />
        </BrowserRouter>
      </FlowEngineProvider>,
    );
    await waitFor(() => expect(window.location.search).toBe(''));
    expect(app.apiClient.auth.token).toBe('legacy-session');
  });
});

it('replaces an expired session before a legacy plugin loads its protected icon settings', async () => {
  class IconPlugin extends Plugin {
    async load() {
      await this.app.apiClient.request({ url: 'customIconRepos:getSettings' });
    }
  }

  const previous = new LegacyApplication({ ws: false });
  previous.apiClient.auth.setAuthenticator('basic');
  previous.apiClient.auth.setToken('expired');
  window.history.replaceState(null, '', '/?authenticator=wecom&token=new-session');
  try {
    const app = new LegacyApplication({ initializeAuthFromUrl: true, plugins: [IconPlugin], ws: false });
    const mock = new MockAdapter(app.apiClient.axios);
    mock
      .onGet('customIconRepos:getSettings')
      .reply((config) =>
        config.headers?.Authorization === 'Bearer new-session'
          ? [200, {}]
          : [401, { errors: [{ code: 'EXPIRED_SESSION' }] }],
      );
    await app.pm.load();
    expect(mock.history.get).toHaveLength(1);
  } finally {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  }
});
