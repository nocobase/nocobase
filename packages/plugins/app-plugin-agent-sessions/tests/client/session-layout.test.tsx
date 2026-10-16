import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionView } from '../../client/components/session-view.js';
import plugin from '../../client/plugin.js';
import type { Session, SessionLink } from '../../shared/api.js';

const session: Session = {
  id: 'session',
  computerId: 'computer',
  agentId: 'codex',
  cwd: '/workspace',
  title:
    'A long conversation title about planning and following the mobile layout work',
  titleSource: 'owner',
  state: null,
  startup: null,
  settings: {},
  running: false,
  waiting: false,
  computerOnline: true,
  lastSeq: 0,
  project: null,
  links: [],
  archivedAt: null,
  lastActivityAt: '2026-10-13T00:00:00Z',
  createdAt: '2026-10-13T00:00:00Z',
};

function link(
  refId: string,
  label: string,
  tone: NonNullable<SessionLink['status']>['tone'],
): SessionLink {
  return {
    kind: 'issue',
    refId,
    key: `TEST-${refId}`,
    title: `Task ${refId}`,
    group: null,
    status: { label, tone },
    href: null,
    startable: false,
    decidedAt: null,
  };
}

let resizeCallbacks: Map<Element, () => void>;

function resize(element: Element): void {
  act(() => resizeCallbacks.get(element)?.());
}

beforeEach(() => {
  resizeCallbacks = new Map();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: () => void) {}
      observe(element: Element) {
        resizeCallbacks.set(element, this.callback);
      }
      disconnect() {
        for (const [element, callback] of resizeCallbacks)
          if (callback === this.callback) resizeCallbacks.delete(element);
      }
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function setup(links: readonly SessionLink[] = []) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const requests = vi.fn(({ path, method, json }: ApiCall): unknown => {
    if (path === 'agentSessions/sessions/session' && method === 'GET')
      return { data: { ...session, links } };
    if (method === 'POST') return { data: json };
    return { data: [], meta: {} };
  });
  await renderWithApp(
    <QueryClientProvider client={client}>
      <SessionView sessionId='session' />
    </QueryClientProvider>,
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      fetch: answerApi(requests),
      route: '/agent-sessions/session',
    },
  );
  await screen.findByRole('heading', { name: session.title });
  return { client, requests };
}

/** Models normal overflow scrolling: both writes and reflow clamp scrollTop to the current range. */
function scrollGeometry() {
  let summaryHeight = 0;
  let contentHeight = 1000;
  let viewportHeight = 640;
  const height = (): number => {
    const title = screen.queryByRole('heading', { name: session.title });
    return (title?.classList.contains('truncate') ? 80 : 140) + summaryHeight;
  };
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.querySelector('header h2') ? height() : 0;
    },
  );
  return {
    growMessages: () => {
      contentHeight += 100;
    },
    shrinkViewport: () => {
      viewportHeight -= 100;
    },
    wrapSummary: () => {
      summaryHeight = 24;
    },
    attach: () => {
      const element = screen
        .getByRole('region', { name: session.title })
        .querySelector('.overflow-y-auto') as HTMLDivElement;
      let position = 0;
      const writes: number[] = [];
      const bound = (value: number): number =>
        Math.max(
          0,
          Math.min(value, element.scrollHeight - element.clientHeight),
        );
      Object.defineProperties(element, {
        scrollHeight: { configurable: true, get: () => contentHeight },
        clientHeight: {
          configurable: true,
          get: () => viewportHeight - height(),
        },
        scrollTop: {
          configurable: true,
          get: () => {
            position = bound(position);
            return position;
          },
          set: (value: number) => {
            writes.push(value);
            position = bound(value);
          },
        },
      });
      return {
        element,
        writes,
        readingPosition: () => height() - element.scrollTop,
      };
    },
  };
}

