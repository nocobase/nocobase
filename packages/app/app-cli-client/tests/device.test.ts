// Signing in through the browser against Better Auth's device authorization (RFC 8628), with a recorded fetch.
import { describe, expect, it } from 'vitest';

import { credentialHeaders } from '../src/lib/credentials.ts';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  browserOpener,
  cliUserAgent,
  pollDeviceAuthorization,
  startDeviceAuthorization,
  type DeviceAuthorization,
} from '../src/lib/device.ts';
import { AppApiError } from '../src/lib/http.ts';

interface Recorded {
  readonly url: string;
  readonly body: Record<string, string>;
  readonly userAgent: string | null;
}

function server(answers: { status: number; body: unknown }[]): {
  calls: Recorded[];
  fetch: typeof fetch;
} {
  const calls: Recorded[] = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({
      url: String(input),
      body: JSON.parse(String(init?.body)) as Record<string, string>,
      userAgent: headers.get('user-agent'),
    });
    const answer = answers.shift() ?? { status: 500, body: {} };
    return new Response(JSON.stringify(answer.body), {
      status: answer.status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  return { calls, fetch: fetcher };
}

const started: DeviceAuthorization = {
  deviceCode: 'device-1',
  userCode: 'WXYZ2345',
  verificationUri: 'https://acme.example.com/main/device',
  verificationUriComplete:
    'https://acme.example.com/main/device?user_code=WXYZ2345',
  expiresIn: 600,
  interval: 5,
};

describe('the device authorization', () => {
  it('asks for a code below the base path with the client id and the machine', async () => {
    const { calls, fetch } = server([
      {
        status: 200,
        body: {
          device_code: 'device-1',
          user_code: 'WXYZ2345',
          verification_uri: '/main/device',
          verification_uri_complete: '/main/device?user_code=WXYZ2345',
          expires_in: 600,
          interval: 5,
        },
      },
    ]);
    const userAgent = cliUserAgent({ bin: 'acme', version: '1.2.3' }, 'ada');
    expect(userAgent).toMatch(/^acme\/1\.2\.3 \(ada; /u);
    const answer = await startDeviceAuthorization(
      'https://acme.example.com/main',
      { clientId: 'acme' },
      { fetch, userAgent },
    );
    expect(calls).toEqual([
      {
        url: 'https://acme.example.com/main/api/auth/device/code',
        body: { client_id: 'acme' },
        userAgent,
      },
    ]);
    expect(answer).toEqual(started);
  });

  it('polls through authorization_pending and slow_down to the session token', async () => {
    const { calls, fetch } = server([
      { status: 400, body: { error: 'authorization_pending' } },
      { status: 400, body: { error: 'slow_down' } },
      {
        status: 200,
        body: {
          access_token: 'session-token',
          token_type: 'Bearer',
          expires_in: 604800,
        },
      },
    ]);
    const waits: number[] = [];
    const issued = await pollDeviceAuthorization(
      'https://acme.example.com/main',
      {},
      started,
      {
        fetch,
        sleep: (ms) => {
          waits.push(ms);
          return Promise.resolve();
        },
      },
    );
    expect(issued).toEqual({ token: 'session-token', expiresIn: 604800 });
    expect(waits).toEqual([5000, 5000, 10000]);
    expect(calls[0]).toMatchObject({
      url: 'https://acme.example.com/main/api/auth/device/token',
      body: {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: 'device-1',
        client_id: 'nocobase-cli',
      },
    });
  });

  it('stops on access_denied and expired_token', async () => {
    for (const error of ['access_denied', 'expired_token']) {
      const { fetch } = server([{ status: 400, body: { error } }]);
      const failure = await pollDeviceAuthorization(
        'https://acme.example.com',
        {},
        started,
        { fetch, sleep: () => Promise.resolve() },
      ).catch((caught: unknown) => caught);
      expect(failure).toBeInstanceOf(AppApiError);
      expect((failure as AppApiError).reason).toBe(error.toUpperCase());
    }
  });

  it('sends a session token as Bearer and an API key as x-api-key', () => {
    expect(credentialHeaders({ key: 't', kind: 'session' })).toEqual({
      authorization: 'Bearer t',
    });
    expect(credentialHeaders({ key: 'k', kind: 'apiKey' })).toEqual({
      'x-api-key': 'k',
    });
  });
});

describe('browserOpener', () => {
  const bin = mkdtempSync(path.join(os.tmpdir(), 'opener-'));
  const wwwBrowser = path.join(bin, 'www-browser');
  writeFileSync(wwwBrowser, '#!/bin/sh\n');
  chmodSync(wwwBrowser, 0o755);

  it('opens nothing over SSH on macOS', () => {
    expect(browserOpener('darwin', { SSH_CONNECTION: '1 2 3 4' })).toBe(
      undefined,
    );
    expect(browserOpener('darwin', {})?.file).toBe('open');
  });

  it('opens nothing on Linux without a display', () => {
    expect(browserOpener('linux', { PATH: bin })).toBe(undefined);
  });

  it('takes the first opener on the PATH, and none when there is none', () => {
    expect(browserOpener('linux', { PATH: bin, DISPLAY: ':0' })?.file).toBe(
      wwwBrowser,
    );
    expect(
      browserOpener('linux', { PATH: path.join(bin, 'none'), DISPLAY: ':0' }),
    ).toBe(undefined);
  });
});
