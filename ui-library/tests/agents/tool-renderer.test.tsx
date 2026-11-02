import {
  AIToolRendererProvider,
  getAIToolSourceMessage,
  useAIToolRenderer,
  type AIToolPart,
  type AIToolRendererMap,
  type AIToolRendererProps,
  type AppUIMessage,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { StrictMode, type ReactNode } from 'react';
import { expect, expectTypeOf, it, vi } from 'vitest';
import { MessageItem } from '../../registry/agents/agent-chat/message-item';
import enUS from '../../registry/agents/agent-chat/locales/en-US';
import zhCN from '../../registry/agents/agent-chat/locales/zh-CN';
import * as preview from '../../website/demo/agents/agents-chat-client';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'tool-renderer-test', resources: enUS },
});
function wrapper({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}
const metadata = {
  conversationId: 'c',
  executionId: 'execution',
  revision: 1,
  createdAt: '2026-01-01T00:00:00Z',
};
const source: AppUIMessage = {
  id: 'origin',
  role: 'user',
  metadata: {
    ...metadata,
    context: { route: '/original', items: [], dropped: 0 },
  },
  parts: [{ type: 'text', text: 'Original request' }],
};
function message(part: AIToolPart): AppUIMessage {
  return {
    id: 'reply',
    role: 'assistant',
    metadata: { ...metadata, sourceUserMessageId: source.id },
    parts: [
      { type: 'text', text: 'Before' },
      part,
      { type: 'text', text: 'After' },
    ],
  };
}
function Card({
  part,
  toolName,
  message: owner,
  context,
}: AIToolRendererProps) {
  return (
    <article>
      <p>{`Custom ${toolName}: ${part.state}`}</p>
      <p>{`${owner.id}: ${context.sourceContext?.route ?? 'no source'}`}</p>
      {context.approval.error ? (
        <p role='alert'>Custom approval failed</p>
      ) : null}
      {part.state === 'approval-requested' ? (
        <button
          disabled={context.approval.disabled}
          onClick={() => void context.approval.respond(false, 'User declined')}
        >
          Custom deny
        </button>
      ) : null}
    </article>
  );
}
it('never keeps restored unfinished search cards busy or displays private tool errors', () => {
  const owner = message({
    type: 'tool-webSearch',
    toolCallId: 'search',
    state: 'input-available',
    input: { queries: ['pending'] },
  });
  const tree = render(
    <ol>
      <MessageItem message={owner} agentName={() => 'Agent'} streaming />
    </ol>,
    { wrapper },
  );
  expect(screen.getByTestId('chat-web-search')).toHaveAttribute(
    'aria-busy',
    'true',
  );
  expect(
    screen.getByRole('status', { name: enUS.chat.webSearch.searching }),
  ).toBeVisible();
  const indicator = screen.getByRole('status', {
    name: enUS.chat.webSearch.searching,
  });
  expect(indicator.nextElementSibling).toHaveTextContent(
    enUS.chat.webSearch.title,
  );
  expect(indicator.nextElementSibling?.nextElementSibling).toHaveTextContent(
    'Queries · 1',
  );
  expect(indicator).toHaveClass('lucide-globe', 'animate-pulse');
  expect(
    screen.getByTestId('chat-web-search').querySelectorAll('.lucide-globe'),
  ).toHaveLength(1);
  expect(
    screen
      .getByTestId('chat-web-search')
      .querySelector('[data-slot="spinner"]'),
  ).toBeNull();
  tree.rerender(
    <ol>
      <MessageItem message={owner} agentName={() => 'Agent'} />
    </ol>,
  );
  expect(screen.getByTestId('chat-web-search')).toHaveAttribute(
    'aria-busy',
    'false',
  );
  expect(screen.getByText(enUS.chat.webSearch.interrupted)).toBeVisible();
  expect(
    screen.queryByRole('status', { name: enUS.chat.webSearch.searching }),
  ).toBeNull();
  expect(
    screen.getByTestId('chat-web-search').querySelector('.lucide-globe'),
  ).not.toHaveClass('animate-pulse');
  tree.rerender(
    <ol>
      <MessageItem
        message={message({
          type: 'tool-webSearch',
          toolCallId: 'search',
          state: 'output-error',
          input: {},
          errorText: 'Private upstream provider details',
        })}
        agentName={() => 'Agent'}
      />
    </ol>,
  );
  expect(screen.queryByText('Private upstream provider details')).toBeNull();
  expect(screen.getByText(enUS.chat.webSearch.failed)).toBeVisible();
});

it('renders native search evidence inline and lets applications override the default card', async () => {
  const owner = message({
    type: 'tool-webSearch',
    toolCallId: 'search',
    state: 'output-available',
    input: { queries: ['current facts'] },
    output: {
      results: [
        {
          query: 'current facts',
          status: 'success',
          findings: '<script>unsafe</script>',
          sources: [
            { title: 'Unsafe', url: 'javascript:alert(1)' },
            { title: 'Official source', url: 'https://example.com/evidence' },
          ],
        },
      ],
    },
  });
  const tree = render(
    <ol>
      <MessageItem message={owner} agentName={() => 'Agent'} />
    </ol>,
    { wrapper },
  );
  const link = await screen.findByRole('link', { name: 'Official source' });
  expect(link).toHaveAttribute('href', 'https://example.com/evidence');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(screen.queryByRole('link', { name: 'Unsafe' })).toBeNull();
  expect(document.querySelector('script')).toBeNull();
  expect(screen.getByTestId('chat-web-search')).toHaveTextContent(
    '<script>unsafe</script>',
  );
  tree.rerender(
    <AIToolRendererProvider renderers={{ webSearch: Card }}>
      <ol>
        <MessageItem message={owner} agentName={() => 'Agent'} />
      </ol>
    </AIToolRendererProvider>,
  );
  expect(screen.queryByTestId('chat-web-search')).toBeNull();
  expect(screen.getByText('Custom webSearch: output-available')).toBeVisible();
});

it.each([enUS, zhCN])(
  'renders source-free findings without warning labels or fabricated source links in each locale',
  async (resources) => {
    const local = await createTestI18nRuntime({
      application: { namespace: 'unverified-search', resources },
    });
    render(
      <TestI18nProvider runtime={local}>
        <ol>
          <MessageItem
            message={message({
              type: 'tool-webSearch',
              toolCallId: 'unverified',
              state: 'output-available',
              input: { queries: ['Current facts'] },
              output: {
                results: [
                  {
                    query: 'Current facts',
                    status: 'unverified',
                    findings: 'Answer without source evidence.',
                    sources: [],
                  },
                ],
              },
            })}
            agentName={() => 'Agent'}
          />
        </ol>
      </TestI18nProvider>,
    );
    expect(screen.queryByText(resources.chat.webSearch.unverified)).toBeNull();
    expect(screen.queryByText(resources.chat.webSearch.completed)).toBeNull();
    expect(
      await screen.findByText('Answer without source evidence.'),
    ).toBeVisible();
    expect(
      screen.queryByText(resources.chat.webSearch.unverifiedNotice),
    ).toBeNull();
    expect(
      screen.queryByRole('list', { name: resources.chat.webSearch.sources }),
    ).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByTestId('chat-web-search')).toHaveAttribute(
      'aria-busy',
      'false',
    );
  },
);

