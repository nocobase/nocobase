import type { AppUIMessage } from '@nocobase/app-plugin-agents/client/chat';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MessageItem } from '../../registry/agents/agent-chat/message-item';
import enUS from '../../registry/agents/agent-chat/locales/en-US';
import zhCN from '../../registry/agents/agent-chat/locales/zh-CN';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'search-card-test', resources: enUS },
});
function message(
  findings = ['Long first result', 'Long second result'],
): AppUIMessage {
  return {
    id: 'answer',
    role: 'assistant',
    metadata: {
      conversationId: 'conversation',
      executionId: 'execution',
      revision: 1,
      createdAt: '2026-01-01T00:00:00Z',
    },
    parts: [
      {
        type: 'tool-webSearch',
        toolCallId: 'search',
        state: 'output-available',
        input: { queries: ['Query one', 'Query two'] },
        output: {
          results: findings.map((text, index) => ({
            query: index === 0 ? 'Query one' : 'Query two',
            status: 'unverified',
            findings: text,
            sources: [],
          })),
        },
      },
    ],
  };
}
function mount(owner = message()) {
  return render(
    <TestI18nProvider runtime={runtime}>
      <ol>
        <MessageItem message={owner} agentName={() => 'Agent'} />
      </ol>
    </TestI18nProvider>,
  );
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function dimensions() {
  let overflow = true;
  const callbacks = new Set<() => void>();
  class Observer implements ResizeObserver {
    readonly notify: () => void;
    constructor(callback: ResizeObserverCallback) {
      this.notify = () => callback([], this);
    }
    observe() {
      callbacks.add(this.notify);
      this.notify();
    }
    unobserve() {
      callbacks.delete(this.notify);
    }
    disconnect() {
      callbacks.delete(this.notify);
    }
  }
  vi.stubGlobal('ResizeObserver', Observer);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.matches('[data-testid="chat-web-search-findings"]') ? 80 : 0;
    },
  );
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.matches('[data-testid="chat-web-search-findings"]') &&
        overflow
        ? 200
        : 80;
    },
  );
  return {
    resize(value: boolean) {
      overflow = value;
      act(() => {
        for (const callback of callbacks) callback();
      });
    },
    observers: callbacks,
  };
}

it('uses a fixed four-line preview and expands each query independently without rerunning tools', () => {
  dimensions();
  const owner = message([
    'Long first result\n\nwith paragraphs.\n\nMore details.',
    'Long second result',
  ]);
  const before = structuredClone(owner);
  const view = mount(owner);
  const first = within(screen.getByRole('region', { name: 'Query one' }));
  const second = within(screen.getByRole('region', { name: 'Query two' }));
  const paragraph = first.getByTestId('chat-web-search-findings');
  expect(paragraph).toHaveClass('whitespace-normal');
  expect(paragraph.textContent).toBe(
    'Long first result\n\nwith paragraphs.\n\nMore details.',
  );
  const control = first.getByRole('button', {
    name: enUS.chat.webSearch.expand,
  });
  expect(paragraph).toHaveClass('line-clamp-4', 'h-[4lh]');
  expect(control).toHaveAttribute('aria-controls', paragraph.id);
  expect(control).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(control);
  expect(
    first.getByRole('button', { name: enUS.chat.webSearch.collapse }),
  ).toHaveAttribute('aria-expanded', 'true');
  expect(paragraph).not.toHaveClass('line-clamp-4');
  expect(paragraph).not.toHaveClass('h-[4lh]');
  expect(paragraph).toHaveClass('whitespace-pre-wrap');
  expect(paragraph).not.toHaveClass('whitespace-normal');
  expect(second.getByTestId('chat-web-search-findings')).toHaveClass(
    'line-clamp-4',
  );
  fireEvent.click(
    first.getByRole('button', { name: enUS.chat.webSearch.collapse }),
  );
  expect(paragraph).toHaveClass('line-clamp-4', 'h-[4lh]');
  expect(owner).toEqual(before);
  const card = screen.getByTestId('chat-web-search');
  expect(card).toHaveClass('w-full');
  expect(
    view.container.querySelector('.flex-1.max-w-none.items-stretch'),
  ).not.toBeNull();
});

