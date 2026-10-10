import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import releases from '../client/plugin.js';
import AppPage from '../client/pages/app-page.js';
import { allPermissions, ACCESS_NAMESPACE } from '../shared/access.js';
import type { AppSummary, ObservedState } from '../shared/releases.js';
import { appSummary } from './helpers/app-summary.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function page(initial: AppSummary, locale = 'en-US', tab = '') {
  let summary = initial;
  let failure = 0;
  let failOperation = false;
  let afterOperation: (() => Promise<unknown>) | undefined;
  const calls: ApiCall[] = [];
  const view = await renderWithApp(
    <>
      <Link to='/apps/other'>Other app</Link>
      <Routes>
        <Route path='/apps/:appId' element={<AppPage />} />
      </Routes>
    </>,
    {
      plugins: [releases({ routes: false })],
      namespace: ACCESS_NAMESPACE,
      locale,
      route: `/apps/shop${tab}`,
      fetch: answerApi(async (call) => {
        calls.push(call);
        if (call.path === 'releases/me')
          return {
            data: {
              userId: 'user',
              kind: 'human',
              permissions: allPermissions(),
            },
          };
        if (/releases\/apps\/[^/]+$/.test(call.path)) {
          if (failure) return new Response(null, { status: failure });
          if (afterOperation) return afterOperation();
          return { data: summary };
        }
        if (call.method === 'POST') {
          summary = {
            ...summary,
            runtime: {
              ...summary.runtime,
              state: call.path.endsWith('/stop') ? 'stopped' : 'running',
            },
          };
          if (failOperation) return new Response(null, { status: 500 });
          return { data: summary };
        }
        if (call.path.endsWith('/config'))
          return { data: { mode: 'managed', content: 'app: {}', secrets: [] } };
        if (call.path.endsWith('/initialAdmin'))
          return new Response(null, { status: 404 });
        return { data: [], meta: { total: 0 } };
      }),
    },
  );
  await screen.findByRole('tab', {
    name: locale === 'en-US' ? 'Overview' : '概览',
  });
  return {
    ...view,
    calls,
    setSummary: (next: AppSummary) => {
      summary = next;
    },
    setFailure: (status: number) => {
      failure = status;
    },
    failOperation: () => {
      failOperation = true;
    },
    deferRefresh: (next: (() => Promise<unknown>) | undefined) => {
      afterOperation = next;
    },
  };
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const enabled = (name: string): boolean => {
  const button = screen.getByRole('button', { name });
  return (
    !button.hasAttribute('disabled') &&
    button.getAttribute('aria-disabled') !== 'true'
  );
};

