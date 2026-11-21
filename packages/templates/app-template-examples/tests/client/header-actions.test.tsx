import type {
  AppClientBadge,
  AppClientRegisteredHeaderAction,
} from '@nocobase/app-client';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { useSyncExternalStore, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HeaderActionBar } from '../../client/layouts/components/header-actions.js';
import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/header-actions-test', resources: enUS },
  strict: false,
});

function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

/** A badge store a test changes while the bar is mounted, as a hook with its own data would. */
function badgeStore(initial: AppClientBadge | undefined) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    set(next: AppClientBadge | undefined) {
      value = next;
      for (const listener of listeners) listener();
    },
    useBadge: () =>
      useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => value,
      ),
  };
}

function action(
  name: string,
  badge?: () => AppClientBadge | undefined,
): AppClientRegisteredHeaderAction {
  return {
    name,
    order: 0,
    auth: 'required',
    packageName: '@example/plugin',
    source: 'plugin',
    component: () => <button type='button'>{name}</button>,
    ...(badge ? { badge } : {}),
  };
}

function setWidth(width: number) {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('matchMedia', () => ({
    matches: width < 768,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

afterEach(() => vi.unstubAllGlobals());

const slotOf = (name: string) =>
  screen.getByRole('button', { name }).closest('[data-header-action]')!;

describe('header actions', () => {
  it('renders the actions in the given order before the account menu, with their badges', async () => {
    setWidth(1440);
    const inbox = badgeStore({ count: 4, tone: 'attention' });
    render(
      <HeaderActionBar
        actions={[
          action('assistant'),
          action('inbox', inbox.useBadge),
          action('hidden', () => undefined),
        ]}
      >
        <button type='button'>Account</button>
      </HeaderActionBar>,
      { wrapper: I18n },
    );
    const bar = screen.getByTestId('header-actions');
    expect(
      within(bar)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['assistant', 'inbox', 'hidden', 'Account']);
    const badge = slotOf('inbox').querySelector(
      '[data-slot="header-action-badge"]',
    );
    expect(badge).toHaveTextContent('4');
    expect(badge).toHaveAttribute('data-tone', 'attention');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(
      slotOf('hidden').querySelector('[data-slot="header-action-badge"]'),
    ).toBeNull();

    act(() => inbox.set({ count: 0 }));
    expect(
      slotOf('inbox').querySelector('[data-slot="header-action-badge"]'),
    ).toBeNull();
    act(() => inbox.set({ count: 120 }));
    expect(
      slotOf('inbox').querySelector('[data-slot="header-action-badge"]'),
    ).toHaveTextContent('99+');
  });

  it('keeps the first action on a phone and moves the rest into More, which carries their counts', async () => {
    setWidth(390);
    const user = userEvent.setup();
    const mail = badgeStore({ count: 2 });
    render(
      <HeaderActionBar
        actions={[
          action('assistant'),
          action('inbox', () => ({ count: 3, tone: 'attention' })),
          action('mail', mail.useBadge),
        ]}
      />,
      { wrapper: I18n },
    );
    expect(screen.getByRole('button', { name: 'assistant' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^inbox/ })).toBeNull();
    const more = screen.getByRole('button', { name: 'More actions' });
    const moreBadge = more.querySelector('[data-slot="header-action-badge"]');
    expect(moreBadge).toHaveTextContent('5');
    expect(moreBadge).toHaveAttribute('data-tone', 'attention');

    await user.click(more);
    const popup = await screen.findByRole('dialog', { name: 'More actions' });
    expect(
      within(popup)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['inbox', 'mail']);
    act(() => mail.set(undefined));
    expect(moreBadge).toHaveTextContent('3');
  });

  it('shows two actions on a phone without a More button', () => {
    setWidth(390);
    render(
      <HeaderActionBar actions={[action('assistant'), action('inbox')]} />,
      {
        wrapper: I18n,
      },
    );
    expect(screen.getByRole('button', { name: 'inbox' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
  });
});

it('registers the Agent chat button in the header, next to the account menu', async () => {
  const [{ headerActions, headerActionOverrides }, { ChatHeaderButton }] =
    await Promise.all([
      import('../../client/header-actions.js'),
      import('../../client/extensions/nocobase-agent-chat/launchers.js'),
    ]);
  expect(headerActions).toEqual([
    { name: 'agent-chat', order: 900, component: ChatHeaderButton },
  ]);
  expect(headerActionOverrides).toEqual([]);
});
