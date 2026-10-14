import type { Page } from '@playwright/test';
import type {
  MailAccountView,
  MailFolder,
  MailMessage,
  MailProviderView,
} from '../../../shared/mail.js';

export interface FixtureRequest {
  readonly method: string;
  readonly path: string;
  readonly query: Readonly<Record<string, string>>;
  readonly body: unknown;
}

export const accounts: readonly MailAccountView[] = ['alpha', 'beta'].map(
  (id) => ({
    id,
    userId: 'fixture-user',
    provider: { type: 'imap', name: 'isolated' },
    address: `${id}@example.test`,
    displayName: `Fixture ${id}`,
    scopes: [],
    status: 'active',
  }),
);
const providers: readonly MailProviderView[] = [
  {
    type: 'imap',
    name: 'isolated',
    label: 'Synthetic IMAP (no network)',
    connection: 'credentials',
    configured: true,
    capabilities: {
      receive: true,
      send: true,
      incrementalSync: true,
      moveMessage: true,
      labels: true,
    },
  },
];

function folders(accountId: string): readonly MailFolder[] {
  return [
    {
      id: `${accountId}-inbox`,
      accountId,
      providerFolderId: 'INBOX',
      name: 'Inbox',
      type: 'inbox',
      kind: 'folder',
    },
    {
      id: `${accountId}-archive`,
      accountId,
      providerFolderId: 'Archive',
      name: 'Archive',
      type: 'archive',
      kind: 'folder',
    },
    {
      id: `${accountId}-project`,
      accountId,
      providerFolderId: 'Projects',
      name: 'Projects',
      type: 'custom',
      kind: 'folder',
    },
  ];
}

export function message(index: number, accountId = 'alpha'): MailMessage {
  return {
    id: `message-${index}`,
    accountId,
    providerMessageId: `provider-${index}`,
    conversationId: `conversation-${index}`,
    folderIds: ['INBOX'],
    labelIds: ['priority'],
    from: { address: 'sender@example.test', name: 'Fixture sender' },
    to: [{ address: `${accountId}@example.test` }],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    attachments: [],
    subject: `Fixture message ${index}`,
    preview: 'Deterministic browser regression message preview.',
    receivedAt: '2026-01-02T12:00:00Z',
    read: true,
    starred: false,
    draft: false,
    todo: false,
    hasAttachments: false,
    contentStatus: 'complete',
    text: `Readable fixture body ${index}.\n\n${'The production conversation must remain readable without horizontal clipping. '.repeat(12)}`,
  };
}

