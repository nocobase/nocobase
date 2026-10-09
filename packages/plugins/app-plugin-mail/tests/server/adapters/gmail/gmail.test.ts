import type {
  MailCredentialVault,
  MailProviderAdapter,
  MailProviderContext,
  MailProviderDefinition,
} from '../../../../server/types.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  gmailRequest,
  responseError,
} from '../../../../server/adapters/gmail/http.js';
import {
  GmailMailProviderAdapter,
  gmailMailProviderDefinition,
  type GmailMailProviderConfig,
} from '../../../../server/adapters/gmail/index.js';

describe('Gmail HTTP errors', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each(['rateLimitExceeded', 'userRateLimitExceeded'])(
    'treats Gmail 403 %s as a retryable rate limit, not an OAuth failure',
    async (reason) => {
      const response = Response.json(
        {
          error: {
            errors: [{ domain: 'usageLimits', reason }],
            message: 'Rate limit exceeded',
          },
        },
        { status: 403, headers: { 'retry-after': '7' } },
      );

      await expect(responseError('GMAIL', response)).resolves.toMatchObject({
        category: 'rate_limit',
        retryable: true,
        retryAfterMs: 7_000,
        reasonCode:
          reason === 'rateLimitExceeded'
            ? 'gmailRateLimitExceeded'
            : 'gmailUserRateLimitExceeded',
      });
    },
  );

  it.each(['dailyLimitExceeded', 'domainPolicy', 'unrecognizedReason'])(
    'does not mark Gmail 403 %s as an OAuth failure',
    async (reason) => {
      const response = Response.json(
        {
          error: {
            errors: [{ domain: 'global', reason }],
            message: 'Request forbidden',
          },
        },
        { status: 403 },
      );

      const result = await responseError('GMAIL', response);
      expect(result).toMatchObject({ category: 'provider', retryable: false });
      if (reason === 'dailyLimitExceeded')
        expect(result.reasonCode).toBe('gmailDailyLimitExceeded');
      else if (reason === 'domainPolicy')
        expect(result.reasonCode).toBe('gmailDomainPolicy');
      else expect(result).not.toHaveProperty('reasonCode');
    },
  );

  it('keeps 401 invalid credentials as a terminal authentication error', async () => {
    const response = Response.json(
      {
        error: {
          errors: [{ domain: 'global', reason: 'authError' }],
          message: 'Invalid Credentials',
        },
      },
      { status: 401 },
    );

    await expect(responseError('GMAIL', response)).resolves.toMatchObject({
      category: 'authentication',
      retryable: false,
      reasonCode: 'gmailAuthError',
    });
  });

  it('keeps a 403 missing-scope response as an authentication error', async () => {
    const response = Response.json(
      {
        error: {
          errors: [{ domain: 'global', reason: 'insufficientPermissions' }],
          message: 'Request had insufficient authentication scopes.',
        },
      },
      { status: 403 },
    );

    await expect(responseError('GMAIL', response)).resolves.toMatchObject({
      category: 'authentication',
      retryable: false,
      reasonCode: 'gmailInsufficientPermissions',
    });
  });

  it('keeps a 403 authError response as an authentication error', async () => {
    const response = Response.json(
      { error: { errors: [{ reason: 'authError' }] } },
      { status: 403 },
    );

    await expect(responseError('GMAIL', response)).resolves.toMatchObject({
      category: 'authentication',
      retryable: false,
      reasonCode: 'gmailAuthError',
    });
  });

  it('identifies a disabled Gmail API as a configuration problem', async () => {
    const response = Response.json(
      { error: { errors: [{ reason: 'accessNotConfigured' }] } },
      { status: 403 },
    );

    await expect(responseError('GMAIL', response)).resolves.toMatchObject({
      category: 'provider',
      retryable: false,
      reasonCode: 'gmailApiNotEnabled',
    });
  });

  it('treats a 401 without a reason as an authorization failure', async () => {
    const response = Response.json({ error: 'invalid_token' }, { status: 401 });

    await expect(responseError('GMAIL', response)).resolves.toMatchObject({
      category: 'authentication',
      retryable: false,
      code: 'GMAIL_HTTP_401',
    });
  });

  it('handles malformed 403 responses without assuming OAuth failure', async () => {
    const response = new Response('{invalid-json', { status: 403 });

    const error = await responseError('GMAIL', response);
    expect(error).toMatchObject({
      category: 'provider',
      retryable: false,
      code: 'GMAIL_HTTP_403',
    });
    expect(error).not.toHaveProperty('reasonCode');
  });

  it('honors Retry-After values expressed in seconds on a 429', async () => {
    const response = Response.json(
      { error: { message: 'Too many requests' } },
      { status: 429, headers: { 'retry-after': '3' } },
    );

    await expect(responseError('GMAIL', response)).resolves.toMatchObject({
      category: 'rate_limit',
      retryable: true,
      retryAfterMs: 3_000,
    });
  });

  it.each([500, 502, 503, 504])(
    'treats Gmail %s as a retryable provider failure',
    async (status) => {
      const response = Response.json(
        { error: { message: 'Temporary provider failure' } },
        { status },
      );

      await expect(responseError('GMAIL', response)).resolves.toMatchObject({
        category: 'provider',
        retryable: true,
        code: `GMAIL_HTTP_${status}`,
      });
    },
  );

  it.each([
    ['network outage', new TypeError('fetch failed'), 'network'],
    [
      'request timeout',
      new DOMException('Timed out', 'TimeoutError'),
      'timeout',
    ],
  ] as const)('classifies a %s', async (_name, cause, category) => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(cause));

    await expect(
      gmailRequest(config(), 'access-1', '/users/me/profile', {
        method: 'GET',
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: 'GMAIL_REQUEST_FAILED',
        category,
        retryable: true,
      },
    });
  });

  it('honors Retry-After values expressed as an HTTP date', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const response = Response.json(
      { error: { message: 'Rate limit exceeded' } },
      {
        status: 429,
        headers: { 'retry-after': 'Thu, 01 Jan 2026 00:00:07 GMT' },
      },
    );

    await expect(responseError('GMAIL', response)).resolves.toMatchObject({
      category: 'rate_limit',
      retryable: true,
      retryAfterMs: 7_000,
    });
  });

  it('reads rate-limit reasons from Google RPC error details', async () => {
    const response = Response.json(
      {
        error: {
          details: [{ reason: 'userRateLimitExceeded' }],
          message: 'User rate limit exceeded',
        },
      },
      { status: 403 },
    );

    await expect(responseError('GMAIL', response)).resolves.toMatchObject({
      category: 'rate_limit',
      retryable: true,
      reasonCode: 'gmailUserRateLimitExceeded',
    });
  });
});

