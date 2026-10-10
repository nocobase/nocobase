import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { useTranslation } from '@nocobase/i18n/client';
import { GitMergeIcon } from 'lucide-react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { IssueWaitingSection } from '../../client/inbox/issue-waiting';
import {
  defineInboxRenderer,
  type InboxRegistry,
} from '@/extensions/nocobase-inbox/registry';
import { InboxRegistryProvider } from '@/extensions/nocobase-inbox/registry-scope';
import { entriesOf } from '@/extensions/nocobase-inbox/model';
import type { InboxItem } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import type { InboxNotice } from '../../shared/inbox';

vi.mock('@nocobase/i18n/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/i18n/client')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en-US' },
    }),
  };
});

vi.mock('@nocobase/app-plugin-notification-in-app/client/inbox', () => ({
  useInboxActions: () => ({ mark: vi.fn(), readAll: vi.fn(), pending: false }),
}));

vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  PmTag: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock('../../client/inbox/use-waiting.js', () => ({
  useWaiting: () => ({ data: entries }),
}));

function item(id: string, overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id,
    deliveryId: `d-${id}`,
    notificationId: `n-${id}`,
    title: `Title ${id}`,
    body: `Body ${id}`,
    createdAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
  };
}

function notice(id: string, overrides: Partial<InboxNotice>): InboxNotice {
  return {
    notificationId: `n-${id}`,
    source: 'git',
    kind: 'decision',
    type: 'pr_merge_requested',
    subject: null,
    decisionKey: 'k1',
    data: null,
    count: 1,
    resolvedAt: null,
    outcome: null,
    ...overrides,
  };
}

const entries = entriesOf(
  [item('pr-1')],
  [
    notice('pr-1', {
      data: {
        issueId: 'issue-1',
        identifier: 'PM-120',
        pullRequestId: 'pr-1',
        repo: 'nocobase/nocobase',
        number: 10606,
        url: 'https://github.com/nocobase/nocobase/pull/10606',
        title: 'fix(spa): refresh runtime configuration in development HTML',
      },
    }),
  ],
);

/** A pull request card, worded like the git contributor's real renderer. */
const prRenderer = defineInboxRenderer({
  source: 'git',
  icon: () => GitMergeIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: () => t('Pull request'),
      text: (entry) => ({
        title: `${entry.notice?.data?.identifier}: merge ${entry.notice?.data?.repo}#${entry.notice?.data?.number}`,
        sentence: String(entry.notice?.data?.title ?? ''),
        sentenceHref: String(entry.notice?.data?.url ?? ''),
      }),
    };
  },
});

const registry = (renderers: InboxRegistry['renderers']): InboxRegistry => ({
  renderers,
  feeds: [],
});

function renderSection(given: InboxRegistry) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <InboxRegistryProvider registry={given}>
          <IssueWaitingSection
            issue={{ id: 'issue-1' } as unknown as IssueDetail}
          />
        </InboxRegistryProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('the pull request waiting card on the issue page', () => {
  it('opens the pull request from its title, in a new tab', () => {
    renderSection(registry([prRenderer]));

    const link = screen.getByRole('link', {
      name: /fix\(spa\): refresh runtime configuration in development HTML/,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/nocobase/nocobase/pull/10606',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('renders the sentence as plain text when the contributor gives no link', () => {
    const noLinkRenderer = defineInboxRenderer({
      source: 'git',
      icon: () => GitMergeIcon,
      // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
      useWording() {
        return {
          label: () => 'Pull request',
          text: (entry) => ({
            title: `merge ${entry.notice?.data?.repo}#${entry.notice?.data?.number}`,
            sentence: String(entry.notice?.data?.title ?? ''),
          }),
        };
      },
    });

    renderSection(registry([noLinkRenderer]));

    const sentence = screen.getByText(
      'fix(spa): refresh runtime configuration in development HTML',
    );
    expect(sentence).toBeInTheDocument();
    expect(sentence.closest('a')).toBeNull();
  });
});
