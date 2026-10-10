/**
 * The issue page's Code and deployments section: each linked pull request as one compact row (its ready preview's Open
 * in the row) unfolding into its previews (a ready one with its address, a blocked one with the form that sets what it
 * misses, unfolded at first) and the environments its change was deployed to, matched by its merge commit; "Link" opens
 * the link-by-URL input, unlinking asks first, and an issue with nothing to show leaves the section out for the add
 * bar's "Pull request".
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IssuePullRequest } from '../../shared/git.js';
import type {
  DeployMark,
  IssuePreviews,
  PreviewView,
} from '../../shared/previews.js';

const request = vi.fn();

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request }),
  useService: () => ({ subscribe: () => () => undefined }),
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.ref ? `${String(options.role)} ✓ ${String(options.ref)}` : key,
    i18n: { language: 'en-US' },
  }),
}));
vi.mock('../../client/access/notify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
  errorText: () => 'failed',
}));

const { IssueCodeAddButton, IssueCodeSection } =
  await import('../../client/issues/detail/code-section.js');

function pullRequest(
  number: number,
  overrides: Partial<IssuePullRequest> = {},
): IssuePullRequest {
  return {
    id: `pr${number}`,
    repo: 'acme/shop',
    number,
    url: `https://github.com/acme/shop/pull/${number}`,
    title: `Change ${number}`,
    state: 'open',
    draft: false,
    headRef: `feature/${number}`,
    baseRef: 'main',
    headSha: String(number).padStart(40, 'a'),
    mergeCommitSha: null,
    authorLogin: 'zhang',
    mergeableState: 'clean',
    ciState: 'success',
    checks: [],
    mergedAt: null,
    mergedBy: null,
    mergedManually: false,
    closedAt: null,
    snapshotAt: null,
    linkedBy: { type: 'system', id: null, name: null },
    autoCompleteDisabled: false,
    linkedAt: '2026-10-06T00:00:00.000Z',
    mergeBlocker: null,
    ...overrides,
  };
}

function preview(
  number: number,
  overrides: Partial<PreviewView> = {},
): PreviewView {
  return {
    id: `pv${number}`,
    resourceId: 'r1',
    targetAppId: 'web',
    targetAppName: 'Web',
    appId: `web-pr-${number}`,
    environmentId: 'preview',
    status: 'ready',
    url: `https://web-pr-${number}.example.com/`,
    pullRequest: {
      repo: 'acme/shop',
      number,
      url: `https://github.com/acme/shop/pull/${number}`,
      title: `Change ${number}`,
      state: 'open',
    },
    sha: 'f'.repeat(40),
    deployedSha: 'f'.repeat(40),
    build: null,
    releaseId: 'rel1',
    deploymentId: 'dep1',
    error: null,
    missingVariables: [],
    runtime: null,
    admin: null,
    updatedAt: '2026-10-06T00:00:00.000Z',
    createdAt: '2026-10-06T00:00:00.000Z',
    ...overrides,
  };
}

function mark(overrides: Partial<DeployMark>): DeployMark {
  return {
    role: 'production',
    status: 'deployed',
    appId: 'shop-production',
    environmentId: 'production',
    environmentName: 'Production',
    sha: 'c'.repeat(40),
    version: '1.4.0',
    deploymentId: 'd1',
    withdrawnByDeploymentId: null,
    withdrawnVersion: null,
    deployedAt: '2026-10-05T03:01:37.000Z',
    ...overrides,
  };
}

const MERGED = pullRequest(9, {
  state: 'merged',
  mergeCommitSha: 'c'.repeat(40),
  mergedAt: '2026-10-04T00:00:00.000Z',
});

function answer({
  pullRequests,
  previews,
  marks,
  labels = [],
}: {
  readonly pullRequests: readonly IssuePullRequest[];
  readonly previews: readonly PreviewView[];
  readonly marks: readonly DeployMark[];
  readonly labels?: IssuePreviews['labels'];
}) {
  const state: IssuePreviews = {
    issueId: 'i1',
    identifier: 'PM-1',
    labels,
    previews,
    blocker: null,
    canEdit: true,
    canSetEnvironmentVariables: true,
  };
  request.mockImplementation(({ path }: { path: string }) => {
    if (path === 'git/pullRequests')
      return Promise.resolve({
        data: pullRequests,
        meta: {
          suggestions: [],
          canMerge: true,
          canLink: true,
          applicable: true,
        },
      });
    if (path === 'previews/status') return Promise.resolve({ data: state });
    if (path === 'deploys/marks')
      return Promise.resolve({ data: { i1: marks } });
    return Promise.reject(new Error(`unexpected ${path}`));
  });
}

const ISSUE = { id: 'i1', identifier: 'PM-1', revision: 1 } as never;

/** The section with the add bar's button beside it, sharing whether the link input is open, as the page does. */
function Page() {
  const [linking, setLinking] = useState(false);
  return (
    <>
      <IssueCodeAddButton
        issue={ISSUE}
        linking={linking}
        setLinking={setLinking}
      />
      <IssueCodeSection
        issue={ISSUE}
        linking={linking}
        setLinking={setLinking}
      />
    </>
  );
}

