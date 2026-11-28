import { ApiClientError, createApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';

import {
  bindPhone,
  changePhonePurpose,
  getMyVerifiedPhone,
  getVerificationRateLimit,
  issueStepUpToken,
  sendVerificationCode,
} from '@nocobase/app-plugin-verification/client';

describe('verification API', () => {
  it('uses the app API base path and cookie session for all four routes', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const api = createApiClient({ baseURL: '/tenant/main/api', fetch });
    const timing = {
      expiresAt: '2026-11-26T15:05:00Z',
      resendAt: '2026-11-26T15:01:00Z',
    };
    const credential = { token: 'fixture-proof', expiresAt: timing.expiresAt };
    const phone = '+12025550105';
    const oldCode = '123456';
    const newCode = '654321';
    const masked = { phone: '****0105' };
    fetch
      .mockResolvedValueOnce(Response.json({ data: timing }))
      .mockResolvedValueOnce(Response.json({ data: credential }))
      .mockResolvedValueOnce(Response.json({ data: { phone: null } }))
      .mockResolvedValueOnce(Response.json({ data: masked }))
      .mockResolvedValueOnce(Response.json({ data: masked }));

    await expect(
      sendVerificationCode(api, {
        scene: 'stepUp',
        purpose: changePhonePurpose,
      }),
    ).resolves.toEqual(timing);
    await expect(
      issueStepUpToken(api, { purpose: changePhonePurpose, code: oldCode }),
    ).resolves.toEqual(credential);
    const { signal } = new AbortController();
    await expect(getMyVerifiedPhone(api, signal)).resolves.toEqual({
      phone: null,
    });
    await expect(bindPhone(api, { phone, code: newCode })).resolves.toEqual(
      masked,
    );
    await expect(
      bindPhone(api, { phone, code: newCode, token: credential.token }),
    ).resolves.toEqual(masked);

    expect(
      fetch.mock.calls.map(([url, init]) => ({
        url,
        method: init?.method,
        credentials: init?.credentials,
        json: init?.body
          ? (JSON.parse(String(init.body)) as unknown)
          : undefined,
        token: new Headers(init?.headers).get('X-Verification-Token'),
      })),
    ).toEqual([
      {
        url: '/tenant/main/api/verification/codes/send',
        method: 'POST',
        credentials: 'include',
        json: { scene: 'stepUp', purpose: changePhonePurpose },
        token: null,
      },
      {
        url: '/tenant/main/api/verification/stepUpTokens',
        method: 'POST',
        credentials: 'include',
        json: { purpose: changePhonePurpose, code: oldCode },
        token: null,
      },
      {
        url: '/tenant/main/api/verification/me/phone',
        method: 'GET',
        credentials: 'include',
        token: null,
      },
      {
        url: '/tenant/main/api/verification/me/phone',
        method: 'PUT',
        credentials: 'include',
        json: { phone, code: newCode },
        token: null,
      },
      {
        url: '/tenant/main/api/verification/me/phone',
        method: 'PUT',
        credentials: 'include',
        json: { phone, code: newCode },
        token: credential.token,
      },
    ]);
    expect(fetch.mock.calls[2]?.[1]?.signal).toBe(signal);
  });

  it.each([
    [401, 'AUTHENTICATION_REQUIRED'],
    [403, 'VERIFICATION_SESSION_REQUIRED'],
    [429, 'VERIFICATION_SEND_TOO_FREQUENT'],
  ])(
    'preserves structured HTTP %i errors and rate-limit information',
    async (status, reason) => {
      const retryAt = '2026-11-26T15:01:00Z';
      const metadata =
        status === 429 ? { retryAt, retryAfterSeconds: 60 } : undefined;
      const payload = {
        error: {
          code: status,
          domain: 'verification',
          reason,
          message: 'Verification failed',
          ...(metadata ? { metadata } : {}),
        },
      };
      const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
        Response.json(payload, {
          status,
          headers: {
            'x-request-id': 'request-1',
            ...(status === 429 ? { 'Retry-After': '60' } : {}),
          },
        }),
      );
      const api = createApiClient({ baseURL: '/api', fetch });
      const failure = await sendVerificationCode(api, {
        scene: 'bindPhone',
        phone: '+12025550105',
      }).catch((error: unknown) => error);
      expect(failure).toBeInstanceOf(ApiClientError);
      expect(failure).toMatchObject({
        status,
        reason,
        domain: 'verification',
        requestId: 'request-1',
        payload,
      });
      expect(getVerificationRateLimit(failure)).toEqual(
        status === 429 ? { retryAfter: '60', retryAt } : undefined,
      );
      expect(fetch).toHaveBeenCalledOnce();
    },
  );
});
