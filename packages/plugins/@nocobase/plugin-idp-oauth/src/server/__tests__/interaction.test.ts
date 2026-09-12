/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { handleInteractionGet, handleInteractionPost } from '../interaction';

describe('plugin-idp-oauth > interaction', () => {
  const createCtx = () =>
    ({
      req: {},
      res: {},
      request: {},
      throw: vi.fn((status: number, message: string) => {
        const error = new Error(message) as Error & { status?: number };
        error.status = status;
        throw error;
      }),
    }) as any;

  const createService = () =>
    ({
      getProviderContext: vi.fn().mockReturnValue({
        origin: 'https://main.example.com',
        issuerPath: '/api',
        issuer: 'https://main.example.com/api',
        appName: 'main',
      }),
      resolveInteractionSessionUser: vi.fn(),
    }) as any;

  const createSessionNotFoundError = () =>
    Object.assign(new Error('invalid_request'), {
      name: 'SessionNotFound',
      error: 'invalid_request',
      error_description: 'interaction session id cookie not found',
    });

  test('returns invalid request when interaction session is missing', async () => {
    const ctx = createCtx();
    const provider = {
      interactionDetails: vi.fn().mockRejectedValue(createSessionNotFoundError()),
    } as any;
    const service = createService();

    await handleInteractionGet(ctx, provider, { id: 1 }, service);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      error: 'invalid_request',
      error_description: 'The authorization request has expired or is no longer available.',
    });
  });

  test('returns invalid request when posting to a missing interaction session', async () => {
    const ctx = createCtx();
    const provider = {
      interactionDetails: vi.fn().mockRejectedValue(createSessionNotFoundError()),
    } as any;
    const service = createService();

    await handleInteractionPost(ctx, provider, { id: 1 }, service);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      error: 'invalid_request',
      error_description: 'The authorization request has expired or is no longer available.',
    });
  });

  test('auto completes consent for reserved app clients', async () => {
    const ctx = createCtx();
    const grant = {
      addOIDCScope: vi.fn(),
      addOIDCClaims: vi.fn(),
      addResourceScope: vi.fn(),
      save: vi.fn().mockResolvedValue('grant-1'),
    };
    const provider = {
      interactionDetails: vi.fn().mockResolvedValue({
        prompt: {
          name: 'consent',
          details: {
            missingOIDCScope: ['openid'],
          },
        },
        params: {
          client_id: 'app:alpha',
        },
      }),
      interactionResult: vi.fn().mockResolvedValue('/idpOAuth/auth/redirect'),
      Client: {
        find: vi.fn().mockResolvedValue({
          clientId: 'app:alpha',
        }),
      },
      Grant: vi.fn(() => grant),
    } as any;
    const service = createService();

    await handleInteractionGet(ctx, provider, { id: 1 }, service);

    expect(provider.Grant).toHaveBeenCalledWith({
      accountId: '1',
      clientId: 'app:alpha',
    });
    expect(grant.addOIDCScope).toHaveBeenCalledWith('openid');
    expect(provider.interactionResult).toHaveBeenCalledWith(
      ctx.req,
      ctx.res,
      {
        consent: {
          grantId: 'grant-1',
        },
      },
      {
        mergeWithLastSubmission: true,
      },
    );
    expect(ctx.body).toEqual({
      redirectTo: '/api/idpOAuth/auth/redirect',
    });
  });

  test('auto completes login with consent grant for reserved app clients', async () => {
    const ctx = createCtx();
    const grant = {
      addOIDCScope: vi.fn(),
      addOIDCClaims: vi.fn(),
      addResourceScope: vi.fn(),
      save: vi.fn().mockResolvedValue('grant-1'),
    };
    const provider = {
      interactionDetails: vi.fn().mockResolvedValue({
        prompt: {
          name: 'login',
          details: {},
        },
        params: {
          client_id: 'app:alpha',
          scope: 'openid profile email',
        },
      }),
      interactionResult: vi.fn().mockResolvedValue('/idpOAuth/auth/redirect'),
      Grant: vi.fn(() => grant),
    } as any;
    const service = createService();

    await handleInteractionGet(ctx, provider, { id: 1 }, service);

    expect(provider.Grant).toHaveBeenCalledWith({
      accountId: '1',
      clientId: 'app:alpha',
    });
    expect(grant.addOIDCScope).toHaveBeenCalledWith('openid profile email');
    expect(provider.interactionResult).toHaveBeenCalledWith(
      ctx.req,
      ctx.res,
      {
        login: {
          accountId: '1',
        },
        consent: {
          grantId: 'grant-1',
        },
      },
      {
        mergeWithLastSubmission: false,
      },
    );
    expect(ctx.body).toEqual({
      redirectTo: '/api/idpOAuth/auth/redirect',
    });
  });

  test('keeps consent prompt for regular clients', async () => {
    const ctx = createCtx();
    const provider = {
      interactionDetails: vi.fn().mockResolvedValue({
        prompt: {
          name: 'consent',
          details: {
            missingOIDCScope: ['openid'],
          },
        },
        params: {
          client_id: 'client-1',
        },
      }),
      Client: {
        find: vi.fn().mockResolvedValue({
          clientId: 'client-1',
          clientName: 'Client 1',
        }),
      },
    } as any;
    const service = createService();

    await handleInteractionGet(ctx, provider, { id: 1 }, service);

    expect(ctx.body).toEqual({
      prompt: 'consent',
      clientName: 'Client 1',
      details: 'openid',
    });
  });
});
