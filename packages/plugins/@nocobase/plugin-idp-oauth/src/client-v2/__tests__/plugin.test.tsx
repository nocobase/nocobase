/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PluginIdpOauthClientV2 from '../plugin';

describe('plugin-idp-oauth client-v2', () => {
  it('should register interaction and error public routes', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [PluginIdpOauthClientV2 as any],
      router: { type: 'memory', initialEntries: ['/v2/idp-oauth/error?error=access_denied'] },
    });

    await app.load();

    expect(app.router.get('idp-oauth.interaction')).toMatchObject({
      path: '/idp-oauth/interaction/:uid',
      skipAuthCheck: true,
    });
    expect(app.router.get('idp-oauth.error')).toMatchObject({
      path: '/idp-oauth/error',
      skipAuthCheck: true,
    });
  });

  it('should render error page under publicPath basename', async () => {
    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [PluginIdpOauthClientV2 as any],
      router: { type: 'memory', initialEntries: ['/v2/idp-oauth/error?error=access_denied&iss=test-issuer'] },
    });

    await app.load();
    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByText('access_denied')).toBeInTheDocument();
    expect(screen.getByText('test-issuer')).toBeInTheDocument();
  });
});
