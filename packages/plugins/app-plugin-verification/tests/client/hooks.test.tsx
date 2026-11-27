import { ApiClientError } from '@nocobase/app-client';
import {
  AuthenticationProvider,
  authenticationClientToken,
  useAuthentication,
  type AuthClient,
} from '@nocobase/app-plugin-authentication/client';
import {
  changePhonePurpose,
  useBindPhone,
  useIssueStepUpToken,
  useMyVerifiedPhone,
  useSendVerificationCode,
} from '@nocobase/app-plugin-verification/client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { dehydrate, useQueryClient } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const phone = '+12025550105';
const code = '123456';
const token = 'fixture-step-up-proof';
const firstSession = { user: { id: 'first' }, session: { id: 'session-1' } };

async function setup(
  fetch: (request: Request) => Response | Promise<Response>,
  options: { readPhone?: boolean } = {},
) {
  let session: typeof firstSession | null = firstSession;
  function useProbe() {
    return {
      auth: useAuthentication(),
      cache: useQueryClient(),
      send: useSendVerificationCode(),
      issue: useIssueStepUpToken(),
      bind: useBindPhone(),
    };
  }
  let result!: ReturnType<typeof useProbe>;
  let currentPhone: ReturnType<typeof useMyVerifiedPhone> | undefined;
  function ReadPhone() {
    currentPhone = useMyVerifiedPhone();
    return null;
  }
  function Probe() {
    result = useProbe();
    return options.readPhone ? <ReadPhone /> : null;
  }
  await renderWithApp(
    <AuthenticationProvider>
      <Probe />
    </AuthenticationProvider>,
    {
      fetch,
      services(app) {
        app.container.instance(authenticationClientToken, {
          getSession: async () => ({ data: session }),
        } as AuthClient);
      },
    },
  );
  await waitFor(() => expect(result.auth.isPending).toBe(false));
  return {
    result: () => result,
    phone: () => currentPhone,
    // Keep the same query client across session changes to exercise isolation in a host without AuthorizationProvider.
    async change(next: typeof session) {
      session = next;
      await act(() => result.auth.refresh());
    },
  };
}

afterEach(() => vi.restoreAllMocks());

it.each([
  [401, 'AUTHENTICATION_REQUIRED'],
  [403, 'VERIFICATION_SESSION_REQUIRED'],
])(
  'reports HTTP %i from the phone query after a single request',
  async (status, reason) => {
    const payload = {
      error: {
        code: status,
        domain: 'verification',
        reason,
        message: 'A signed-in person is required.',
      },
    };
    const fetch = vi.fn(() =>
      Response.json(payload, {
        status,
        headers: { 'x-request-id': 'phone-request' },
      }),
    );
    const probe = await setup(fetch, { readPhone: true });

    await waitFor(() => expect(probe.phone()?.isError).toBe(true));
    expect(fetch).toHaveBeenCalledOnce();
    const error = probe.phone()?.error;
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      status,
      reason,
      domain: 'verification',
      requestId: 'phone-request',
      payload,
    });
  },
);

