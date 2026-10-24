import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import demoMode from '../../client/index.js';

type ObserverCallback = (list: { getEntries(): PerformanceEntry[] }) => void;

/** Stands in for the browser's resource timing, which jsdom does not report. */
class FakePerformanceObserver {
  public static readonly instances: FakePerformanceObserver[] = [];
  public constructor(public readonly callback: ObserverCallback) {
    FakePerformanceObserver.instances.push(this);
  }
  public observe(): void {}
  public disconnect(): void {}
  public finish(...metrics: string[]): void {
    const entry = {
      serverTiming: metrics.map((name) => ({ name })),
    } as unknown as PerformanceEntry;
    this.callback({ getEntries: () => [entry] });
  }
}

const statusApi = (enabled: boolean) =>
  answerApi((call) => {
    if (call.method === 'GET' && call.path === 'demoMode/status') {
      return { data: { enabled } };
    }
    return new Response(null, { status: 404 });
  });

afterEach(() => {
  vi.unstubAllGlobals();
  FakePerformanceObserver.instances.length = 0;
});

describe('demo mode notice', () => {
  it('tells visitors of a demo when a change is refused', async () => {
    vi.stubGlobal('PerformanceObserver', FakePerformanceObserver);
    const rendered = await renderWithApp(<p>page</p>, {
      plugins: [demoMode()],
      fetch: statusApi(true),
      locale: 'zh-CN',
    });

    expect(await screen.findByText('page')).toBeInTheDocument();
    await waitFor(() =>
      expect(FakePerformanceObserver.instances).toHaveLength(1),
    );

    const observer = FakePerformanceObserver.instances.at(-1);
    act(() => observer?.finish('total'));
    expect(rendered.toasts()).toEqual([]);

    act(() => observer?.finish('demo-read-only'));
    expect(rendered.toasts()).toMatchObject([
      { type: 'warning', title: '演示模式不能修改' },
    ]);
  });

  it('stays out of the way when the application is not a demo', async () => {
    vi.stubGlobal('PerformanceObserver', FakePerformanceObserver);
    const fetch = vi.fn(statusApi(false));
    await renderWithApp(<p>page</p>, {
      plugins: [demoMode()],
      fetch,
    });

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(await screen.findByText('page')).toBeInTheDocument();
    expect(FakePerformanceObserver.instances).toEqual([]);
  });
});
