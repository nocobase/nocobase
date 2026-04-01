/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IdpOauthService } from '../service';

describe('plugin-idp-oauth > IdpOauthService', () => {
  test('should build frontend interaction paths for main app and sub app', () => {
    const service = new IdpOauthService({} as any, {} as any);

    expect(service.getFrontendInteractionPath('main', 'uid-1')).toBe('/idp-oauth/interaction/uid-1');
    expect(service.getFrontendInteractionPath('demo', 'uid-2')).toBe('/apps/demo/idp-oauth/interaction/uid-2');
  });

  test('should build frontend error paths for main app and sub app', () => {
    const service = new IdpOauthService({} as any, {} as any);

    expect(service.getFrontendErrorPath('main')).toBe('/idp-oauth/error');
    expect(service.getFrontendErrorPath('demo')).toBe('/apps/demo/idp-oauth/error');
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
