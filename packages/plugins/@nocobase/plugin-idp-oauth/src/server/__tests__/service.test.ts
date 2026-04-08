/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { IdpOauthService } from '../service';

describe('plugin-idp-oauth > IdpOauthService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should build frontend interaction paths for main app and sub app in multi-app mode', () => {
    const service = new IdpOauthService({} as any, {} as any);
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
    } as any);

    expect(service.getFrontendInteractionPath('main', 'uid-1')).toBe('/idp-oauth/interaction/uid-1');
    expect(service.getFrontendInteractionPath('demo', 'uid-2')).toBe('/apps/demo/idp-oauth/interaction/uid-2');
  });

  test('should build frontend paths without apps prefix in single mode', () => {
    const service = new IdpOauthService({} as any, {} as any);
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'single',
    } as any);

    expect(service.getFrontendErrorPath('main')).toBe('/idp-oauth/error');
    expect(service.getFrontendErrorPath('demo')).toBe('/idp-oauth/error');
    expect(service.getFrontendInteractionPath('demo', 'uid-2')).toBe('/idp-oauth/interaction/uid-2');
  });

  test('should use root api issuer path for custom-domain sub app requests', () => {
    const service = new IdpOauthService({} as any, {} as any);
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
    } as any);

    const providerContext = service.getProviderContext({
      app: { name: 'subapp' },
      path: '/api/mcp',
      protocol: 'https',
      host: 'subapp.example.com',
      headers: {},
    });

    expect(providerContext.issuerPath).toBe('/api');
    expect(providerContext.issuer).toBe('https://subapp.example.com/api');
    expect(service.getFrontendInteractionPath('subapp', 'uid-3', providerContext.issuerPath)).toBe(
      '/idp-oauth/interaction/uid-3',
    );
  });

  test('should preserve sub app issuer path when original url uses __app prefix', () => {
    const service = new IdpOauthService({} as any, {} as any);
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
    } as any);

    const providerContext = service.getProviderContext({
      app: { name: 'subapp' },
      path: '/api/mcp',
      req: {
        originalUrl: '/api/__app/subapp/mcp',
        url: '/api/mcp',
      },
      protocol: 'https',
      host: 'example.com',
      headers: {},
    });

    expect(providerContext.issuerPath).toBe('/api/__app/subapp');
    expect(providerContext.issuer).toBe('https://example.com/api/__app/subapp');
  });

  test('getSupportedScopes should include resource server scopes without duplicates', () => {
    const service = new IdpOauthService({} as any, {} as any);

    service.registerResourceServer('mcp', {
      path: '/mcp',
      scope: 'mcp',
    });
    service.registerResourceServer('custom', {
      identifier: 'urn:test:custom',
      scope: 'mcp custom',
    });

    expect(service.getSupportedScopes()).toEqual(['openid', 'offline_access', 'profile', 'email', 'mcp', 'custom']);
  });

  test('getSupportedScopes should drop unregistered resource server scopes', () => {
    const service = new IdpOauthService({} as any, {} as any);

    service.registerResourceServer('mcp', {
      path: '/mcp',
      scope: 'mcp',
    });
    service.unregisterResourceServer('mcp');

    expect(service.getSupportedScopes()).toEqual(['openid', 'offline_access', 'profile', 'email']);
  });
});
