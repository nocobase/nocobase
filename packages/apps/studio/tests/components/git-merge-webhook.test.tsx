/**
 * The merge action and the webhook settings: failed CI opens a fresh preflight, other blockers disable the entry,
 * confirmation sends back the head it showed, and the webhook keeps its secret write-only behind its setup wizard.
 */
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
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  GitRepoSettings,
  IssuePullRequest,
  PullRequestMergePreflight,
} from '../../shared/git';
import { MergeButtons, PullRequestRow } from '../../client/git/pull-requests';
import { gitKeys } from '../../client/git/api';
import { GitRepoSection } from '../../client/git/repo-section';
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
    useGitStatus: () => ({ data: { enabled: true } }),
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
const pull = (
  mergeBlocker: PullRequestMergePreflight['blocker'],
): IssuePullRequest => ({
  id: 'p1',
  repo: 'acme/studio',
  number: 12,
  state: 'open' as const,
  mergeBlocker,
  url: 'https://github.com/acme/studio/pull/12',
  title: 'Fix login',
  draft: false,
  headRef: 'fix/login',
  baseRef: 'main',
  headSha: 'abc1234567890',
  mergeCommitSha: null,
  authorLogin: 'alice',
  mergeableState: 'blocked',
  ciState: 'failure',
  checks: [],
  mergedAt: null,
  mergedBy: null,
  mergedManually: false,
  closedAt: null,
  snapshotAt: null,
  linkedBy: { type: 'system', id: null, name: null },
  autoCompleteDisabled: false,
  linkedAt: '2026-10-12T00:00:00.000Z',
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
  failedChecks: [],
  referenceFailures: [],
  canForce: false,
  ...overrides,
});

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
});