it('only offers expansion for overflowing content and rechecks it on resize', () => {
  const size = dimensions();
  size.resize(false);
  const tree = mount();
  expect(
    screen.queryByRole('button', { name: enUS.chat.webSearch.expand }),
  ).toBeNull();
  expect(screen.getAllByTestId('chat-web-search-findings')[0]).toHaveClass(
    'h-[4lh]',
  );
  size.resize(true);
  expect(
    screen.getAllByRole('button', { name: enUS.chat.webSearch.expand }),
  ).toHaveLength(2);
  fireEvent.click(
    screen.getAllByRole('button', { name: enUS.chat.webSearch.expand })[0],
  );
  size.resize(false);
  expect(
    screen.getByRole('button', { name: enUS.chat.webSearch.collapse }),
  ).toBeVisible();
  fireEvent.click(
    screen.getByRole('button', { name: enUS.chat.webSearch.collapse }),
  );
  expect(
    screen.queryByRole('button', { name: enUS.chat.webSearch.expand }),
  ).toBeNull();
  tree.unmount();
  expect(size.observers.size).toBe(0);
});

it.each([enUS, zhCN])(
  'shows source-free findings without warning labels or fabricated sources',
  async (resources) => {
    const local = await createTestI18nRuntime({
      application: { namespace: 'source-free-card', resources },
    });
    render(
      <TestI18nProvider runtime={local}>
        <ol>
          <MessageItem
            message={message(['Answer without sources.'])}
            agentName={() => 'Agent'}
          />
        </ol>
      </TestI18nProvider>,
    );
    expect(screen.getByText('Answer without sources.')).toBeVisible();
    expect(screen.queryByText(resources.chat.webSearch.unverified)).toBeNull();
    expect(
      screen.queryByText(resources.chat.webSearch.unverifiedNotice),
    ).toBeNull();
    expect(screen.queryByText(resources.chat.webSearch.completed)).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByTestId('chat-web-search')).toHaveAttribute(
      'aria-busy',
      'false',
    );
  },
);

it('renders four full-height search skeleton rows and removes them after completion', () => {
  const pending: AppUIMessage = {
    ...message(),
    parts: [
      {
        type: 'tool-webSearch',
        toolCallId: 'search',
        state: 'input-available',
        input: { queries: ['Query one', 'Query two'] },
      },
    ],
  };
  const view = (owner: AppUIMessage, streaming = false) => (
    <TestI18nProvider runtime={runtime}>
      <ol>
        <MessageItem
          message={owner}
          agentName={() => 'Agent'}
          streaming={streaming}
        />
      </ol>
    </TestI18nProvider>
  );
  const tree = render(view(pending, true));
  const skeletons = screen.getAllByTestId('chat-web-search-skeleton');
  expect(skeletons).toHaveLength(2);
  for (const skeleton of skeletons) {
    expect(skeleton).toHaveClass('h-[4lh]', 'grid-rows-4');
    const bars = skeleton.querySelectorAll('[data-slot="skeleton"]');
    expect(bars).toHaveLength(4);
    ['w-full', 'w-[95%]', 'w-full', 'w-[90%]'].forEach((width, index) => {
      expect(bars[index]).toHaveClass(width, 'h-[0.8em]', 'animate-none');
    });
  }
  const styles = [...document.head.querySelectorAll('style')].filter((style) =>
    style.textContent?.includes('@keyframes nb-agent-search-sweep'),
  );
  expect(styles).toHaveLength(1);
  expect(styles[0].textContent).toContain('prefers-reduced-motion: reduce');
  tree.rerender(view(message()));
  expect(screen.queryByTestId('chat-web-search-skeleton')).toBeNull();
});

it('preserves upstream reasoning beside the full-width search card', () => {
  const owner = message();
  owner.parts.unshift({
    type: 'reasoning',
    text: 'Reasoning before retrieval.',
    state: 'done',
  });
  const tree = mount(owner);
  expect(
    tree.container.querySelector('[data-chat-part="reasoning"]'),
  ).not.toBeNull();
  expect(screen.getByTestId('chat-web-search')).toBeVisible();
  expect(screen.getByTestId('chat-web-search').parentElement).toHaveAttribute(
    'data-chat-part',
    'tool',
  );
});

it('measures on an animation frame and cancels it when ResizeObserver is unavailable', () => {
  dimensions();
  vi.stubGlobal('ResizeObserver', undefined);
  const frames: FrameRequestCallback[] = [];
  const cancel = vi.fn();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    frames.push(callback),
  );
  vi.stubGlobal('cancelAnimationFrame', cancel);
  const tree = mount();
  expect(screen.queryByRole('button', { name: 'Expand' })).toBeNull();
  act(() => frames.forEach((frame) => frame(0)));
  expect(screen.getAllByRole('button', { name: 'Expand' })).toHaveLength(2);
  tree.unmount();
  expect(cancel).toHaveBeenCalledWith(1);
  expect(cancel).toHaveBeenCalledWith(2);
});