export async function installMailApi(page: Page): Promise<{
  requests: FixtureRequest[];
  unexpected: string[];
  delayConversation: (index: number) => {
    started: Promise<void>;
    release: () => Promise<void>;
  };
}> {
  const requests: FixtureRequest[] = [];
  const unexpected: string[] = [];
  const patches = new Map<string, Partial<MailMessage>>();
  const delays = new Map<
    number,
    { started: () => void; wait: Promise<void>; delivered: () => void }
  >();
  const detail = (index: number, accountId: string): MailMessage => ({
    ...message(index, accountId),
    ...patches.get(`${accountId}:${index}`),
  });
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const endpoint = url.pathname.split('/api/')[1] ?? '';
    const body: unknown = request.postDataJSON();
    requests.push({
      method: request.method(),
      path: endpoint,
      query: Object.fromEntries(url.searchParams),
      body,
    });
    const json = async (data: unknown, status = 200): Promise<void> =>
      route.fulfill({ status, json: data });
    // This is a synthetic permission guard, not evidence about real host authz or mail ownership.
    if (
      !/(?:^|;\s*)fixture_mail_access=allowed(?:;|$)/.test(
        request.headers()['cookie'] ?? '',
      )
    ) {
      await json(
        {
          error: {
            code: 'PERMISSION_DENIED',
            status: 403,
            reason: 'FIXTURE_ACCESS_DENIED',
            domain: 'mail',
            message: 'Explicit fixture permission required.',
          },
        },
        403,
      );
      return;
    }
    if (endpoint === 'mail/providers')
      return json({ data: providers, meta: { total: providers.length } });
    if (endpoint === 'mail/accounts')
      return json({ data: accounts, meta: { total: accounts.length } });
    const accountResource =
      /^mail\/accounts\/([^/]+)\/(folders|identities|signatures)$/.exec(
        endpoint,
      );
    if (accountResource) {
      const [, accountId, resource] = accountResource;
      return json({
        data:
          resource === 'folders'
            ? folders(accountId)
            : resource === 'identities'
              ? [
                  {
                    id: `${accountId}-identity`,
                    accountId,
                    address: `${accountId}@example.test`,
                    isPrimary: true,
                    canSend: true,
                  },
                ]
              : [],
        meta: { total: 0 },
      });
    }
    if (endpoint === 'mail/labels')
      return json({
        data: [
          {
            id: 'priority',
            name: 'Priority',
            color: 'blue',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        meta: { total: 1 },
      });
    if (endpoint === 'mail/templates')
      return json({ data: [], meta: { total: 0 } });
    if (endpoint === 'mail/messages') {
      const start = url.searchParams.get('pageToken') === 'page-2' ? 50 : 0;
      const accountId = url.searchParams.get('accountId') ?? 'alpha';
      return json({
        data: Array.from({ length: 50 }, (_, index) =>
          detail(start + index, accountId),
        ),
        meta: {
          total: 100,
          ...(start === 0 ? { nextPageToken: 'page-2' } : {}),
        },
      });
    }
    const conversation =
      /^mail\/accounts\/([^/]+)\/conversations\/conversation-(\d+)\/messages$/.exec(
        endpoint,
      );
    if (conversation) {
      const index = Number(conversation[2]);
      const delay = delays.get(index);
      delay?.started();
      if (delay) await delay.wait;
      await json({
        data: [
          {
            ...detail(index, conversation[1]),
            ...(delay ? { read: false } : {}),
          },
        ],
        meta: { total: 1 },
      });
      delay?.delivered();
      return;
    }
    const item = /^mail\/accounts\/([^/]+)\/messages\/message-(\d+)$/.exec(
      endpoint,
    );
    if (item && ['GET', 'PATCH'].includes(request.method())) {
      const index = Number(item[2]);
      if (request.method() === 'PATCH')
        patches.set(`${item[1]}:${index}`, {
          ...patches.get(`${item[1]}:${index}`),
          ...(body as Partial<MailMessage>),
        });
      return json({ data: detail(index, item[1]) });
    }
    if (
      (endpoint === 'mail/syncRuns' ||
        /^mail\/accounts\/[^/]+\/sync$/.test(endpoint)) &&
      request.method() === 'POST'
    ) {
      return json({
        data: {
          id: `sync-${requests.length}`,
          accountId:
            (body as { accountId?: string }).accountId ??
            endpoint.split('/')[2],
          status: 'completed',
          phase: 'completed',
          processedMessages: 0,
          processedPages: 0,
        },
      });
    }
    unexpected.push(`${request.method()} ${endpoint}`);
    return json(
      {
        error: {
          code: 'UNIMPLEMENTED',
          status: 501,
          reason: 'FIXTURE_UNIMPLEMENTED',
          domain: 'mail',
          message: `Unexpected fixture endpoint ${endpoint}`,
        },
      },
      501,
    );
  });
  await page.routeWebSocket('**/ws', (socket) => {
    socket.onMessage((raw) => {
      const data = JSON.parse(String(raw)) as { type?: string; id?: string };
      if (data.type === 'ping')
        socket.send(JSON.stringify({ type: 'pong', id: data.id }));
    });
  });
  return {
    requests,
    unexpected,
    delayConversation: (index) => {
      let start!: () => void;
      let release!: () => void;
      let delivered!: () => void;
      const started = new Promise<void>((resolve) => {
        start = resolve;
      });
      const wait = new Promise<void>((resolve) => {
        release = resolve;
      });
      const done = new Promise<void>((resolve) => {
        delivered = resolve;
      });
      delays.set(index, { started: start, wait, delivered });
      return {
        started,
        release: async () => {
          release();
          await done;
        },
      };
    },
  };
}