describe.each(['inbox', 'issue'] as const)('the %s merge action', (entry) => {
  const renderMerge = (blocker: PullRequestMergePreflight['blocker']) => {
    const client = new QueryClient();
    const view = render(
      <QueryClientProvider client={client}>
        {entry === 'inbox' ? (
          <MergeButtons issue={issue} pullRequest={pull(blocker)} />
        ) : (
          <ul>
            <PullRequestRow
              issue={issue}
              pullRequest={pull(blocker)}
              canMerge
              canLink={false}
            />
          </ul>
        )}
      </QueryClientProvider>,
    );
    return { ...view, client };
  };

  it.each(['ciPending', 'ciMissing', 'conflicts', 'draft'] as const)(
    'keeps the %s list entry disabled',
    (blocker) => {
      renderMerge(blocker);
      expect(
        screen.getByRole('button', { name: /studioGit.section.merge$/u }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: /studioGit.section.merge$/u }),
      ).toHaveAttribute('title', `studioGit.merge.blocker.${blocker}`);
      expect(api.preflight).not.toHaveBeenCalled();
    },
  );

  it('checks GitHub, says what happens to the issue, and merges the head it showed', async () => {
    api.preflight.mockResolvedValue(preflight());
    api.merge.mockResolvedValue({});
    renderMerge(null);
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
    renderMerge(null);
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

  it('lists failed reference checks without blocking the merge', async () => {
    api.preflight.mockResolvedValue(
      preflight({
        referenceFailures: [
          { name: 'Studio preview', url: 'https://ci.example/7' },
        ],
      }),
    );
    renderMerge(null);
    fireEvent.click(
      screen.getByRole('button', { name: /studioGit.section.merge$/u }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByRole('link', { name: 'Studio preview' }),
    ).toHaveAttribute('href', 'https://ci.example/7');
    expect(
      within(dialog).getByText('studioGit.merge.referenceFailures'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'studioGit.merge.confirm' }),
    ).toBeEnabled();
  });

  it.each(['ciPending', 'ciMissing'] as const)(
    'does not offer force for %s even with failed checks',
    async (blocker) => {
      api.preflight.mockResolvedValue(
        preflight({
          blocker,
          failedChecks: [{ name: 'test', url: null }],
          canForce: true,
        }),
      );
      renderMerge('ciFailed');
      fireEvent.click(
        screen.getByRole('button', { name: /studioGit.section.merge$/u }),
      );
      const dialog = await screen.findByRole('dialog');
      await within(dialog).findByText(`studioGit.merge.blocker.${blocker}`);
      expect(
        within(dialog).queryByRole('button', { name: 'studioGit.merge.force' }),
      ).not.toBeInTheDocument();
      expect(
        within(dialog).getByRole('button', { name: 'studioGit.merge.confirm' }),
      ).toBeDisabled();
      expect(api.merge).not.toHaveBeenCalled();
    },
  );

  it('merges past failed required checks only with a reason, for whoever may force it', async () => {
    api.preflight.mockResolvedValue(
      preflight({
        blocker: 'ciFailed',
        failedChecks: [{ name: 'test', url: null }],
        canForce: true,
      }),
    );
    api.merge.mockResolvedValue({});
    renderMerge('ciFailed');
    fireEvent.click(
      screen.getByRole('button', { name: /studioGit.section.merge$/u }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('test')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'studioGit.merge.confirm' }),
    ).toBeDisabled();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'studioGit.merge.force' }),
    );
    const confirm = within(dialog).getByRole('button', {
      name: 'studioGit.merge.force',
    });
    expect(confirm).toBeDisabled();
    fireEvent.change(
      within(dialog).getByLabelText('studioGit.merge.forceReason'),
      { target: { value: 'Flaky upstream test' } },
    );
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(api.merge).toHaveBeenCalledWith('i1', 'p1', 'abc1234567890', {
        reason: 'Flaky upstream test',
      }),
    );
  });

  it('says only a manager may merge past failed checks', async () => {
    api.preflight.mockResolvedValue(
      preflight({
        blocker: 'ciFailed',
        failedChecks: [{ name: 'test', url: null }],
      }),
    );
    renderMerge('ciFailed');
    fireEvent.click(
      screen.getByRole('button', { name: /studioGit.section.merge$/u }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText('studioGit.merge.forceOnly'),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'studioGit.merge.force' }),
    ).toBeNull();
    const confirm = within(dialog).getByRole('button', {
      name: 'studioGit.merge.confirm',
    });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(api.merge).not.toHaveBeenCalled();
  });

  it.each([
    { blocker: 'ciFailed' as const, canForce: false },
    { blocker: 'ciPending' as const, canForce: true },
    { blocker: 'ciMissing' as const, canForce: true },
  ])(
    'stops force confirmation when refreshed preflight becomes $blocker / $canForce',
    async (next) => {
      api.preflight.mockResolvedValue(
        preflight({ blocker: 'ciFailed', canForce: true }),
      );
      const { client } = renderMerge('ciFailed');
      fireEvent.click(
        screen.getByRole('button', { name: /studioGit.section.merge$/u }),
      );
      const dialog = await screen.findByRole('dialog');
      fireEvent.click(
        await within(dialog).findByRole('button', {
          name: 'studioGit.merge.force',
        }),
      );
      fireEvent.change(
        within(dialog).getByLabelText('studioGit.merge.forceReason'),
        { target: { value: 'Upstream failure' } },
      );
      expect(
        within(dialog).getByRole('button', { name: 'studioGit.merge.force' }),
      ).toBeEnabled();
      api.preflight.mockResolvedValue(preflight(next));
      await act(async () => {
        await client.invalidateQueries({
          queryKey: gitKeys.preflight('i1', 'p1'),
        });
      });
      await waitFor(() =>
        expect(
          within(dialog).queryByRole('button', {
            name: 'studioGit.merge.force',
          }),
        ).not.toBeInTheDocument(),
      );
      const confirm = within(dialog).getByRole('button', {
        name: 'studioGit.merge.confirm',
      });
      expect(confirm).toBeDisabled();
      fireEvent.click(confirm);
      expect(api.merge).not.toHaveBeenCalled();
    },
  );
});

const settings = (
  overrides: Partial<GitRepoSettings> = {},
): GitRepoSettings => ({
  repo: 'acme/studio',
  apiBaseUrl: 'https://api.github.com',
  webUrl: 'https://github.com/acme/studio',
  hasToken: true,
  wakeOnChecks: true,
  wakeOnChecksPassed: false,
  wakeOnConflict: true,
  referenceChecks: [],
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

describe('a repository’s settings', () => {
  it('switches what wakes the project manager: failing checks, passing checks and conflicts', async () => {
    const stored = {
      ...settings(),
      branchRules: ['agent/{key}'],
      connection: { id: 'c1', name: 'GitHub' },
    } as unknown as GitRepoSettings;
    api.repo.mockResolvedValue(stored);
    api.updateRepo.mockResolvedValue({
      ...stored,
      wakeOnChecksPassed: true,
    });
    render(
      wrap(
        <GitRepoSection resource={{ id: 'r1', type: 'gitRepo' } as never} />,
      ),
    );
    const passed = await screen.findByRole('switch', {
      name: 'studioGit.repo.wakeOnChecksPassed',
    });
    expect(
      screen.getByRole('switch', { name: 'studioGit.repo.wakeOnChecks' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('switch', { name: 'studioGit.repo.wakeOnConflict' }),
    ).toBeInTheDocument();
    expect(passed).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(passed);
    await waitFor(() =>
      expect(api.updateRepo).toHaveBeenCalledWith('r1', {
        wakeOnChecksPassed: true,
      }),
    );
  });
});