function show() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Page />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function unfold(row: HTMLElement): void {
  fireEvent.click(
    within(row).getByRole('button', {
      name: 'studioGit.section.details',
    }),
  );
}

async function rowOf(number: number): Promise<HTMLElement> {
  await screen.findByText(`Change ${number}`);
  const row = document.querySelector<HTMLElement>(
    `[data-pull-request="${number}"]`,
  );
  if (!row) throw new Error(`no row for #${number}`);
  return row;
}

beforeEach(() => {
  request.mockReset();
});

describe('IssueCodeSection', () => {
  it('shows the confirmed no-preview state instead of waiting for a preview', async () => {
    answer({
      pullRequests: [pullRequest(12)],
      previews: [],
      marks: [],
      labels: [
        { pullRequestId: 'pr12', present: true, managed: true, failed: false },
      ],
    });
    show();
    unfold(await rowOf(12));
    expect(
      await screen.findByText('previews.preference.skipped'),
    ).toBeVisible();
    expect(screen.queryByText('studioGit.section.noPreview')).toBeNull();
  });
  it('keeps an existing preview available and reports a failed label synchronization', async () => {
    answer({
      pullRequests: [pullRequest(12)],
      previews: [preview(12)],
      marks: [],
      labels: [
        { pullRequestId: 'pr12', present: true, managed: true, failed: true },
      ],
    });
    show();
    const row = await rowOf(12);
    expect(
      await within(row).findByRole('button', {
        name: /studioGit.section.openPreview/u,
      }),
    ).toHaveAttribute('href', 'https://web-pr-12.example.com/');
    unfold(row);
    expect(
      await screen.findByText('previews.preference.syncFailed'),
    ).toBeVisible();
    expect(
      await screen.findByText('https://web-pr-12.example.com/'),
    ).toBeVisible();
  });
  it('puts each preview under its own pull request: a ready one with its address, a blocked one with its form', async () => {
    answer({
      pullRequests: [pullRequest(12), pullRequest(13)],
      previews: [
        preview(12, {
          status: 'blocked',
          url: null,
          deploymentId: null,
          missingVariables: [
            { name: 'SMTP_HOST', description: null, secret: false },
          ],
        }),
        preview(13),
      ],
      marks: [],
    });
    show();
    const blocked = await rowOf(12);
    expect(await within(blocked).findByLabelText('SMTP_HOST')).toBeInstanceOf(
      HTMLInputElement,
    );
    expect(
      within(blocked).getByText('previews.variables.scopeEnvironment'),
    ).toBeTruthy();
    expect(within(blocked).queryByText(/web-pr-13/u)).toBeNull();

    const ready = await rowOf(13);
    expect(
      (
        await within(ready).findByRole('button', {
          name: /studioGit.section.openPreview/u,
        })
      ).getAttribute('href'),
    ).toBe('https://web-pr-13.example.com/');
    expect(
      within(ready).queryByText('https://web-pr-13.example.com/'),
    ).toBeNull();
    unfold(ready);
    expect(
      await within(ready).findByText('https://web-pr-13.example.com/'),
    ).toBeTruthy();
    expect(ready.querySelector('[data-preview-status="ready"]')).not.toBeNull();
    expect(within(ready).queryByLabelText('SMTP_HOST')).toBeNull();
    expect(screen.getByText('studioGit.section.codeTitle')).toBeTruthy();
    expect(
      screen.queryByLabelText('studioGit.section.linkPlaceholder'),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'studioGit.section.link' }),
    );
    expect(
      screen.getByLabelText('studioGit.section.linkPlaceholder'),
    ).toBeTruthy();
  });

  it('shows where a merged pull request went by its merge commit, and an unknown commit under the only merged one', async () => {
    answer({
      pullRequests: [pullRequest(12), MERGED],
      previews: [],
      marks: [
        mark({}),
        mark({
          role: 'staging',
          appId: 'shop-staging',
          environmentId: 'staging',
          environmentName: 'Staging',
          sha: 'd'.repeat(40),
          version: '1.4.1-rc.1',
        }),
      ],
    });
    show();
    const merged = await rowOf(9);
    unfold(merged);
    expect(await within(merged).findByText('Production ✓ 1.4.0')).toBeTruthy();
    expect(within(merged).getByText('Staging ✓ ddddddd')).toBeTruthy();
    const open = await rowOf(12);
    expect(open.querySelector('[data-deploy-mark]')).toBeNull();
    expect(document.querySelector('[data-studio-code-unmatched]')).toBeNull();
  });

  it('asks before unlinking, saying what leaves the issue', async () => {
    answer({ pullRequests: [pullRequest(12)], previews: [], marks: [] });
    show();
    const row = await rowOf(12);
    fireEvent.click(
      within(row).getByRole('button', {
        name: 'studioGit.section.more',
      }),
    );
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'studioGit.section.unlink' }),
    );
    expect(
      await screen.findByText('studioGit.confirm.unlinkTitle'),
    ).toBeTruthy();
    expect(screen.getByText('studioGit.confirm.unlinkBody')).toBeTruthy();
    expect(
      request.mock.calls.some(
        ([options]) => (options as { method?: string }).method === 'DELETE',
      ),
    ).toBe(false);
  });

  it('leaves the section out without anything to show, for the add bar to open it with the link input', async () => {
    answer({ pullRequests: [], previews: [], marks: [] });
    show();
    const add = await screen.findByRole('button', {
      name: 'studioGit.section.title',
    });
    expect(document.querySelector('[data-studio-code]')).toBeNull();
    fireEvent.click(add);
    expect(document.querySelector('[data-studio-code]')).not.toBeNull();
    expect(screen.getByText('studioGit.section.empty')).toBeTruthy();
    const input = screen.getByLabelText('studioGit.section.linkPlaceholder');
    expect(document.activeElement).toBe(input);
    expect(
      screen.queryByRole('button', { name: 'studioGit.section.title' }),
    ).toBeNull();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(document.querySelector('[data-studio-code]')).toBeNull();
  });

  it('shows what an agent pushed without a pull request as one row of its own', async () => {
    answer({
      pullRequests: [pullRequest(12), pullRequest(13)],
      previews: [],
      marks: [mark({ sha: 'e'.repeat(40) })],
    });
    show();
    await rowOf(12);
    const other = await waitForElement('[data-studio-code-unmatched]');
    expect(within(other).getByText('studioGit.section.unmatched')).toBeTruthy();
    expect(
      within(other).getByText('studioGit.section.unmatchedHint'),
    ).toBeTruthy();
    expect(within(other).getByText('Production ✓ 1.4.0')).toBeTruthy();
  });
});

async function waitForElement(selector: string): Promise<HTMLElement> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) return element;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`no ${selector}`);
}