it('still retries a transient server error on the phone query', async () => {
  const fetch = vi
    .fn<() => Response>()
    .mockReturnValueOnce(new Response(null, { status: 503 }))
    .mockReturnValueOnce(Response.json({ data: { phone: null } }));
  const probe = await setup(fetch, { readPhone: true });

  await waitFor(() => expect(probe.phone()?.data).toEqual({ phone: null }), {
    timeout: 3000,
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('refreshes the masked phone after binding and changing it, even with a stale read in flight', async () => {
  const started = Promise.withResolvers<AbortSignal>();
  const staleRead = Promise.withResolvers<Response>();
  let masked: string | null = null;
  let reads = 0;
  const fetch = vi.fn(async (request: Request) => {
    if (request.method === 'PUT') {
      const input = (await request.json()) as { phone: string };
      masked = `****${input.phone.slice(-4)}`;
      return Response.json({ data: { phone: masked } });
    }
    if (++reads === 1) {
      started.resolve(request.signal);
      return staleRead.promise;
    }
    return Response.json({ data: { phone: masked } });
  });
  const probe = await setup(fetch, { readPhone: true });
  try {
    const signal = await started.promise;
    expect(probe.phone()?.isLoading).toBe(true);
    await act(async () => {
      await expect(
        probe.result().bind.submit({ phone, code }),
      ).resolves.toEqual({
        phone: '****0105',
      });
    });
    expect(signal.aborted).toBe(true);
    await act(() =>
      staleRead.resolve(Response.json({ data: { phone: null } })),
    );
    await waitFor(() => expect(probe.phone()?.data?.phone).toBe('****0105'));

    await act(async () => {
      await probe.result().bind.submit({ phone: '+12025550106', code, token });
    });
    await waitFor(() => expect(probe.phone()?.data?.phone).toBe('****0106'));
    const writes = fetch.mock.calls
      .map(([request]) => request)
      .filter(({ method }) => method === 'PUT');
    expect(
      writes.map(({ headers }) => headers.get('X-Verification-Token')),
    ).toEqual([null, token]);
  } finally {
    staleRead.resolve(Response.json({ data: { phone: null } }));
  }
});

it('discards a previous account result and cancels its replacement read on sign-out', async () => {
  const secondRead = Promise.withResolvers<Response>();
  const fetch = vi
    .fn<(request: Request) => Response | Promise<Response>>()
    .mockImplementationOnce(() =>
      Response.json({ data: { phone: '****0105' } }),
    )
    .mockImplementationOnce(() => secondRead.promise)
    .mockImplementationOnce(() => Response.json({ data: { phone: null } }));
  const probe = await setup(fetch, { readPhone: true });
  try {
    await waitFor(() => expect(probe.phone()?.data?.phone).toBe('****0105'));
    await probe.change({
      user: { id: 'second' },
      session: { id: 'session-2' },
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(probe.phone()?.data).toBeUndefined();
    expect(probe.phone()?.isPlaceholderData).toBe(false);
    const cache = probe.result().cache;
    await waitFor(() =>
      expect(JSON.stringify(dehydrate(cache))).not.toContain('0105'),
    );

    await probe.change(null);
    expect(fetch.mock.calls[1]?.[0].signal.aborted).toBe(true);
    await act(() =>
      secondRead.resolve(Response.json({ data: { phone: '****0106' } })),
    );
    expect(probe.phone()?.data).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(2);

    await probe.change({ ...firstSession, session: { id: 'session-3' } });
    await waitFor(() => expect(probe.phone()?.data).toEqual({ phone: null }));
    expect(fetch).toHaveBeenCalledTimes(3);
  } finally {
    secondRead.resolve(Response.json({ data: { phone: null } }));
  }
});

it('submits each write once despite retry defaults and preserves network failures', async () => {
  const networkError = new TypeError('Failed to fetch');
  const fetch = vi
    .fn<(request: Request) => Promise<Response>>()
    .mockRejectedValue(networkError);
  const probe = await setup(fetch);
  const { cache, send, issue, bind } = probe.result();
  cache.setDefaultOptions({
    ...cache.getDefaultOptions(),
    mutations: { retry: 3, retryDelay: 0 },
  });
  await act(async () => {
    await expect(send.submit({ scene: 'bindPhone', phone })).rejects.toBe(
      networkError,
    );
    await expect(
      issue.submit({ purpose: changePhonePurpose, code }),
    ).rejects.toBe(networkError);
    await expect(bind.submit({ phone, code, token })).rejects.toBe(
      networkError,
    );
  });
  expect(
    fetch.mock.calls.map(([request]) => new URL(request.url).pathname),
  ).toEqual([
    '/api/verification/codes/send',
    '/api/verification/stepUpTokens',
    '/api/verification/me/phone',
  ]);
  const { send: sent, issue: issued, bind: bound } = probe.result();
  for (const action of [sent, issued, bound]) {
    expect(action.error).toBe(networkError);
    expect(action.isPending).toBe(false);
    expect(action.isSuccess).toBe(false);
  }
  act(() => sent.reset());
  expect(probe.result().send.error).toBeUndefined();
  await probe.change(null);
  expect(probe.result().bind.error).toBeUndefined();
  expect(probe.result().issue.error).toBeUndefined();
});

it('keeps code and credential out of hook state, caches, storage and logs', async () => {
  const answer = Promise.withResolvers<Response>();
  const fetch = vi
    .fn<(request: Request) => Promise<Response>>()
    .mockReturnValue(answer.promise);
  const probe = await setup(fetch);
  const storage = vi.spyOn(Storage.prototype, 'setItem');
  const logs = [
    vi.spyOn(console, 'debug'),
    vi.spyOn(console, 'log'),
    vi.spyOn(console, 'info'),
    vi.spyOn(console, 'warn'),
    vi.spyOn(console, 'error'),
  ];
  const credential = { token, expiresAt: '2026-11-26T15:05:00Z' };
  let result!: ReturnType<ReturnType<typeof useIssueStepUpToken>['submit']>;
  try {
    act(() => {
      result = probe
        .result()
        .issue.submit({ purpose: changePhonePurpose, code });
    });
    expect(probe.result().issue.isPending).toBe(true);
    expect(probe.result().cache.getMutationCache().getAll()).toEqual([]);
    await act(async () => {
      answer.resolve(Response.json({ data: credential }));
      await expect(result).resolves.toEqual(credential);
    });
    expect(probe.result().issue).toMatchObject({
      isSuccess: true,
      isPending: false,
    });
    expect(probe.result().cache.getMutationCache().getAll()).toEqual([]);
    const retained = JSON.stringify({
      action: probe.result().issue,
      cache: dehydrate(probe.result().cache),
      storage: storage.mock.calls,
      logs: logs.flatMap((log) => log.mock.calls),
      url: fetch.mock.calls[0]?.[0].url,
    });
    expect(retained).not.toContain(code);
    expect(retained).not.toContain(token);
    await probe.change(null);
    expect(probe.result().issue.isSuccess).toBe(false);
  } finally {
    answer.resolve(Response.json({ data: credential }));
  }
});
