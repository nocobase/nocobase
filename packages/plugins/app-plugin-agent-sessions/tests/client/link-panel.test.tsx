import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LinkBar } from '../../client/components/link-bar.js';
import { SessionView } from '../../client/components/session-view.js';
import { StatusPill } from '../../client/components/status-pill.js';
import {
  AgentSessionsConfigContext,
  type LinkPanelProps,
} from '../../client/config.js';
import { sessionFacts } from '../../client/lib/facts.js';
import { byIcon, linkIcon, waitingFirst } from '../../client/lib/tones.js';
import plugin from '../../client/plugin.js';
import type {
  Session,
  SessionLink,
  SessionLinkIcon,
} from '../../shared/api.js';

function link(
  refId: string,
  icon: SessionLinkIcon | undefined,
  needsYou: string | null = null,
  tone: NonNullable<SessionLink['status']>['tone'] = 'idle',
): SessionLink {
  return {
    kind: 'issue',
    refId,
    key: `PM-${refId}`,
    title: `Task ${refId}`,
    group: null,
    status: {
      label: `Label ${refId}`,
      tone,
      ...(icon ? { icon, needsYou } : {}),
    },
    href: `/issues/PM-${refId}`,
    startable: false,
    decidedAt: null,
  };
}

const session: Session = {
  id: 'session',
  computerId: 'computer',
  agentId: 'codex',
  cwd: '/workspace',
  title: 'Improve the session start',
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('link status', () => {
  it('draws the application icon, or the tone for older data', () => {
    expect(linkIcon(link('1', 'closed'))).toBe('closed');
    expect(linkIcon(link('2', undefined, null, 'done'))).toBe('done');
    expect(linkIcon(link('3', undefined, null, 'attention'))).toBe('review');
    const { container } = render(
      <StatusPill status={link('4', 'blocked').status!} />,
    );
    expect(
      container.querySelector('[data-status-shape=blocked]'),
    ).not.toBeNull();
    expect(container.textContent).toBe('Label 4');
  });

  it('says what waits for the viewer instead of the status', () => {
    const { container } = render(
      <StatusPill
        status={link('1', 'review', 'Needs your acceptance').status!}
      />,
    );
    expect(container.textContent).toBe('Needs your acceptance');
  });

  it('orders the bar done, closed, in review, started, blocked, not started', () => {
    const links = (
      ['backlog', 'blocked', 'started', 'review', 'closed', 'done'] as const
    ).map((icon, n) => link(String(n), icon));
    expect(byIcon(links).map(linkIcon)).toEqual([
      'done',
      'closed',
      'review',
      'started',
      'blocked',
      'backlog',
    ]);
    const { container } = render(<LinkBar links={links} />);
    expect(container.querySelectorAll('span > span')).toHaveLength(6);
  });

  it('counts the records waiting for the viewer, those first in the list', () => {
    const links = [
      link('1', 'done'),
      link('2', 'review', 'Needs your acceptance'),
      link('3', 'blocked'),
      link('4', undefined, null, 'attention'),
    ];
    const facts = sessionFacts({ ...session, links });
    expect(facts.waitingLinks).toBe(2);
    expect(facts.needsMe).toBe(true);
    expect(waitingFirst(links).map((item) => item.refId)).toEqual([
      '2',
      '4',
      '1',
      '3',
    ]);
  });
});

function Where(): ReactElement {
  const location = useLocation();
  return <output data-testid='where'>{location.search}</output>;
}

function Panel({ link: shown, index, total, onNext, onClose }: LinkPanelProps) {
  return (
    <div data-testid='panel'>
      {shown.key} {index}/{total}
      <button type='button' onClick={onNext}>
        next
      </button>
      <button type='button' onClick={onClose}>
        close
      </button>
    </div>
  );
}

describe('link panels', () => {
  it('opens a task beside the conversation from the summary, waiting first, and moves with J', async () => {
    const links = [
      link('1', 'done'),
      link('2', 'review', 'Needs you'),
      link('3', 'started'),
    ];
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const requests = vi.fn(({ path, method }: ApiCall): unknown => {
      if (path === 'agentSessions/sessions/session' && method === 'GET')
        return { data: { ...session, links } };
      return { data: [], meta: {} };
    });
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        disconnect(): void {}
      },
    );
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: query.includes('min-width'),
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    await renderWithApp(
      <QueryClientProvider client={client}>
        <AgentSessionsConfigContext.Provider
          value={{
            cli: 'nb-studio',
            connectPrompt: null,
            linkPanels: { issue: Panel },
          }}
        >
          <SessionView sessionId='session' />
          <Where />
        </AgentSessionsConfigContext.Provider>
      </QueryClientProvider>,
      {
        plugins: [plugin({ routes: false })],
        namespace: '@nocobase/app-plugin-agent-sessions',
        fetch: answerApi(requests),
        route: '/agent-sessions/session',
      },
    );
    await screen.findByRole('heading', { name: session.title });
    // Finish the router transition and its keyboard effect before sending a key.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Tasks 3/u }));
    });
    const panel = await screen.findByTestId('panel');
    expect(panel.textContent).toContain('PM-2 2/3');
    expect(screen.getByTestId('where').textContent).toBe('?issue=2');
    await act(async () => {
      fireEvent.keyDown(window, { key: 'j' });
    });
    await waitFor(() =>
      expect(screen.getByTestId('panel').textContent).toContain('PM-3 3/3'),
    );
    await act(async () => {
      fireEvent.click(within(screen.getByTestId('panel')).getByText('close'));
    });
    await waitFor(() => expect(screen.queryByTestId('panel')).toBeNull());
    expect(screen.getByTestId('where').textContent).toBe('');
  });
});