describe('Gmail Mail Provider', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('satisfies the Mail core Provider compatibility contract', async () => {
    const adapter = await gmailMailProviderDefinition.createAdapter(
      context(memoryVault()),
      config(),
      account(),
    );
    expectMailProviderCompatibility(gmailMailProviderDefinition, adapter);
  });

  it('uses PKCE and stores OAuth tokens behind a credential reference', async () => {
    const credentials = memoryVault();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          access_token: 'access-1',
          refresh_token: 'refresh-1',
          expires_in: 3600,
          scope: 'gmail.modify gmail.send',
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ emailAddress: 'user@example.com', historyId: '10' }),
      )
      .mockResolvedValueOnce(
        Response.json({
          sendAs: [
            {
              sendAsEmail: 'user@example.com',
              displayName: 'Example User',
              signature: '<p>Regards</p>',
              isPrimary: true,
              verificationStatus: 'accepted',
            },
            {
              sendAsEmail: 'alias@example.com',
              verificationStatus: 'accepted',
            },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const authorization = gmailMailProviderDefinition.authorization;
    if (!authorization) throw new Error('Gmail authorization is missing.');

    const started = await authorization.start(context(credentials), config(), {
      redirectUri: 'https://example.com/main/mail/oauth/callback',
      state: 'state-1',
      codeChallenge: 'challenge-1',
    });
    expect(started.ok).toBe(true);
    const url = new URL(started.ok ? started.value.authorizationUrl : '');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('code_challenge')).toBe('challenge-1');

    const completed = await authorization.complete(
      context(credentials),
      config(),
      {
        redirectUri: 'https://example.com/main/mail/oauth/callback',
        state: 'state-1',
        code: 'code-1',
        codeVerifier: 'verifier-1',
        scopes: [],
      },
    );
    expect(completed).toMatchObject({
      ok: true,
      value: {
        address: 'user@example.com',
        identities: [
          expect.objectContaining({
            address: 'user@example.com',
            signatureText: 'Regards',
          }),
          expect.objectContaining({ address: 'alias@example.com' }),
        ],
      },
    });
    expect(String(fetchMock.mock.calls[0][1]?.body)).toContain(
      'code_verifier=verifier-1',
    );
    expect([...credentials.values.values()][0]).toMatchObject({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
  });

  it('starts initial sync from the mailbox history ID without intersecting every Gmail label', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ historyId: '20' }))
      .mockResolvedValueOnce(Response.json({ messages: [] }));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    await expect(adapter.getCurrentSyncCursor()).resolves.toMatchObject({
      ok: true,
      value: {
        value: { historyId: '20', capturedAt: expect.any(String) },
        version: 'gmail-v1',
      },
    });
    await expect(
      adapter.listMessages({
        providerFolderIds: ['INBOX', 'SENT', 'CATEGORY_SOCIAL'],
        limit: 100,
        receivedAfter: '2026-09-01T00:00:00.000Z',
      }),
    ).resolves.toMatchObject({ ok: true, value: { messages: [] } });

    const baselineUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(baselineUrl.pathname).toBe('/gmail/v1/users/me/profile');
    const listUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(listUrl.searchParams.getAll('labelIds')).toEqual([]);
    expect(listUrl.searchParams.get('includeSpamTrash')).toBe('true');
  });

  it('sends MIME content and preserves the original history cursor while paging', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ id: 'sent-1' }))
      .mockResolvedValueOnce(
        Response.json({
          history: [{ messagesAdded: [{ message: { id: 'message-1' } }] }],
          historyId: '20',
          nextPageToken: 'next-history-page',
        }),
      )
      .mockResolvedValueOnce(
        gmailBatchResponse([
          {
            id: 'message-1',
            message: {
              id: 'message-1',
              labelIds: ['INBOX'],
              payload: {
                mimeType: 'text/plain',
                headers: [{ name: 'Subject', value: 'Synced' }],
                body: { data: Buffer.from('Body').toString('base64url') },
              },
            },
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    await expect(
      adapter.sendMessage({
        trackingId: 'submission-1',
        identity: {
          id: 'identity-1',
          accountId: 'account-1',
          address: 'user@example.com',
          isPrimary: true,
          canSend: true,
        },
        message: {
          to: [{ address: 'recipient@example.com' }],
          cc: [],
          bcc: [],
          subject: 'Hello',
          text: 'Mail body',
          attachments: [
            {
              fileName: 'report.txt',
              contentType: 'text/plain',
              size: 6,
              inline: false,
              open: async () => new Blob(['report']).stream(),
            },
          ],
          references: [],
        },
      }),
    ).resolves.toEqual({
      status: 'accepted',
      providerMessageId: 'sent-1',
    });
    const sendBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as {
      raw: string;
    };
    expect(Buffer.from(sendBody.raw, 'base64url').toString()).toContain(
      'Subject: Hello',
    );
    const mime = Buffer.from(sendBody.raw, 'base64url').toString();
    expect(mime).toContain('Content-Type: multipart/mixed');
    expect(mime).toContain('filename="report.txt"');
    expect(mime).toContain(Buffer.from('report').toString('base64'));

    const changes = await adapter.listChanges({
      cursor: { value: { historyId: '10' }, version: 'gmail-v1' },
      limit: 100,
    });
    expect(changes).toMatchObject({
      ok: true,
      value: {
        messages: [{ providerMessageId: 'message-1', text: 'Body' }],
        nextCursor: {
          value: { historyId: '10', pageToken: 'next-history-page' },
        },
        hasMore: true,
      },
    });
  });

  it('retains a malformed message as a retryable record while importing healthy siblings', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const url = String(input);
        if (url.includes('/batch/'))
          return gmailBatchResponse([
            {
              id: 'bad',
              message: {
                id: 'bad',
                labelIds: ['INBOX'],
                payload: { parts: {} },
              },
            },
            {
              id: 'good',
              message: {
                id: 'good',
                payload: {
                  headers: [{ name: 'Subject', value: 'Healthy' }],
                },
              },
            },
          ]);
        if (url.includes('format=metadata'))
          return Response.json({
            id: 'bad',
            labelIds: ['INBOX'],
            payload: { headers: [{ name: 'Subject', value: 'Incomplete' }] },
          });
        if (url.includes('/bad?'))
          return Response.json({ id: 'bad', payload: { parts: {} } });
        if (url.includes('/good?'))
          return Response.json({
            id: 'good',
            payload: { headers: [{ name: 'Subject', value: 'Healthy' }] },
          });
        return Response.json({ messages: [{ id: 'bad' }, { id: 'good' }] });
      }),
    );
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );
    await expect(
      adapter.listMessages({
        limit: 100,
        receivedAfter: '2026-09-01T00:00:00.000Z',
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        messages: [
          {
            providerMessageId: 'bad',
            subject: 'Incomplete',
            contentStatus: 'failed',
          },
          { providerMessageId: 'good', subject: 'Healthy' },
        ],
      },
    });
  });

  it('requests a full rescan when history expires instead of advancing the cursor', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { error: { message: 'History expired' } },
          { status: 404 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );
    await expect(
      adapter.listChanges({
        cursor: { version: 'gmail-v1', value: { historyId: '20' } },
        limit: 100,
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: 'GMAIL_SYNC_CURSOR_INVALID' },
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('keeps a rejected token refresh as a terminal authentication error', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'expired-access',
      refreshToken: 'revoked-refresh',
      expiresAt: '2000-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json(
            { error: 'invalid_grant', error_description: 'Token was revoked.' },
            { status: 400 },
          ),
        ),
    );
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    const result = await adapter.sendMessage({
      trackingId: 'submission-auth-failure',
      identity: {
        id: 'identity-1',
        accountId: 'account-1',
        address: 'user@example.com',
        isPrimary: true,
        canSend: true,
      },
      message: {
        to: [{ address: 'recipient@example.com' }],
        cc: [],
        bcc: [],
        subject: 'Hello',
        text: 'Mail body',
        attachments: [],
        references: [],
      },
    });

    expect(result).toMatchObject({
      status: 'failed',
      error: { category: 'authentication', retryable: false },
    });
  });

  it('reports a Provider 5xx after submission as unknown', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json(
            { error: { message: 'Backend unavailable' } },
            { status: 503 },
          ),
        ),
    );
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    await expect(
      adapter.sendMessage({
        trackingId: 'submission-unknown',
        identity: {
          id: 'identity-1',
          accountId: 'account-1',
          address: 'user@example.com',
          isPrimary: true,
          canSend: true,
        },
        message: {
          to: [{ address: 'recipient@example.com' }],
          cc: [],
          bcc: [],
          subject: 'Hello',
          text: 'Mail body',
          attachments: [],
          references: [],
        },
      }),
    ).resolves.toMatchObject({
      status: 'submission_unknown',
      error: { code: 'GMAIL_HTTP_503', retryable: false },
    });
  });

  it('reports attachment preparation failures before submission as failed', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    await expect(
      adapter.sendMessage({
        trackingId: 'submission-preparation-failed',
        identity: {
          id: 'identity-1',
          accountId: 'account-1',
          address: 'user@example.com',
          isPrimary: true,
          canSend: true,
        },
        message: {
          to: [{ address: 'recipient@example.com' }],
          cc: [],
          bcc: [],
          subject: 'Hello',
          text: 'Mail body',
          attachments: [
            {
              fileName: 'broken.txt',
              contentType: 'text/plain',
              size: 1,
              inline: false,
              open: async () => {
                throw new Error('Attachment unavailable');
              },
            },
          ],
          references: [],
        },
      }),
    ).resolves.toMatchObject({
      status: 'failed',
      error: {
        code: 'GMAIL_MESSAGE_PREPARATION_FAILED',
        retryable: false,
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends replies in the existing Gmail thread with RFC reply headers', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ id: 'reply-1' }));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    await adapter.sendMessage({
      trackingId: 'submission-reply',
      identity: {
        id: 'identity-1',
        accountId: 'account-1',
        address: 'user@example.com',
        isPrimary: true,
        canSend: true,
      },
      message: {
        to: [{ address: 'recipient@example.com' }],
        cc: [],
        bcc: [],
        subject: 'Re: Original',
        text: 'Reply body',
        attachments: [],
        inReplyTo: '<parent@example.com>',
        references: ['<root@example.com>', '<parent@example.com>'],
        providerConversationId: 'thread-1',
      },
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as {
      raw: string;
      threadId?: string;
    };
    const mime = Buffer.from(body.raw, 'base64url').toString('utf8');
    expect(body.threadId).toBe('thread-1');
    expect(mime).toContain('In-Reply-To: <parent@example.com>');
    expect(mime).toContain(
      'References: <root@example.com> <parent@example.com>',
    );
  });

  it.each([false, true])(
    'forwards the original Gmail body and attachments',
    async (forwardBodyIncluded) => {
      const credentials = memoryVault();
      await credentials.putAt('credential-1', {
        provider: 'gmail',
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresAt: '2099-01-01T00:00:00.000Z',
        scopes: [],
        tokenType: 'Bearer',
      });
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          Response.json({
            id: 'source-message-1',
            labelIds: ['INBOX'],
            payload: {
              headers: [
                { name: 'From', value: 'Alice <alice@example.com>' },
                { name: 'To', value: 'user@example.com' },
                { name: 'Subject', value: 'Original' },
              ],
              parts: [
                {
                  mimeType: 'text/plain',
                  body: {
                    data: Buffer.from('Original body').toString('base64url'),
                  },
                },
                {
                  mimeType: 'text/plain',
                  filename: 'notes.txt',
                  body: { attachmentId: 'attachment-1', size: 5 },
                },
              ],
            },
          }),
        )
        .mockResolvedValueOnce(
          Response.json({
            data: Buffer.from('notes').toString('base64url'),
            size: 5,
          }),
        )
        .mockResolvedValueOnce(Response.json({ id: 'forwarded-message-1' }));
      vi.stubGlobal('fetch', fetchMock);
      const adapter = new GmailMailProviderAdapter(
        context(credentials),
        config(),
        account(),
      );

      await expect(
        adapter.sendMessage({
          trackingId: 'submission-forward',
          identity: {
            id: 'identity-1',
            accountId: 'account-1',
            address: 'user@example.com',
            isPrimary: true,
            canSend: true,
          },
          message: {
            to: [{ address: 'recipient@example.com' }],
            cc: [],
            bcc: [],
            subject: 'Fwd: Original',
            text: forwardBodyIncluded
              ? 'Edited forwarded content'
              : 'Please review',
            forwardBodyIncluded,
            attachments: [],
            references: [],
            forwardOfProviderMessageId: 'source-message-1',
          },
        }),
      ).resolves.toMatchObject({
        status: 'accepted',
        providerMessageId: 'forwarded-message-1',
      });
      const body = JSON.parse(String(fetchMock.mock.calls[2][1]?.body)) as {
        raw: string;
      };
      const mime = Buffer.from(body.raw, 'base64url').toString('utf8');
      if (forwardBodyIncluded) {
        expect(mime).toContain('Edited forwarded content');
        expect(mime).not.toContain('Original body');
      } else {
        expect(mime).toContain('Original body');
      }
      expect(mime).toContain('notes.txt');
      expect(mime).toContain(Buffer.from('notes').toString('base64'));
    },
  );

  it('sends a saved forward draft without appending the source again', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const draftMessage = (id: string) => ({
      id,
      labelIds: ['DRAFT'],
      payload: {
        headers: [{ name: 'Subject', value: 'Fwd: Original' }],
        body: { data: Buffer.from('Already prepared').toString('base64url') },
      },
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(draftMessage('draft-message-1')))
      .mockResolvedValueOnce(
        Response.json({
          id: 'draft-resource-1',
          message: { id: 'draft-message-2', threadId: 'thread-1' },
        }),
      )
      .mockResolvedValueOnce(Response.json(draftMessage('draft-message-2')))
      .mockResolvedValueOnce(Response.json({ id: 'sent-message-1' }));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    await expect(
      adapter.sendMessage({
        trackingId: 'submission-forward-draft',
        identity: {
          id: 'identity-1',
          accountId: 'account-1',
          address: 'user@example.com',
          isPrimary: true,
          canSend: true,
        },
        message: {
          to: [{ address: 'recipient@example.com' }],
          cc: [],
          bcc: [],
          subject: 'Fwd: Original',
          text: 'Already prepared',
          attachments: [],
          references: [],
          draftProviderMessageId: 'draft-message-1',
          draftProviderDraftId: 'draft-resource-1',
          forwardOfProviderMessageId: 'source-message-1',
        },
      }),
    ).resolves.toMatchObject({
      status: 'accepted',
      providerMessageId: 'sent-message-1',
    });
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes('source-message-1'),
      ),
    ).toBe(false);
  });

  it('reports draft attachment preparation failures before sending as failed', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      Response.json({
        id: 'draft-message-1',
        labelIds: ['DRAFT'],
        payload: { headers: [], body: {} },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    await expect(
      adapter.sendMessage({
        trackingId: 'submission-draft-preparation-failed',
        identity: {
          id: 'identity-1',
          accountId: 'account-1',
          address: 'user@example.com',
          isPrimary: true,
          canSend: true,
        },
        message: {
          to: [{ address: 'recipient@example.com' }],
          cc: [],
          bcc: [],
          subject: 'Draft',
          text: 'Draft body',
          attachments: [
            {
              fileName: 'broken.txt',
              contentType: 'text/plain',
              size: 1,
              inline: false,
              open: async () => {
                throw new Error('Attachment unavailable');
              },
            },
          ],
          references: [],
          draftProviderMessageId: 'draft-message-1',
          draftProviderDraftId: 'draft-resource-1',
        },
      }),
    ).resolves.toMatchObject({
      status: 'failed',
      error: {
        code: 'GMAIL_MESSAGE_PREPARATION_FAILED',
        retryable: false,
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).not.toContain('/drafts/send');
  });

  it('creates a Gmail draft and returns a normalized draft message', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        id: 'draft-resource-1',
        message: { id: 'draft-message-1', threadId: 'thread-1' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    await expect(
      adapter.saveDraft({
        trackingId: 'draft-1',
        identity: {
          id: 'identity-1',
          accountId: 'account-1',
          address: 'user@example.com',
          isPrimary: true,
          canSend: true,
        },
        message: {
          to: [{ address: 'recipient@example.com' }],
          cc: [],
          bcc: [],
          subject: 'Draft subject',
          text: 'Draft body',
          attachments: [],
          references: [],
        },
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        providerMessageId: 'draft-message-1',
        draft: true,
        providerFolderIds: ['DRAFT'],
      },
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain('/users/me/drafts');
  });

  it('updates an existing Gmail draft', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        id: 'draft-resource-1',
        message: { id: 'draft-message-2', threadId: 'thread-1' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    await expect(
      adapter.updateDraft('draft-resource-1', {
        trackingId: 'draft-update-1',
        identity: {
          id: 'identity-1',
          accountId: 'account-1',
          address: 'user@example.com',
          isPrimary: true,
          canSend: true,
        },
        message: {
          to: [{ address: 'recipient@example.com' }],
          cc: [],
          bcc: [],
          subject: 'Updated draft',
          text: 'Updated body',
          attachments: [],
          references: [],
          draftProviderDraftId: 'draft-resource-1',
        },
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        providerMessageId: 'draft-message-2',
        providerDraftId: 'draft-resource-1',
        draft: true,
      },
    });
    expect(fetchMock.mock.calls[0][1]?.method).toBe('PUT');
  });

  it('maps message mutations to Gmail label and trash APIs', async () => {
    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      config(),
      account(),
    );

    await adapter.setRead('message-1', true);
    await adapter.setStarred('message-1', true);
    await adapter.moveMessage('message-1', '__archive__');
    await adapter.deleteMessage('message-1', false);

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      expect.stringContaining('/messages/message-1/modify'),
      expect.stringContaining('/messages/message-1/modify'),
      expect.stringContaining('/messages/message-1/modify'),
      expect.stringContaining('/messages/message-1/trash'),
    ]);
    expect(String(fetchMock.mock.calls[2][1]?.body)).toContain(
      '"removeLabelIds":["INBOX","TRASH","SPAM"]',
    );
  });

  it('parses Pub/Sub notifications and renews a Gmail watch daily', async () => {
    const parsed = gmailMailProviderDefinition.push?.parse({
      query: {},
      body: {
        message: {
          data: Buffer.from(
            JSON.stringify({
              emailAddress: 'user@example.com',
              historyId: '42',
            }),
          ).toString('base64url'),
        },
      },
    });
    expect(parsed).toEqual({
      ok: true,
      value: {
        notifications: [{ accountAddress: 'user@example.com' }],
      },
    });

    const credentials = memoryVault();
    await credentials.putAt('credential-1', {
      provider: 'gmail',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: '2099-01-01T00:00:00.000Z',
      scopes: [],
      tokenType: 'Bearer',
    });
    const expiration = Date.now() + 6 * 24 * 60 * 60 * 1000;
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ historyId: '43', expiration }));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new GmailMailProviderAdapter(
      context(credentials),
      { ...config(), pushTopicName: 'projects/example/topics/mail' },
      account(),
    );

    await expect(
      adapter.upsertPushSubscription({
        notificationUrl: 'https://example.com/main/mail/webhooks/gmail',
        clientState: 'secret',
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        providerSubscriptionId: 'user@example.com',
        expiresAt: new Date(expiration).toISOString(),
      },
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain('/users/me/watch');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      topicName: 'projects/example/topics/mail',
    });
  });
});

