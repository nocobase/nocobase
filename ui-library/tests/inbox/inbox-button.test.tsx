import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, renderHook, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';

import { TooltipProvider } from '#components/ui/tooltip';

import {
  inboxBadge,
  inboxBadgeText,
  inboxTitle,
  useDocumentTitleBadge,
} from '../../registry/inbox/inbox-badge';
import { InboxButton } from '../../registry/inbox/inbox-button';
import { readmeTranslations } from '../readme-translations';

const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/test-app',
    resources: readmeTranslations('inbox')['en-US'],
  },
});

function renderAt(path: string, decisions: number, unread: number): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <TestI18nProvider runtime={runtime}>
        <TooltipProvider>
          <InboxButton badge={inboxBadge(decisions, unread)} />
        </TooltipProvider>
      </TestI18nProvider>
    </MemoryRouter>,
  );
}

describe('the inbox badge', () => {
  beforeEach(() => {
    document.title = 'Acme';
  });

  it('counts what waits, the unread items only when nothing waits, and caps at 99+', () => {
    expect(inboxBadgeText(0)).toBeNull();
    expect(inboxBadgeText(120)).toBe('99+');
    expect(inboxBadge(3, 7)).toEqual({
      kind: 'decisions',
      count: 3,
      text: '3',
    });
    expect(inboxBadge(0, 100)).toEqual({
      kind: 'unread',
      count: 100,
      text: '99+',
    });
    expect(inboxBadge(0, 0)).toBeNull();
  });

  it('prefixes the tab title once, and takes the prefix off when unmounted', () => {
    expect(inboxTitle(inboxTitle('Acme', '3'), '4')).toBe('(4) Acme');
    const { rerender, unmount } = renderHook(
      ({ text }: { text: string | null }) => useDocumentTitleBadge(text),
      { initialProps: { text: '3' as string | null } },
    );
    expect(document.title).toBe('(3) Acme');
    rerender({ text: null });
    expect(document.title).toBe('Acme');
    rerender({ text: '5' });
    unmount();
    expect(document.title).toBe('Acme');
  });
});

describe('the inbox button', () => {
  it('links to the inbox and says how many wait', () => {
    renderAt('/issues', 3, 5);
    const button = screen.getByRole('link', { name: 'Inbox, 3 waiting' });
    expect(button).toHaveAttribute('href', '/inbox');
    expect(button).not.toHaveAttribute('aria-current');
    const badge = screen.getByTestId('nocobase-inbox-badge');
    expect(badge).toHaveTextContent('3');
    expect(badge).toHaveAttribute('data-kind', 'decisions');
  });

  it('counts the unread items when nothing waits', () => {
    renderAt('/', 0, 250);
    expect(screen.getByTestId('nocobase-inbox-badge')).toHaveTextContent('99+');
    expect(
      screen.getByRole('link', { name: 'Inbox, 250 unread' }),
    ).toBeVisible();
  });

  it('shows no badge with nothing to count, and is current on the inbox', () => {
    renderAt('/inbox', 0, 0);
    expect(screen.getByRole('link', { name: 'Inbox' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByTestId('nocobase-inbox-badge')).toBeNull();
  });
});