const renderers: AIToolRendererMap = { propose: Card };
const states = [
  {
    type: 'tool-propose',
    toolCallId: 'call',
    state: 'input-streaming',
    input: {},
  },
  {
    type: 'tool-propose',
    toolCallId: 'call',
    state: 'input-available',
    input: {},
  },
  {
    type: 'tool-propose',
    toolCallId: 'call',
    state: 'approval-requested',
    input: {},
    approval: { id: 'approval' },
  },
  {
    type: 'tool-propose',
    toolCallId: 'call',
    state: 'approval-responded',
    input: {},
    approval: { id: 'approval', approved: true },
  },
  {
    type: 'tool-propose',
    toolCallId: 'call',
    state: 'output-available',
    input: {},
    output: { safe: true },
  },
  {
    type: 'tool-propose',
    toolCallId: 'call',
    state: 'output-error',
    input: {},
    errorText: 'Public error',
  },
  {
    type: 'tool-propose',
    toolCallId: 'call',
    state: 'output-denied',
    input: {},
    approval: { id: 'approval', approved: false },
  },
  {
    type: 'dynamic-tool',
    toolName: 'propose',
    toolCallId: 'dynamic-call',
    state: 'output-available',
    input: {},
    output: { safe: true },
  },
] satisfies AIToolPart[];