describe('application runtime operations', () => {
  it.each([
    ['running', false, true, true],
    ['stopped', true, false, false],
    ['dormant', true, false, false],
    ['failed', true, false, false],
    ['pending', false, false, false],
    ['starting', false, false, false],
    ['unknown', false, false, false],
  ] as const)(
    'offers the right operations for %s and never sends disabled ones',
    async (state, start, stop, restart) => {
      const view = await page(appSummary(state));
      for (const [name, available] of [
        ['Start', start],
        ['Stop', stop],
        ['Restart', restart],
      ] as const) {
        expect(enabled(name)).toBe(available);
        if (!available) fireEvent.click(screen.getByRole('button', { name }));
      }
      expect(view.calls.filter((call) => call.method === 'POST')).toHaveLength(
        0,
      );
    },
  );

  it.each(['deployment', 'unavailable'] as const)(
    'disables all operations while %s',
    async (reason) => {
      const summary = appSummary();
      await page(
        reason === 'deployment'
          ? { ...summary, hasPendingDeployment: true }
          : { ...summary, runtime: { ...summary.runtime, available: false } },
      );
      expect(['Start', 'Stop', 'Restart'].map(enabled)).toEqual([
        false,
        false,
        false,
      ]);
    },
  );

  it.each(['permission', 'deployment'] as const)(
    'hides operations without %s',
    async (missing) => {
      const summary = appSummary();
      await page(
        missing === 'permission'
          ? { ...summary, allowed: ['read'] }
          : { ...summary, app: { ...summary.app, currentDeploymentId: null } },
      );
      expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Restart' })).toBeNull();
    },
  );

  it.each([
    ['en-US', 'Start', 'The app is already running.'],
    ['zh-CN', '启动', '应用已在运行。'],
  ])(
    'explains disabled operations on keyboard focus and hover in %s',
    async (locale, name, reason) => {
      const view = await page(appSummary(), locale);
      const user = userEvent.setup();
      const button = screen.getByRole('button', { name });
      await user.tab();
      await user.tab();
      await user.tab();
      expect(button).toHaveFocus();
      expect(await screen.findByRole('tooltip')).toHaveTextContent(reason);
      expect(button).toHaveAccessibleDescription(reason);
      await user.keyboard('{Enter}');
      expect(view.calls.filter((call) => call.method === 'POST')).toHaveLength(
        0,
      );
      await user.tab();
      await user.hover(button);
      expect(await screen.findByRole('tooltip')).toHaveTextContent(reason);
    },
  );

  it('refreshes after stop and start and keeps all operations locked until the refresh settles', async () => {
    const view = await page(appSummary());
    let finish!: (value: unknown) => void;
    view.deferRefresh(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    await act(async () => {});
    expect(['Start', 'Stop', 'Restart'].map(enabled)).toEqual([
      false,
      false,
      false,
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    await act(async () => {
      finish({ data: appSummary('stopped') });
    });
    expect(['Start', 'Stop', 'Restart'].map(enabled)).toEqual([
      true,
      false,
      false,
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await act(async () => {});
    await act(async () => {
      finish({ data: appSummary() });
    });
    expect(['Start', 'Stop', 'Restart'].map(enabled)).toEqual([
      false,
      true,
      true,
    ]);
    expect(
      view.calls
        .filter((call) => call.method === 'POST')
        .map((call) => call.path),
    ).toEqual(['releases/apps/shop/stop', 'releases/apps/shop/start']);
  });

  it('refreshes even when an operation fails after changing runtime state', async () => {
    const view = await page(appSummary());
    view.failOperation();
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    await act(async () => {});
    expect(enabled('Start')).toBe(true);
    expect(view.toasts().some((toast) => toast.type === 'error')).toBe(true);
  });

  it('drops the old app response and drafts when navigating to another application', async () => {
    const view = await page(appSummary(), 'en-US', '?tab=settings');
    fireEvent.change(await screen.findByLabelText('config.yml'), {
      target: { value: 'app: { draft: true }' },
    });
    let finish!: (value: unknown) => void;
    view.deferRefresh(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await act(async () => {});
    view.deferRefresh(undefined);
    view.setSummary(appSummary('stopped', 'other'));
    fireEvent.click(screen.getByRole('link', { name: 'Other app' }));
    expect(await screen.findByRole('heading', { name: 'other' })).toBeVisible();
    await act(async () => {
      finish({ data: appSummary() });
    });
    expect(enabled('Start')).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(await screen.findByLabelText('config.yml')).toHaveValue('app: {}');
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await act(async () => {});
    expect(
      view.calls
        .filter((call) => call.method === 'POST')
        .map((call) => call.path),
    ).toEqual(['releases/apps/other/start']);
  });

  it('tracks external state changes and deployment completion without losing a config draft', async () => {
    const view = await page(appSummary(), 'en-US', '?tab=settings');
    const config = await screen.findByLabelText('config.yml');
    fireEvent.change(config, { target: { value: 'app: { draft: true }' } });
    vi.useFakeTimers();
    // Visibility refresh starts the polling timer under the fake clock.
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    for (const state of [
      'stopped',
      'dormant',
      'starting',
      'running',
      'failed',
    ] satisfies ObservedState[]) {
      view.setSummary(appSummary(state));
      await advance(5000);
      expect(enabled('Start')).toBe(
        ['stopped', 'dormant', 'failed'].includes(state),
      );
      expect(config).toHaveValue('app: { draft: true }');
    }
    view.setSummary({ ...appSummary(), hasPendingDeployment: true });
    await advance(5000);
    const before = view.calls.filter((call) =>
      call.path.endsWith('/deployments'),
    ).length;
    view.setSummary(appSummary());
    await advance(1500);
    expect(
      view.calls.filter((call) => call.path.endsWith('/deployments')),
    ).toHaveLength(before + 1);
  });

  it('shows one recoverable refresh error, disables stale operations and restores them after retry', async () => {
    const view = await page(appSummary());
    view.setFailure(503);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not refresh the app state.',
    );
    expect(['Start', 'Stop', 'Restart'].map(enabled)).toEqual([
      false,
      false,
      false,
    ]);
    view.setFailure(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Refresh' })[0]!);
    await act(async () => {});
    expect(screen.queryByRole('alert')).toBeNull();
    expect(enabled('Stop')).toBe(true);
  });
});
