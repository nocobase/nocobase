import type { RealtimeClient } from '@nocobase/app-client';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUnreadCount: vi.fn(),
  realtime: {
    connected: false,
    subscribe: vi.fn(),
    onOpen: vi.fn(),
    onError: vi.fn(),
    reconnect: vi.fn(),
    close: vi.fn(),
  } satisfies RealtimeClient,
  cleanup: vi.fn(),
  subscribe: vi.fn(),
  refresh: undefined as (() => void) | undefined,
}));

vi.mock('@nocobase/app-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/app-client')>();
  return {
    ...actual,
    useService: (token: unknown) =>
      token === actual.realtimeClientToken ? mocks.realtime : undefined,
  };
});

vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({
    t: (_key: string, options: { count?: number } = {}) =>
      `${options.count ?? 0} unread messages`,
  }),
}));

vi.mock('../../client/runtime.js', () => {
  const mail = { getUnreadCount: mocks.getUnreadCount };
  return { useMailClient: () => mail };
});

vi.mock('../../client/subscription.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../client/subscription.js')>()),
  subscribeToMailInvalidations: vi.fn(
    (_realtime: RealtimeClient, _target: Window, refresh: () => void) => {
      mocks.refresh = refresh;
      return mocks.cleanup;
    },
  ),
}));

import {
  MailNavigationIcon,
  MAIL_UNREAD_COUNT_CHANGED_EVENT,
} from '../../client/components/mail-navigation-icon.js';

describe('MailNavigationIcon', () => {
  beforeEach(() => {
    mocks.getUnreadCount.mockReset();
    mocks.cleanup.mockClear();
  });

  it('refreshes immediately after a read change and hides the badge at zero', async () => {
    mocks.getUnreadCount.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    render(<MailNavigationIcon />);
    await screen.findByLabelText('1 unread messages');
    act(() => {
      window.dispatchEvent(new Event(MAIL_UNREAD_COUNT_CHANGED_EVENT));
    });
    await waitFor(() =>
      expect(
        screen.queryByLabelText('1 unread messages'),
      ).not.toBeInTheDocument(),
    );
    expect(mocks.getUnreadCount).toHaveBeenCalledTimes(2);
  });

  it('does not restore an old count when an earlier refresh finishes late', async () => {
    let finishOld!: (count: number) => void;
    mocks.getUnreadCount
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishOld = resolve;
          }),
      )
      .mockResolvedValueOnce(2);
    render(<MailNavigationIcon />);
    act(() => {
      window.dispatchEvent(new Event(MAIL_UNREAD_COUNT_CHANGED_EVENT));
    });
    expect(mocks.getUnreadCount).toHaveBeenCalledOnce();
    await act(async () => {
      finishOld(5);
    });
    expect(await screen.findByLabelText('2 unread messages')).toBeVisible();
    expect(
      screen.queryByLabelText('5 unread messages'),
    ).not.toBeInTheDocument();
  });

  it('coalesces local and realtime bursts with one trailing refresh during a pending request', async () => {
    const pending = Promise.withResolvers<number>();
    mocks.getUnreadCount
      .mockResolvedValueOnce(50)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(0);
    render(<MailNavigationIcon />);
    await screen.findByLabelText('50 unread messages');
    const burst = () => {
      for (let i = 0; i < 50; i++) {
        mocks.refresh?.();
        window.dispatchEvent(new Event(MAIL_UNREAD_COUNT_CHANGED_EVENT));
      }
    };
    act(burst);
    await waitFor(() => expect(mocks.getUnreadCount).toHaveBeenCalledTimes(2));
    act(burst);
    await act(async () => {
      pending.resolve(25);
    });
    await waitFor(() => expect(mocks.getUnreadCount).toHaveBeenCalledTimes(3));
    await waitFor(() =>
      expect(
        screen.queryByLabelText('50 unread messages'),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByLabelText('25 unread messages'),
    ).not.toBeInTheDocument();
  });

  it('renders the unread badge and refreshes its count from realtime invalidations', async () => {
    mocks.getUnreadCount.mockResolvedValueOnce(4).mockResolvedValueOnce(7);

    const view = render(<MailNavigationIcon />);

    expect(
      await screen.findByLabelText('4 unread messages'),
    ).toBeInTheDocument();
    mocks.refresh?.();
    await waitFor(() =>
      expect(screen.getByLabelText('7 unread messages')).toBeInTheDocument(),
    );

    view.unmount();
    expect(mocks.cleanup).toHaveBeenCalledOnce();
  });
});