it.each(states)(
  'dispatches the exact SDK tool name in $state ($type) without executing actions',
  (part) => {
    const approval = vi.fn();
    const owner = message(part);
    const view = render(
      <StrictMode>
        <AIToolRendererProvider renderers={renderers}>
          <ol>
            <MessageItem
              message={owner}
              sourceMessage={source}
              agentName={() => 'Agent'}
              onApproval={approval}
            />
          </ol>
        </AIToolRendererProvider>
      </StrictMode>,
      { wrapper },
    );
    expect(screen.getByText(`Custom propose: ${part.state}`)).toBeVisible();
    expect(screen.getByText('reply: /original')).toBeVisible();
    expect(view.container.querySelector('article')?.textContent).not.toContain(
      'provider',
    );
    expect(view.container.textContent?.indexOf('Before')).toBeLessThan(
      view.container.textContent?.indexOf('Custom') ?? 0,
    );
    expect(view.container.textContent?.indexOf('After')).toBeGreaterThan(
      view.container.textContent?.indexOf('Custom') ?? 0,
    );
    expect(approval).not.toHaveBeenCalled();
    view.rerender(
      <AIToolRendererProvider renderers={renderers}>
        <ol>
          <MessageItem
            message={owner}
            sourceMessage={source}
            agentName={() => 'Agent'}
            onApproval={approval}
          />
        </ol>
      </AIToolRendererProvider>,
    );
    expect(approval).not.toHaveBeenCalled();
  },
);

it('retains unknown-tool fallback including errors, denial and exact-name matching', () => {
  const view = render(
    <AIToolRendererProvider renderers={{ proposes: Card }}>
      <ol>
        <MessageItem
          message={message({
            type: 'dynamic-tool',
            toolName: 'propose',
            toolCallId: 'call',
            state: 'output-error',
            input: { safe: 'input' },
            errorText: 'Public error',
          })}
          agentName={() => 'Agent'}
        />
      </ol>
    </AIToolRendererProvider>,
    { wrapper },
  );
  expect(screen.getByText('propose')).toBeVisible();
  expect(screen.getByRole('alert')).toHaveTextContent('Public error');
  expect(screen.getByText(/"safe": "input"/u)).toBeVisible();
  view.rerender(
    <ol>
      <MessageItem message={message(states[6])} agentName={() => 'Agent'} />
    </ol>,
  );
  expect(screen.getByText(enUS.chat.approval.denied)).toBeVisible();
});

it('binds custom approval to the actual part and exposes pending, read-only and error state', async () => {
  let fail: ((error: Error) => void) | undefined;
  const approval = vi.fn(
    () =>
      new Promise<void>((_resolve, reject) => {
        fail = reject;
      }),
  );
  const owner = message(states[2]);
  const tree = (readOnly = false) => (
    <AIToolRendererProvider renderers={renderers}>
      <ol>
        <MessageItem
          message={owner}
          readOnly={readOnly}
          agentName={() => 'Agent'}
          onApproval={approval}
        />
      </ol>
    </AIToolRendererProvider>
  );
  const view = render(tree(true), { wrapper });
  expect(screen.getByRole('button', { name: 'Custom deny' })).toBeDisabled();
  view.rerender(tree());
  fireEvent.click(screen.getByRole('button', { name: 'Custom deny' }));
  expect(screen.getByRole('button', { name: 'Custom deny' })).toBeDisabled();
  expect(approval).toHaveBeenCalledExactlyOnceWith({
    messageId: 'reply',
    executionId: 'execution',
    approval: { id: 'approval', approved: false, reason: 'User declined' },
  });
  fail?.(new Error('Private failure'));
  await waitFor(() =>
    expect(screen.getByText('Custom approval failed')).toBeVisible(),
  );
  expect(screen.queryByText('Private failure')).toBeNull();
});

