import type {
  IssuePullRequest,
  PullRequestMergePreflight,
} from '../shared/git.js';
import { expect, open, test, unique } from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';

// Local browser verification only: all Git responses are simulated, including the merge submission.
for (const entry of ['issue', 'inbox'] as const) {
  test(`${entry}: failed CI opens force confirmation without permitting an ordinary merge`, async ({
    page,
    api,
  }) => {
    const me = await api.get<{ userId: string }>('projects/me');
    const issue = await api.post<Issue>('projects/issues', {
      title: `Force merge entry ${unique()}`,
      ownerUserId: me.userId,
    });
    const pr: IssuePullRequest = {
      id: 'browser-pr',
      repo: 'example/test',
      number: 12,
      url: 'https://github.com/example/test/pull/12',
      title: 'Browser test',
      state: 'open',
      draft: false,
      headRef: 'fix/test',
      baseRef: 'main',
      headSha: 'abc1234567890',
      mergeCommitSha: null,
      authorLogin: 'tester',
      mergeableState: 'blocked',
      ciState: 'failure',
      checks: [
        {
          kind: 'check',
          name: 'test',
          status: 'completed',
          conclusion: 'failure',
          url: null,
        },
      ],
      mergedAt: null,
      mergedBy: null,
      mergedManually: false,
      closedAt: null,
      snapshotAt: null,
      linkedBy: { type: 'system', id: null, name: null },
      linkedAt: new Date().toISOString(),
      autoCompleteDisabled: false,
      mergeBlocker: 'ciFailed',
    };
    const preflight: PullRequestMergePreflight = {
      blocker: 'ciFailed',
      method: 'squash',
      headSha: pr.headSha,
      baseRef: 'main',
      commitTitle: 'Browser test (#12)',
      statusAfter: { statusKey: 'done', statusName: 'Done', keepReason: null },
      failedChecks: [{ name: 'test', url: null }],
      referenceFailures: [],
      canForce: true,
    };
    await page.route('**/api/git/status', (route) =>
      route.fulfill({ json: { data: { enabled: true } } }),
    );
    await page.route('**/api/git/pullRequests?*', (route) =>
      route.fulfill({
        json: {
          data: [pr],
          meta: {
            suggestions: [],
            canMerge: true,
            canLink: false,
            applicable: true,
          },
        },
      }),
    );
    await page.route(
      '**/api/git/pullRequests/browser-pr/checkMerge?*',
      (route) => route.fulfill({ json: { data: preflight } }),
    );
    const submitted: unknown[] = [];
    await page.route('**/api/git/pullRequests/browser-pr/merge?*', (route) => {
      submitted.push(route.request().postDataJSON());
      return route.fulfill({ json: { data: { ...pr, state: 'merged' } } });
    });
    if (entry === 'inbox') {
      await page.route('**/api/inbox/pending', (route) =>
        route.fulfill({ json: { data: { decision: 1, info: 0 } } }),
      );
      await page.route('**/api/inbox/waiting*', (route) =>
        route.fulfill({
          json: {
            data: [
              {
                item: {
                  id: 'browser-item',
                  deliveryId: 'browser-delivery',
                  notificationId: 'browser-notice',
                  title: issue.title,
                  body: '',
                  createdAt: new Date().toISOString(),
                },
                notice: {
                  notificationId: 'browser-notice',
                  source: 'git',
                  kind: 'decision',
                  type: 'pr_merge_requested',
                  subject: {
                    type: 'issue',
                    id: issue.id,
                    label: issue.identifier,
                  },
                  decisionKey: 'browser-pr',
                  count: 1,
                  resolvedAt: null,
                  outcome: null,
                  data: {
                    issueId: issue.id,
                    identifier: issue.identifier,
                    issueTitle: issue.title,
                    pullRequestId: pr.id,
                    repo: pr.repo,
                    number: pr.number,
                    title: pr.title,
                    url: pr.url,
                  },
                },
              },
            ],
          },
        }),
      );
      await open(page, '/inbox');
      await page
        .getByRole('button', { name: new RegExp(issue.identifier) })
        .first()
        .click();
    } else {
      await open(page, `/issues/${issue.identifier}`);
    }
    const merge = page.locator('[data-action="merge"]');
    await expect(merge).toBeEnabled();
    await merge.click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.locator('[data-action="confirm-merge"]'),
    ).toBeDisabled();
    expect(submitted).toEqual([]);
    await dialog.locator('[data-action="force-merge"]').click();
    const confirm = dialog.locator('[data-action="confirm-force-merge"]');
    await expect(confirm).toBeDisabled();
    await dialog.locator('textarea').fill('Local simulated upstream failure');
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect
      .poll(() => submitted)
      .toEqual([
        {
          expectedHeadSha: pr.headSha,
          force: true,
          reason: 'Local simulated upstream failure',
        },
      ]);
  });
}
