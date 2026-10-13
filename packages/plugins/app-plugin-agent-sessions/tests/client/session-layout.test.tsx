import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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

beforeEach(() => {
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
      observe() {}
      disconnect() {}
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

describe('session mobile layout', () => {
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