describe('session mobile layout', () => {
  it.each([0, 1, 50, 79, 150])(
    'keeps the reading position after the header resize observer at %spx from the bottom, then follows message updates normally',
    async (distance) => {
      const geometry = scrollGeometry();
      const { client } = await setup();
      const { element, readingPosition } = geometry.attach();
      // Deliver the initial observation before the user's scroll, as in a browser.
      resize(element);
      element.scrollTop = 500 - distance;
      fireEvent.scroll(element);
      const before = readingPosition();
      fireEvent.wheel(element, { deltaY: 10 });
      fireEvent.scroll(element);
      resize(element);
      expect(readingPosition()).toBe(before);
      expect(element.scrollTop).toBe(440 - distance);

      geometry.growMessages();
      act(() =>
        client.setQueryData(
          ['agentSessions', 'transcript', 'session'],
          [
            {
              kind: 'prompt',
              promptId: 'new-message',
              seq: 1,
              at: session.createdAt,
              content: [
                { type: 'text', text: 'A new message after the title changed' },
              ],
            },
          ],
        ),
      );
      await waitFor(() =>
        expect(element.scrollTop).toBe(distance < 80 ? 540 : 290),
      );
      // A later viewport resize must still follow the existing near-bottom rule.
      geometry.shrinkViewport();
      resize(element);
      expect(element.scrollTop).toBe(distance < 80 ? 640 : 290);
    },
  );

  it('defers a short slow swipe near the message top until a two-line title can be compensated', async () => {
    const geometry = scrollGeometry();
    await setup();
    const { element, writes, readingPosition } = geometry.attach();
    element.scrollTop = 20;
    const before = readingPosition();
    fireEvent.touchStart(element, { touches: [{ clientY: 200 }] });
    fireEvent.touchMove(element, { touches: [{ clientY: 190 }] });
    expect(readingPosition()).toBe(before);
    expect(element.scrollTop).toBe(20);
    expect(
      screen.getByRole('heading', { name: session.title }).className,
    ).toContain('line-clamp-2');
    for (const scrollTop of [25, 30, 40, 50, 59]) {
      element.scrollTop = scrollTop;
      fireEvent.scroll(element);
      expect(element.scrollTop).toBe(scrollTop);
    }
    element.scrollTop = 60;
    const atThreshold = readingPosition();
    fireEvent.scroll(element);
    expect(element.scrollTop).toBe(0);
    resize(element);
    expect(readingPosition()).toBe(atThreshold);
    expect(writes.every((value) => value >= 0)).toBe(true);
    expect(
      screen.getByRole('button', { name: /Tasks 0.*No tasks/ }),
    ).toBeTruthy();
  });

  it.each([120, 500])(
    'preserves the reading position when folding from scrollTop %s, including bottom reflow clamping',
    async (scrollTop) => {
      const geometry = scrollGeometry();
      await setup();
      const { element, readingPosition } = geometry.attach();
      element.scrollTop = scrollTop;
      const before = readingPosition();
      fireEvent.wheel(element, { deltaY: 10 });
      expect(element.scrollTop).toBe(scrollTop - 60);
      resize(element);
      expect(readingPosition()).toBe(before);
      // Expanding at the top is compensated too, without moving the message.
      element.scrollTop = 0;
      const atTop = readingPosition();
      fireEvent.wheel(element, { deltaY: -10 });
      expect(element.scrollTop).toBe(60);
      resize(element);
      expect(readingPosition()).toBe(atTop);
    },
  );

  it('measures the current header when a task summary has wrapped since arrival', async () => {
    const geometry = scrollGeometry();
    const { client } = await setup();
    const { element, readingPosition } = geometry.attach();
    geometry.wrapSummary();
    client.setQueryData(['agentSessions', 'session', 'session'], {
      ...session,
      links: [
        link('1', 'In progress', 'active'),
        link('2', 'In review', 'attention'),
      ],
    });
    await screen.findByRole('button', { name: /Tasks 2/ });
    element.scrollTop = 120;
    const before = readingPosition();
    fireEvent.wheel(element, { deltaY: 10 });
    expect(element.scrollTop).toBe(60);
    resize(element);
    expect(readingPosition()).toBe(before);
  });
  it('fits a mobile keyboard viewport and restores the shell height on close', async () => {
    const viewport = Object.assign(new EventTarget(), {
      height: 350,
      offsetTop: 0,
      scale: 1,
    });
    vi.stubGlobal('visualViewport', viewport);
    vi.stubGlobal('innerHeight', 800);
    await setup();
    const root = screen.getByRole('region', {
      name: session.title,
    }).parentElement!;
    expect(root.style.height).toBe('350px');
    viewport.height = 800;
    viewport.dispatchEvent(new Event('resize'));
    expect(root.style.height).toBe('');
  });
  it('shows no tasks on arrival and opens the existing work panel', async () => {
    await setup();
    const summary = screen.getByRole('button', { name: /Tasks 0.*No tasks/ });
    fireEvent.click(summary);
    expect(
      screen.getByRole('complementary', { name: 'Session details' }),
    ).toBeTruthy();
    expect(screen.getByText(/This session has no tasks yet/)).toBeTruthy();
  });

  it('keeps actual status labels, counts and the task entry after collapse and query updates', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        const title = this.querySelector('header h2');
        return title ? (title.classList.contains('truncate') ? 80 : 140) : 0;
      },
    );
    const { client } = await setup([
      link('1', 'In progress', 'active'),
      link('2', 'In progress', 'active'),
      link('3', 'In review', 'attention'),
      link('4', 'Cancelled', 'done'),
    ]);
    const summary = screen.getByRole('button', { name: /Tasks 4/ });
    expect(within(summary).getByText('In progress 2')).toBeTruthy();
    expect(within(summary).getByText('Cancelled 1')).toBeTruthy();
    const scroller = screen
      .getByRole('region', { name: session.title })
      .querySelector('.overflow-y-auto');
    expect(scroller).toBeTruthy();
    (scroller as HTMLDivElement).scrollTop = 120;
    fireEvent.wheel(scroller!, { deltaY: 100 });
    expect((scroller as HTMLDivElement).scrollTop).toBe(60);
    expect(
      screen.getByRole('heading', { name: session.title }).className,
    ).toContain('truncate');
    expect(screen.getByRole('button', { name: /Tasks 4/ })).toBeTruthy();
    client.setQueryData(['agentSessions', 'session', 'session'], {
      ...session,
      links: [link('1', 'Done', 'done')],
    });
    await screen.findByRole('button', { name: /Tasks 1.*Done 1/ });
  });

  it('expands the reply without losing multiline text and keeps the draft on a failed send', async () => {
    const { requests } = await setup();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'First line\nSecond line' } });
    const fileInput = document.querySelector('input[type="file"]')!;
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['image'], 'sample.png', { type: 'image/png' })],
      },
    });
    await waitFor(() =>
      expect(document.querySelector('img')?.getAttribute('src')).toContain(
        'data:image/png;base64,',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand input' }));
    expect((input as HTMLTextAreaElement).value).toBe(
      'First line\nSecond line',
    );
    expect(document.activeElement).toBe(input);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse input' }));
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(requests.mock.calls.some(([call]) => call.method === 'POST')).toBe(
      false,
    );
    requests.mockImplementation(({ method }) =>
      method === 'POST' ? new Response(null, { status: 500 }) : { data: [] },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Send' }).hasAttribute('disabled'),
      ).toBe(false),
    );
    expect((input as HTMLTextAreaElement).value).toBe(
      'First line\nSecond line',
    );
    expect(document.querySelector('img')).toBeTruthy();
  });
});

it('says what the bridge is doing while the agent opens, then that the agent is working', async () => {
  let current: Session = { ...session, running: true, startup: 'starting' };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  await renderWithApp(
    <QueryClientProvider client={client}>
      <SessionView sessionId='session' />
    </QueryClientProvider>,
    {
      plugins: [plugin({ routes: false })],
      namespace: '@nocobase/app-plugin-agent-sessions',
      fetch: answerApi(({ path, method }) =>
        path === 'agentSessions/sessions/session' && method === 'GET'
          ? { data: current }
          : { data: [], meta: {} },
      ),
      route: '/agent-sessions/session',
    },
  );
  await screen.findByText('Starting the agent on your computer…');
  current = { ...current, startup: null };
  await act(async () => {
    await client.refetchQueries();
  });
  await screen.findByText('The agent is working…');
});
