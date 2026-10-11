/**
 * The merge action and the webhook settings in the browser: Merge greyed out with the reason Studio last read, the
 * confirmation that checks GitHub and sends back the head it showed, and the webhook's write-only secret with its setup
 * wizard.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  GitRepoSettings,
  PullRequestMergePreflight,
} from '../../shared/git';
import { MergeButtons } from '../../client/git/pull-requests';
import { WebhookSection } from '../../client/git/webhook-section';

const api = {
  preflight: vi.fn<() => Promise<PullRequestMergePreflight>>(),
  merge: vi.fn(),
  act: vi.fn(),
  updateRepo: vi.fn(),
  repo: vi.fn(),
};

vi.mock('../../client/git/api', async (importOriginal) => {
  const { useQuery } = await import('@tanstack/react-query');
  return {
    ...(await importOriginal<typeof import('../../client/git/api')>()),
    useGitApi: () => api,
    useRepoSettings: (resourceId: string) =>
      useQuery({
        queryKey: ['repo', resourceId],
        queryFn: () => api.repo(resourceId),
      }),
  };
});
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  PmStatusBadge: ({ statusKey }: { statusKey: string }) => (
    <span>{`status:${statusKey}`}</span>
  ),
  pmKeys: {
    issue: (id: string) => ['pm', 'issue', id],
    issues: ['pm', 'issues'],
  },
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' },
  }),
}));
vi.mock('../../client/access/notify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const wrap = (ui: ReactElement) => (
  <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
);

const issue = { id: 'i1', identifier: 'PM-1' };
const pull = (mergeBlocker: PullRequestMergePreflight['blocker']) => ({
  id: 'p1',
  repo: 'acme/studio',
  number: 12,
  state: 'open' as const,
  mergeBlocker,
});

const preflight = (
  overrides: Partial<PullRequestMergePreflight> = {},
): PullRequestMergePreflight => ({
  blocker: null,
  method: 'squash',
  headSha: 'abc1234567890',
  baseRef: 'main',
  commitTitle: 'Fix login (#12)',
  statusAfter: { statusKey: 'done', statusName: 'Done', keepReason: null },
  ...overrides,
});

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
});

describe('the merge action', () => {
  it('is greyed out with the reason while Studio last read a blocker', () => {
    render(wrap(<MergeButtons issue={issue} pullRequest={pull('ciFailed')} />));
    expect(
      screen.getByRole('button', { name: /studioGit.section.merge$/u }),
    ).toBeDisabled();
    expect(
      screen.getByText('studioGit.merge.blocker.ciFailed'),
    ).toBeInTheDocument();
    // Marking merged is not a merge on GitHub: it stays offered.
    expect(
      screen.getByRole('button', { name: 'studioGit.section.markMerged' }),
    ).toBeEnabled();
  });

  it('checks GitHub, says what happens to the issue, and merges the head it showed', async () => {
    api.preflight.mockResolvedValue(preflight());
    api.merge.mockResolvedValue({});
    render(wrap(<MergeButtons issue={issue} pullRequest={pull(null)} />));
    fireEvent.click(
      screen.getByRole('button', { name: /studioGit.section.merge$/u }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText('Fix login (#12)'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('status:done')).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'studioGit.merge.confirm' }),
    );
    await waitFor(() =>
      expect(api.merge).toHaveBeenCalledWith('i1', 'p1', 'abc1234567890'),
    );
  });

  it('refuses to confirm what GitHub says cannot be merged now, and says why', async () => {
    api.preflight.mockResolvedValue(
      preflight({
        blocker: 'computing',
        statusAfter: {
          statusKey: null,
          statusName: null,
          keepReason: 'otherPrs',
        },
      }),
    );
    render(wrap(<MergeButtons issue={issue} pullRequest={pull(null)} />));
    fireEvent.click(
      screen.getByRole('button', { name: /studioGit.section.merge$/u }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText('studioGit.merge.blocker.computing'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('studioGit.merge.keep.otherPrs'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'studioGit.merge.confirm' }),
    ).toBeDisabled();
  });
});

const settings = (
  overrides: Partial<GitRepoSettings> = {},
): GitRepoSettings => ({
  repo: 'acme/studio',
  apiBaseUrl: 'https://api.github.com',
  webUrl: 'https://github.com/acme/studio',
  hasToken: true,
  wakeOnChecks: true,
  wakeOnConflict: true,
  polledAt: null,
  pollError: null,
  webhookUrl: '/main/api/webhooks/github/repositories/r1',
  hasWebhookSecret: false,
  lastDelivery: null,
  lastReceivedAt: null,
  webhookHealthy: false,
  pollSeconds: 60,
  ...overrides,
});

describe('the webhook settings', () => {
  it('shows a receipt even without a relevant last delivery', () => {
    const at = new Date().toISOString();
    render(
      wrap(
        <WebhookSection
          resourceId='w1'
          settings={settings({ lastReceivedAt: at })}
        />,
      ),
    );
    expect(document.querySelector('[data-last-received]')).toHaveAttribute(
      'data-last-received',
      at,
    );
    expect(
      screen.getByText('studioGit.webhook.noDelivery'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('studioGit.webhook.lastReceived'),
    ).toBeInTheDocument();
  });
  it('sets up the webhook: payload URL, a generated secret saved first, and GitHub’s steps', async () => {
    api.repo.mockResolvedValue(settings());
    api.updateRepo.mockResolvedValue(settings({ hasWebhookSecret: true }));
    render(wrap(<WebhookSection resourceId='w1' settings={settings()} />));
    expect(screen.getByText('studioGit.webhook.notSet')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'studioGit.webhook.setUp' }),
    );
    const wizard = await screen.findByRole('dialog');
    expect(
      await within(wizard).findByText(
        `${window.location.origin}/main/api/webhooks/github/repositories/r1`,
      ),
    ).toBeInTheDocument();
    const secret = within(wizard).getByText(/^[0-9a-f]{64}$/u).textContent;
    expect(within(wizard).getByText('application/json')).toBeInTheDocument();
    fireEvent.click(
      within(wizard).getByRole('button', { name: 'studioGit.webhook.save' }),
    );
    await waitFor(() =>
      expect(api.updateRepo).toHaveBeenCalledWith('w1', {
        webhookSecret: secret,
      }),
    );
    expect(
      await within(wizard).findByText('studioGit.webhook.secretSaved'),
    ).toBeInTheDocument();
  });

  it('shows a set secret only as set, with replace, clear and the last delivery', () => {
    render(
      wrap(
        <WebhookSection
          resourceId='w1'
          settings={settings({
            hasWebhookSecret: true,
            lastDelivery: {
              at: new Date().toISOString(),
              event: 'ping',
              status: 'invalidSignature',
              reason: null,
            },
          })}
        />,
      ),
    );
    expect(screen.getByText('studioGit.webhook.set')).toBeInTheDocument();
    for (const name of [
      'studioGit.webhook.guide',
      'studioGit.webhook.replace',
      'studioGit.webhook.clear',
    ])
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    expect(
      document.querySelector('[data-last-delivery="invalidSignature"]'),
    ).not.toBeNull();
  });
});
