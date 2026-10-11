/**
 * The header's inbox button: the count of decisions waiting on the viewer (99+ at most), the unread count when none
 * waits, a label and tab title that say which, and the active state on the inbox itself.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';

import { InboxHeaderButton } from '../../client/inbox/header-button';

const state = { decision: 0, unread: 0 };

vi.mock('../../client/inbox/hooks.js', () => ({
  useInboxRefresh: () => undefined,
  usePendingDecisions: () => ({ data: { decision: state.decision } }),
  useUnreadCount: () => ({ data: state.unread }),
}));
vi.mock('../../client/inbox/use-registry.js', () => ({
  usePendingFeeds: () => [],
}));
vi.mock('../../client/inbox/chime.js', () => ({
  armInboxChime: () => undefined,
  playInboxChime: () => undefined,
  useInboxChime: () => ({ enabled: false }),
}));
// Keys stand for their text, with the count appended, so a test can tell which label was chosen and with what count.
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options?.count === undefined ? key : `${key}:${options.count}`,
  }),
}));

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <TooltipProvider>
        <InboxHeaderButton />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe('the header inbox button', () => {
  beforeEach(() => {
    state.decision = 0;
    state.unread = 0;
    document.title = 'Studio';
  });

  it('links to the inbox and counts the decisions waiting, in its label and the tab title', () => {
    state.decision = 3;
    state.unread = 5;
    renderAt('/issues');
    const button = screen.getByRole('link', { name: 'inbox.headerPending:3' });
    expect(button).toHaveAttribute('href', '/inbox');
    expect(button).not.toHaveAttribute('aria-current');
    const badge = screen.getByTestId('studio-inbox-badge');
    expect(badge).toHaveTextContent('3');
    expect(badge).toHaveAttribute('data-kind', 'decisions');
    expect(document.title).toBe('(3) Studio');
  });

  it('caps the badge at 99+ while the label keeps the full count', () => {
    state.decision = 120;
    renderAt('/');
    expect(screen.getByTestId('studio-inbox-badge')).toHaveTextContent('99+');
    expect(
      screen.getByRole('link', { name: 'inbox.headerPending:120' }),
    ).toBeVisible();
  });

  it('counts the unread items, apart from decisions, when none waits', () => {
    state.unread = 2;
    renderAt('/');
    const badge = screen.getByTestId('studio-inbox-badge');
    expect(badge).toHaveTextContent('2');
    expect(badge).toHaveAttribute('data-kind', 'unread');
    expect(
      screen.getByRole('link', { name: 'inbox.headerUnread:2' }),
    ).toBeVisible();
    expect(document.title).toBe('(2) Studio');
  });

  it('caps the unread count at 99+ too', () => {
    state.unread = 250;
    renderAt('/');
    expect(screen.getByTestId('studio-inbox-badge')).toHaveTextContent('99+');
    expect(
      screen.getByRole('link', { name: 'inbox.headerUnread:250' }),
    ).toBeVisible();
    expect(document.title).toBe('(99+) Studio');
  });

  it('shows neither with nothing waiting or unread, and is marked current on the inbox', () => {
    renderAt('/inbox');
    const button = screen.getByRole('link', { name: 'inbox.title' });
    expect(button).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByTestId('studio-inbox-badge')).not.toBeInTheDocument();
    expect(document.title).toBe('Studio');
  });
});