interface MemoryVault extends MailCredentialVault {
  readonly values: Map<string, unknown>;
  putAt(reference: string, value: unknown): Promise<void>;
}

function memoryVault(): MemoryVault {
  const values = new Map<string, unknown>();
  return {
    values,
    putAt: async (reference, value) => {
      values.set(reference, value);
    },
    put: async (value) => {
      const reference = `credential-${values.size + 1}`;
      values.set(reference, value);
      return reference;
    },
    get: async <T>(reference: string): Promise<T> => values.get(reference) as T,
    replace: async (reference, value) => {
      values.set(reference, value);
    },
    getOrRefresh: async <T>(
      reference: string,
      isFresh: (value: T) => boolean,
      refresh: (value: T) => Promise<T>,
    ) => {
      const current = values.get(reference) as T;
      if (isFresh(current)) return current;
      const next = await refresh(current);
      values.set(reference, next);
      return next;
    },
    delete: async (reference) => {
      values.delete(reference);
    },
  };
}

function account() {
  return {
    id: 'account-1',
    userId: 'user-1',
    provider: { type: 'gmail', name: 'google' },
    address: 'user@example.com',
    credentialReference: 'credential-1',
    scopes: [],
    status: 'active' as const,
  };
}

function context(credentials: MailCredentialVault): MailProviderContext {
  return { publicBasePath: '/main', credentials };
}

