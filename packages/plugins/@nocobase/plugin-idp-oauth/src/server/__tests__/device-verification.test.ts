/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getDeviceVerificationAction,
  handleDeviceVerificationRequest,
  isProviderDeviceVerificationPage,
} from '../device-verification';

function createService(provider: any, user?: { id: number }) {
  return {
    ensureProviderForContext: vi.fn().mockResolvedValue(provider),
    resolveInteractionBridgeUser: vi.fn().mockResolvedValue(user),
    runWithProviderContext: vi.fn((_ctx, callback) => callback()),
  } as any;
}

function createContext(path: string, options: { method?: string; query?: Record<string, unknown>; body?: any } = {}) {
  return {
    method: options.method || 'GET',
    path,
    query: options.query || {},
    request: {
      body: options.body || {},
    },
    throw: vi.fn((status: number, message: string) => {
      const error = new Error(message) as Error & { status?: number };
      error.status = status;
      throw error;
    }),
  } as any;
}

describe('plugin-idp-oauth > device verification', () => {
  test('should resolve device verification JSON actions', () => {
    expect(getDeviceVerificationAction('/api/idpOAuth/device/verification', '/api')).toBe('show');
    expect(getDeviceVerificationAction('/api/idpOAuth/device/verification:approve', '/api')).toBe('approve');
    expect(getDeviceVerificationAction('/api/idpOAuth/device/verification:cancel', '/api')).toBe('cancel');
    expect(getDeviceVerificationAction('/api/idpOAuth/device/auth', '/api')).toBeNull();
  });

  test('should hide provider device verification HTML routes', () => {
    expect(isProviderDeviceVerificationPage('/api/idpOAuth/device', '/api')).toBe(true);
    expect(isProviderDeviceVerificationPage('/api/idpOAuth/device/resume-uid', '/api')).toBe(true);
    expect(isProviderDeviceVerificationPage('/api/idpOAuth/device/auth', '/api')).toBe(false);
    expect(isProviderDeviceVerificationPage('/api/idpOAuth/device/verification', '/api')).toBe(false);
  });

  test('should return pending state for logged-in users', async () => {
    const provider = {
      DeviceCode: {
        findByUserCode: vi.fn().mockResolvedValue({
          clientId: 'client-device-1',
          isExpired: false,
        }),
      },
      Client: {
        find: vi.fn().mockResolvedValue({
          clientId: 'client-device-1',
          clientName: 'Device Client',
        }),
      },
    };
    const service = createService(provider, { id: 1 });
    const ctx = createContext('/api/idpOAuth/device/verification', {
      query: {
        user_code: 'xgnb-cxrz',
      },
    });

    await handleDeviceVerificationRequest(ctx, service, '/api');

    expect(provider.DeviceCode.findByUserCode).toHaveBeenCalledWith('XGNBCXRZ', { ignoreExpiration: true });
    expect(ctx.body).toMatchObject({
      status: 'pending',
      userCode: 'XGNBCXRZ',
      clientName: 'Device Client',
    });
  });

  test('should approve a pending device code', async () => {
    const resource = 'http://127.0.0.1:13000/api/';
    const code = {
      clientId: 'client-device-1',
      isExpired: false,
      params: {
        scope: 'openid offline_access api',
        resource,
      },
      save: vi.fn(),
    };
    const grant = {
      addOIDCScope: vi.fn(),
      addResourceScope: vi.fn(),
      save: vi.fn().mockResolvedValue('grant-1'),
    };
    const provider = {
      DeviceCode: {
        findByUserCode: vi.fn().mockResolvedValue(code),
      },
      Client: {
        find: vi.fn().mockResolvedValue({
          clientId: 'client-device-1',
        }),
      },
      Grant: vi.fn(function Grant(payload: any) {
        Object.assign(this, payload);
        return grant;
      }),
    };
    const service = createService(provider, { id: 1 });
    const ctx = createContext('/api/idpOAuth/device/verification:approve', {
      method: 'POST',
      body: {
        user_code: 'XGNB-CXRZ',
      },
    });

    await handleDeviceVerificationRequest(ctx, service, '/api');

    expect(provider.Grant).toHaveBeenCalledWith({
      accountId: '1',
      clientId: 'client-device-1',
    });
    expect(grant.addOIDCScope).toHaveBeenCalledWith('openid offline_access');
    expect(grant.addResourceScope).toHaveBeenCalledWith(resource, 'api');
    expect(code).toMatchObject({
      accountId: '1',
      grantId: 'grant-1',
      resource,
      scope: 'openid offline_access api',
    });
    expect(code.authTime).toEqual(expect.any(Number));
    expect(code.save).toHaveBeenCalledTimes(1);
    expect(ctx.body).toMatchObject({
      status: 'complete',
      userCode: 'XGNBCXRZ',
    });
  });

  test('should cancel a pending device code', async () => {
    const code = {
      clientId: 'client-device-1',
      isExpired: false,
      save: vi.fn(),
    };
    const provider = {
      DeviceCode: {
        findByUserCode: vi.fn().mockResolvedValue(code),
      },
      Client: {
        find: vi.fn().mockResolvedValue({
          clientId: 'client-device-1',
        }),
      },
    };
    const service = createService(provider);
    const ctx = createContext('/api/idpOAuth/device/verification:cancel', {
      method: 'POST',
      body: {
        user_code: 'XGNB-CXRZ',
      },
    });

    await handleDeviceVerificationRequest(ctx, service, '/api');

    expect(code).toMatchObject({
      error: 'access_denied',
      errorDescription: 'End-User aborted interaction',
    });
    expect(code.save).toHaveBeenCalledTimes(1);
    expect(ctx.body).toMatchObject({
      status: 'cancelled',
      userCode: 'XGNBCXRZ',
    });
  });
});
