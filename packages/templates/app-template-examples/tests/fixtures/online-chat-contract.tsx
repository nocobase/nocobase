/* eslint-disable react-refresh/only-export-components -- standalone verification entry owns its component tree */
/** Browser fixture using the public client and installed application components; no business producer is restored. */
import { createRoot } from 'react-dom/client';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router';
import {
  AppClientProviders,
  ClientApplication,
  createAppClientConfig,
  defineAppClientRenderConfig,
} from '@nocobase/app-client';
import {
  defineAppRuntime,
  resolveAppRuntime,
} from '@nocobase/app-client/runtime';
import { defineClientPlugins } from '@nocobase/app-client/plugins';
import { I18nProvider } from '@nocobase/i18n/client';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { createUIMessageStreamResponse } from 'ai';
import {
  ChatProvider,
  ChatExtensionsContext,
  useChatPanel,
  useConversation,
  useConversationMessages,
  useChatController,
  chatMessageSegments,
  appUIMessageText,
  type AppUIMessage,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
import { MessageItem } from '../../client/extensions/nocobase-agent-chat/message-item';
import { Composer } from '../../client/extensions/nocobase-agent-chat/composer';
import { AppThemeProvider } from '../../client/theme';
import { Button } from '../../client/components/ui/button';
import enUS from '../../client/extensions/nocobase-agent-chat/locales/en-US';
import '../../client/styles.css';

const at = (second: number) => `2026-10-18T03:00:0${second}Z`;
const meta = (seq: number) => ({
  conversationId: 'fixture',
  seq,
  revision: 1,
  createdAt: at(seq),
});
let records: AppUIMessage[] = [
  {
    id: 'request',
    role: 'user',
    metadata: {
      ...meta(1),
      context: {
        route: '/issues/PM-481',
        items: [
          {
            kind: 'issue',
            id: '481',
            title: 'UI message integration',
            key: 'PM-481',
            url: '/issues/PM-481',
          },
        ],
        dropped: 0,
      },
    },
    parts: [
      { type: 'text', text: 'Review the release checklist.' },
      {
        type: 'file',
        filename: 'checklist.txt',
        mediaType: 'text/plain',
        url: 'data:text/plain,Release%20checklist',
      },
    ],
  },
  {
    id: 'runner-logical',
    role: 'assistant',
    metadata: {
      ...meta(2),
      executionId: 'run-fixture',
      sourceRecords: [
        {
          recordId: 'source-a',
          seq: 2,
          partId: 'source-a-text',
          partIndex: 0,
          createdAt: at(2),
        },
        {
          recordId: 'source-b',
          seq: 4,
          partId: 'source-b-text',
          partIndex: 1,
          createdAt: at(4),
        },
      ],
    },
    parts: [
      { type: 'text', text: 'First source block: review **PM-481**.' },
      {
        type: 'text',
        text: 'Second source block: the release checklist is ready.',
      },
    ],
  },
  {
    id: 'notification',
    role: 'system',
    metadata: meta(3),
    parts: [
      {
        type: 'data-notice',
        id: 'delegated',
        data: {
          type: 'delegated',
          title: 'Delegated verification',
          params: { runId: 'child' },
        },
      },
    ],
  },
  {
    id: 'approval',
    role: 'assistant',
    metadata: { ...meta(5), executionId: 'native-fixture' },
    parts: [
      {
        type: 'text',
        text: 'This public tool needs approval before it can run.',
      },
      {
        type: 'tool-update',
        toolCallId: 'update-release',
        state: 'approval-requested',
        input: { title: 'Release checklist' },
        approval: { id: 'approval-fixture' },
      },
    ],
  },
  {
    id: 'consultation',
    role: 'system',
    metadata: meta(6),
    parts: [
      {
        type: 'data-business',
        id: 'consultation-part',
        data: {
          kind: 'consultation',
          id: 'consultation-fixture',
          payload: {
            code: 'consultation',
            callId: 'consultation-fixture',
            runId: 'consulted-run',
            agentId: 'reviewer',
            agentName: 'Reviewer',
            question: 'Is this ready?',
            state: 'completed',
            answer: 'The display contract is ready for review.',
            error: null,
            usage: null,
            plans: 0,
          },
        },
      },
    ],
  },
];
let detail = {
  id: 'fixture',
  title: 'UI message extensions',
  execution: {
    status: 'running',
    waitingApproval: true,
    messageId: 'approval',
    revision: 1,
  },
} as ConversationDetail;
let accepted = 0;
const envelope = (data: unknown, meta: unknown = {}) =>
  Response.json({ data, meta });
const fetchFixture = async (input: RequestInfo | URL, init?: RequestInit) => {
  const request =
    input instanceof Request
      ? input
      : new Request(new URL(String(input), location.origin), init);
  const url = new URL(request.url);
  if (request.method === 'POST' && url.pathname.endsWith('/approval')) {
    const control = await request.json();
    const current = records.find((message) => message.id === 'approval')!;
    records = records.map((message) =>
      message.id === 'approval'
        ? ({
            ...message,
            metadata: { ...message.metadata!, revision: 2 },
            parts: message.parts.map((part) =>
              part.type === 'tool-update'
                ? {
                    ...part,
                    state: control.approval.approved
                      ? 'output-available'
                      : 'output-denied',
                    approval: control.approval,
                    ...(control.approval.approved
                      ? { output: { saved: true } }
                      : {}),
                  }
                : part,
            ),
          } as AppUIMessage)
        : message,
    );
    detail = {
      ...detail,
      execution: {
        status: 'idle',
        outcome: 'completed',
        messageId: current.id,
        revision: 2,
      },
    };
    return createUIMessageStreamResponse({
      stream: new ReadableStream({
        start(writer) {
          writer.enqueue({
            type: 'start',
            messageId: current.id,
            messageMetadata: { ...current.metadata, revision: 2 },
          });
          writer.enqueue({
            type: control.approval.approved
              ? 'tool-output-available'
              : 'tool-output-denied',
            toolCallId: 'update-release',
            ...(control.approval.approved ? { output: { saved: true } } : {}),
          });
          writer.enqueue({ type: 'finish' });
          writer.close();
        },
      }),
    });
  }
  if (request.method === 'POST' && url.pathname.endsWith('/messages')) {
    accepted++;
    const body = await request.json(),
      seq = records.length + 1;
    records.push({ ...body.message, metadata: meta(seq) });
    return createUIMessageStreamResponse({
      stream: new ReadableStream({
        start(writer) {
          writer.enqueue({ type: 'finish' });
          writer.close();
        },
      }),
    });
  }
  if (url.pathname.endsWith('/messages')) {
    const ids = url.searchParams.get('ids')?.split(','),
      after = Number(url.searchParams.get('after') ?? 0);
    return envelope(
      records.filter((message) =>
        ids ? ids.includes(message.id) : (message.metadata?.seq ?? 0) > after,
      ),
      {
        lastSeq: Math.max(...records.map((message) => message.metadata!.seq!)),
      },
    );
  }
  if (url.pathname.endsWith('/events'))
    return new Response(null, { status: 204 });
  if (url.pathname.endsWith('/fixture')) return envelope(detail);
  if (url.pathname.endsWith('/chatPreferences'))
    return envelope({ defaultAgentId: null });
  return envelope([]);
};
const i18n = await createTestI18nRuntime({
  application: { namespace: 'contract-browser', resources: enUS },
  strict: false,
});
const runtime = await resolveAppRuntime(
  defineAppRuntime({
    packageName: 'contract-browser',
    createAppConfig: createAppClientConfig,
    plugins: defineClientPlugins([]),
  }),
  {
    rawConfig: {
      app: { basePath: '/' },
      api: { baseURL: location.origin + '/api' },
    },
    rawPublicConfig: {},
    i18n,
  },
);
function Locale({ children }: PropsWithChildren) {
  return <I18nProvider runtime={i18n}>{children}</I18nProvider>;
}
const app = new ClientApplication({
  runtime,
  fetch: fetchFixture,
  createRenderConfig: () =>
    defineAppClientRenderConfig({
      basename: '/',
      reactProviders: [Locale],
      routes: null,
    }),
});
runtime.app = app;
await app.start();
function Contract() {
  const { openChat } = useChatPanel(),
    controller = useChatController();
  const conversation = useConversation('fixture'),
    messages = useConversationMessages('fixture');
  const [plan, setPlan] = useState('Ready for review');
  useEffect(() => openChat({ conversationId: 'fixture' }), [openChat]);
  const segments = chatMessageSegments(messages.items);
  return (
    <main className='mx-auto max-w-4xl space-y-5 p-6'>
      <header>
        <h1 className='text-2xl font-semibold'>UI message extensions</h1>
        <p className='text-sm text-muted-foreground'>
          One logical Runner reply · ordered notifications · native tool
          approval
        </p>
      </header>
      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          onClick={() => void controller.refresh('fixture')}
        >
          Refresh saved history
        </Button>
        <Button
          variant='outline'
          onClick={() => void controller.resume('fixture')}
        >
          Recover stream
        </Button>
        <Button
          variant='outline'
          onClick={() => {
            const seq = 8;
            records.push({
              id: 'late-notice',
              role: 'system',
              metadata: meta(seq),
              parts: [
                {
                  type: 'data-notice',
                  id: 'late',
                  data: {
                    type: 'translated',
                    title: 'Saved notification after response',
                  },
                },
              ],
            });
            void controller.loadHistory('fixture', false, true);
            setPlan('Updated after notification');
          }}
        >
          Publish independent notice
        </Button>
      </div>
      <p role='status' className='text-sm text-muted-foreground'>
        Business state:{' '}
        {conversation.data?.execution?.waitingApproval
          ? 'Waiting for approval'
          : (conversation.data?.execution?.outcome ?? 'Loading')}{' '}
        · Inputs accepted: {accepted}
      </p>
      <ChatExtensionsContext.Provider
        value={{
          renderNews: (notice) =>
            notice.type === 'delegated' ? (
              <article className='rounded-lg border p-3 text-sm'>
                Delegation card · independent child execution
              </article>
            ) : null,
          newsText: (notice) =>
            notice.type === 'translated'
              ? 'Translated independent notification'
              : null,
        }}
      >
        <ol aria-label='Messages' className='space-y-4'>
          {segments.flatMap((segment, index) => [
            <MessageItem
              key={segment.key}
              message={segment.message}
              segment={segment}
              agentName={() => 'Online Agent'}
              onApproval={(input) => controller.approve('fixture', input)}
              extra={
                segment.last && segment.message.id === 'runner-logical' ? (
                  <aside className='mt-2 text-sm'>
                    <a href='#reference'>
                      Reference: PM-481 ·{' '}
                      {appUIMessageText(segment.message).includes('checklist')
                        ? 'Release checklist'
                        : ''}
                    </a>
                  </aside>
                ) : undefined
              }
            />,
            ...(index === 1
              ? [
                  <li key='plan-card' className='rounded-lg border p-3 text-sm'>
                    Plan card · {plan}
                  </li>,
                ]
              : []),
          ])}
        </ol>
      </ChatExtensionsContext.Provider>
      <Composer
        running={
          conversation.data?.execution?.status === 'running' &&
          !conversation.data.execution.waitingApproval
        }
        stopping={false}
        onStop={() => void controller.stop('fixture')}
        onSend={() => false}
        toolbar={
          <Button variant='ghost' size='sm'>
            Application action
          </Button>
        }
        notice={
          <p>Application notice · review tool actions before approving.</p>
        }
      />
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <MemoryRouter>
    <AppClientProviders app={app}>
      <AppThemeProvider>
        <ChatProvider>
          <Contract />
        </ChatProvider>
      </AppThemeProvider>
    </AppClientProviders>
  </MemoryRouter>,
);