function config(): GmailMailProviderConfig {
  return {
    type: 'gmail',
    name: 'google',
    clientId: 'client-id',
    clientSecret: 'client-secret',
  };
}

function gmailBatchResponse(
  items: readonly {
    readonly id: string;
    readonly message: Record<string, unknown>;
  }[],
): Response {
  const boundary = 'gmail-test-batch';
  const parts = items
    .map(
      ({ message }, index) =>
        `--${boundary}\r\nContent-Type: application/http\r\nContent-ID: <response-item-${index}>\r\n\r\nHTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(message)}\r\n`,
    )
    .join('');
  return new Response(`${parts}--${boundary}--\r\n`, {
    headers: { 'content-type': `multipart/mixed; boundary=${boundary}` },
  });
}

function expectMailProviderCompatibility(
  definition: MailProviderDefinition,
  adapter: MailProviderAdapter,
): void {
  expect(definition.type).toBeTruthy();
  expect(definition.label.trim()).not.toBe('');
  expect(
    Number(Boolean(definition.authorization)) +
      Number(Boolean(definition.connection)),
  ).toBe(1);
  expect(adapter.identity.type).toBe(definition.type);
  expect(adapter.capabilities).toEqual(definition.capabilities);
  expect(adapter.listMessages).toEqual(expect.any(Function));
  expect(adapter.getMessage).toEqual(expect.any(Function));
  expect(adapter.getAttachment).toEqual(expect.any(Function));
  expect(adapter.listChanges).toEqual(expect.any(Function));
  expect(adapter.getCurrentSyncCursor).toEqual(expect.any(Function));
  expect(adapter.sendMessage).toEqual(expect.any(Function));
  expect(adapter.listFolders).toEqual(expect.any(Function));
  expect(adapter.createLabel).toEqual(expect.any(Function));
  expect(adapter.updateLabels).toEqual(expect.any(Function));
  expect(adapter.saveDraft).toEqual(expect.any(Function));
  expect(adapter.updateDraft).toEqual(expect.any(Function));
  expect(adapter.moveMessage).toEqual(expect.any(Function));
  expect(definition.push).toBeDefined();
  expect(adapter.upsertPushSubscription).toEqual(expect.any(Function));
  expect(adapter.deletePushSubscription).toEqual(expect.any(Function));
}
