/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { RemoteSyncError } from '../../RemoteSyncAdapter';
import { RemoteHttpClient, type RemoteHttpRequestConfig, type RemoteHttpRequester } from '../RemoteHttpClient';

describe('RemoteHttpClient', () => {
  it('uses an absolute HTTPS URL, bounded request options, and an authorization header', async () => {
    const captured: RemoteHttpRequestConfig[] = [];
    const requester: RemoteHttpRequester = async <T>(config: RemoteHttpRequestConfig) => {
      captured.push(config);
      return {
        status: 200,
        data: { ok: true } as unknown as T,
        headers: {
          'x-github-request-id': 'request-1',
          'x-ratelimit-reset': '1234',
        },
      };
    };
    const client = createClient(requester);

    await expect(
      client.request<{ ok: boolean }>({
        method: 'GET',
        path: '/repos/nocobase/nocobase?per_page=1',
        credential: 'secret-credential',
        operation: 'probe',
      }),
    ).resolves.toEqual({
      status: 200,
      data: { ok: true },
      requestId: 'request-1',
      rateLimitReset: '1234',
    });

    expect(captured).toEqual([
      expect.objectContaining({
        url: 'https://api.github.com/repos/nocobase/nocobase?per_page=1',
        maxRedirects: 0,
        timeout: 5000,
        maxContentLength: 1024,
        maxBodyLength: 1024,
        headers: {
          Authorization: 'Bearer secret-credential',
        },
      }),
    ]);
  });

  it.each(['//evil.example/path', '/\\evil.example/path'])(
    'rejects a path that can escape the allowed origin: %s',
    (path) => {
      const client = createClient(async <T>() => ({ status: 200, data: {} as unknown as T }));
      expect(captureSyncError(() => client.buildUrl(path))).toMatchObject({
        code: 'CONFIG_INVALID',
        details: { reasonCode: 'origin-not-allowed' },
      });
    },
  );

  it('rejects an absolute URL instead of treating it as a provider path', () => {
    const client = createClient(async <T>() => ({ status: 200, data: {} as unknown as T }));
    expect(captureSyncError(() => client.buildUrl('https://evil.example/path'))).toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'invalid-request-path' },
    });
  });

  it('rejects direct credential headers', async () => {
    const client = createClient(async <T>() => ({ status: 200, data: {} as unknown as T }));
    await expect(
      client.request({
        method: 'GET',
        path: '/rate_limit',
        headers: { authorization: 'Bearer unsafe' },
      }),
    ).rejects.toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'credential-header-rejected' },
    });
    await expect(
      client.request({
        method: 'GET',
        path: '/rate_limit',
        headers: { 'x-api-token': 'unsafe' },
      }),
    ).rejects.toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'credential-header-rejected' },
    });
  });

  it('rejects credentials in URL query parameters', async () => {
    const client = createClient(async <T>() => ({ status: 200, data: {} as unknown as T }));
    await expect(
      client.request({
        method: 'GET',
        path: '/repos/example/demo?access_token=unsafe',
      }),
    ).rejects.toMatchObject({
      code: 'CONFIG_INVALID',
      details: { reasonCode: 'credential-url-rejected' },
    });
  });

  it.each([
    [401, 'AUTH_FAILED', 'auth-failed'],
    [403, 'PERMISSION_DENIED', 'permission-denied'],
    [404, 'REMOTE_NOT_FOUND', 'remote-not-found'],
    [409, 'REMOTE_CHANGED', 'remote-changed'],
    [422, 'UNSAFE_CONTENT', 'content-rejected'],
    [429, 'RATE_LIMITED', 'rate-limited'],
    [503, 'REMOTE_UNAVAILABLE', 'provider-unavailable'],
  ])('maps HTTP %s to a new safe error', async (status, code, reasonCode) => {
    const token = 'github_pat_012345678901234567890123456789';
    const rawError = {
      message: token,
      cause: { token },
      config: { headers: { Authorization: `Bearer ${token}` } },
      request: { body: token },
      response: {
        status,
        data: { token },
        headers: {
          'x-github-request-id': 'request-safe',
        },
      },
    };
    const client = createClient(async () => {
      throw rawError;
    });

    const error = await captureError(() => client.request({ method: 'GET', path: '/repos/example/demo' }));
    expect(error).toBeInstanceOf(RemoteSyncError);
    expect(error).not.toBe(rawError);
    expect(error).toMatchObject({
      code,
      details: {
        provider: 'github',
        reasonCode,
        requestId: 'request-safe',
        httpStatus: status,
      },
    });
    const serialized = JSON.stringify(toResponseBody(error));
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain('cause');
    expect(serialized).not.toContain('headers');
  });

  it('maps whitelist failures without retaining the raw error', async () => {
    const client = createClient(async () => {
      throw new Error('Outbound request is blocked by SERVER_REQUEST_WHITELIST token=unsafe');
    });

    await expect(client.request({ method: 'GET', path: '/repos/example/demo' })).rejects.toMatchObject({
      code: 'REMOTE_UNAVAILABLE',
      details: {
        reasonCode: 'network-blocked',
      },
    });
  });

  it('rebuilds a thrown RemoteSyncError without retaining its message, cause, or unsafe details', async () => {
    const token = 'github_pat_012345678901234567890123456789';
    const rawError = new RemoteSyncError('REMOTE_UNAVAILABLE', token, {
      details: {
        provider: token,
        reasonCode: 'network-error',
        requestId: token,
      },
    });
    Object.assign(rawError, {
      cause: { token },
      config: { headers: { Authorization: token } },
      response: { data: token },
    });
    const client = createClient(async () => {
      throw rawError;
    });

    const error = await captureError(() => client.request({ method: 'GET', path: '/repos/example/demo' }));

    expect(error).toBeInstanceOf(RemoteSyncError);
    expect(error).not.toBe(rawError);
    expect(error).toMatchObject({
      code: 'REMOTE_UNAVAILABLE',
      message: 'Remote provider is unavailable',
      details: { provider: 'github', reasonCode: 'network-error' },
    });
    expect(JSON.stringify(error)).not.toContain(token);
    expect(error).not.toHaveProperty('cause');
    expect(error).not.toHaveProperty('config');
    expect(error).not.toHaveProperty('response');
  });

  it('limits concurrent requests', async () => {
    let active = 0;
    let maximumActive = 0;
    const releases: Array<() => void> = [];
    const requester: RemoteHttpRequester = async <T>() => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise<void>((resolve) => releases.push(resolve));
      active -= 1;
      return { status: 200, data: {} as unknown as T };
    };
    const client = new RemoteHttpClient({
      provider: 'github',
      allowedOrigin: 'https://api.github.com',
      maxConcurrency: 1,
      requester,
    });

    const first = client.request({ method: 'GET', path: '/first' });
    const second = client.request({ method: 'GET', path: '/second' });
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    releases.shift()?.();
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    releases.shift()?.();
    await Promise.all([first, second]);

    expect(maximumActive).toBe(1);
  });
});

function createClient(requester: RemoteHttpRequester): RemoteHttpClient {
  return new RemoteHttpClient({
    provider: 'github',
    allowedOrigin: 'https://api.github.com',
    timeoutMs: 5000,
    maxResponseBytes: 1024,
    requester,
  });
}

async function captureError(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error('Expected operation to fail');
}

function toResponseBody(error: unknown): unknown {
  return error instanceof RemoteSyncError ? error.toResponseBody() : error;
}

function captureSyncError(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error('Expected operation to fail');
}