function Lookup({ name }: { readonly name: string }) {
  const Renderer = useAIToolRenderer(name);
  return (
    <p>
      {Renderer === Card
        ? 'parent card'
        : Renderer
          ? 'override card'
          : 'fallback'}
    </p>
  );
}
it('scopes providers, inherits other keys, updates overrides and excludes prototype names', () => {
  const Override = () => <p>Override</p>;
  const view = render(
    <AIToolRendererProvider renderers={{ propose: Card, inherited: Card }}>
      <AIToolRendererProvider renderers={{ propose: Override }}>
        <Lookup name='propose' />
        <Lookup name='inherited' />
        <Lookup name='toString' />
      </AIToolRendererProvider>
    </AIToolRendererProvider>,
  );
  expect(screen.getByText('override card')).toBeVisible();
  expect(screen.getByText('parent card')).toBeVisible();
  expect(screen.getByText('fallback')).toBeVisible();
  view.rerender(
    <AIToolRendererProvider key='another-identity' renderers={{}}>
      <Lookup name='propose' />
    </AIToolRendererProvider>,
  );
  expect(screen.getByText('fallback')).toBeVisible();
  expect(screen.queryByText('override card')).toBeNull();
  view.rerender(
    <AIToolRendererProvider renderers={renderers}>
      <Lookup name='propose' />
    </AIToolRendererProvider>,
  );
  expect(screen.getByText('parent card')).toBeVisible();
});

it('resolves only the unique server-linked origin in this conversation and fails closed on missing history', () => {
  const owner = message(states[4]);
  const latest: AppUIMessage = {
    ...source,
    id: 'later',
    metadata: {
      ...source.metadata,
      ...metadata,
      context: { route: '/unrelated', items: [], dropped: 0 },
    },
  };
  expect(getAIToolSourceMessage(owner, [source, latest])).toBe(source);
  expect(getAIToolSourceMessage(owner, [latest])).toBeNull();
  expect(
    getAIToolSourceMessage({ ...owner, metadata }, [source, latest]),
  ).toBeNull();
  expect(getAIToolSourceMessage(owner, [source, source])).toBeNull();
  expect(
    getAIToolSourceMessage(owner, [{ ...source, role: 'assistant' }]),
  ).toBeNull();
  expect(
    getAIToolSourceMessage(owner, [
      { ...source, metadata: { ...metadata, conversationId: 'another' } },
    ]),
  ).toBeNull();
  expect(getAIToolSourceMessage(source, [source])).toBeNull();
});

it('rejects an unrelated source prop even when it is a user message', () => {
  render(
    <AIToolRendererProvider renderers={renderers}>
      <ol>
        <MessageItem
          message={message(states[4])}
          sourceMessage={{ ...source, id: 'another-turn' }}
          agentName={() => 'Agent'}
        />
      </ol>
    </AIToolRendererProvider>,
    { wrapper },
  );
  expect(screen.getByText('reply: no source')).toBeVisible();
});

it('keeps the shared renderer chain in the installed Examples copy without replacing its local pending actions', () => {
  const shared = readFileSync(
    path.resolve('registry/agents/agent-chat/message-item.tsx'),
    'utf8',
  );
  const installed = readFileSync(
    path.resolve(
      '../packages/templates/app-template-examples/client/extensions/nocobase-agent-chat/message-item.tsx',
    ),
    'utf8',
  );
  expect(installed.split('export interface PendingItemProps')[0]).toBe(
    shared.split('export interface PendingItemProps')[0],
  );
  expect(installed).toContain('onRecoverCreation');
  expect(installed).toContain('retryDisabled');
  const conversation = readFileSync(
    path.resolve(
      '../packages/templates/app-template-examples/client/extensions/nocobase-agent-chat/conversation-view.tsx',
    ),
    'utf8',
  );
  expect(conversation).toContain('getAIToolSourceMessage(');
  expect(conversation).toContain('inputAvailability');
  expect(conversation).toContain("from './conversation-actions.js'");
});

it('keeps the website stand-in renderer API exactly aligned with the real SDK', () => {
  expectTypeOf(preview.AIToolRendererProvider).toEqualTypeOf<
    typeof AIToolRendererProvider
  >();
  expectTypeOf(preview.useAIToolRenderer).toEqualTypeOf<
    typeof useAIToolRenderer
  >();
  expectTypeOf(preview.getAIToolSourceMessage).toEqualTypeOf<
    typeof getAIToolSourceMessage
  >();
  expectTypeOf<preview.AIToolRendererProps>().toEqualTypeOf<AIToolRendererProps>();
  expect(preview.AIToolRendererProvider).toBe(AIToolRendererProvider);
  expect(preview.useAIToolRenderer).toBe(useAIToolRenderer);
});
