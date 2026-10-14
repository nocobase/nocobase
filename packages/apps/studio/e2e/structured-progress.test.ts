import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  expect,
  open,
  test,
  unique,
  signIn,
  server,
} from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';

test.use({ user: 'admin', locale: 'en-US' });

test('structured requests survive later explanations and locate their latest comment', async ({
  page,
  api,
  context,
}) => {
  test.setTimeout(180_000);
  const suffix = unique();
  const owner = {
    email: `progress-${suffix}@example.com`,
    password: 'isolated-progress-test-password',
  };
  await api.post('users', {
    ...owner,
    name: 'Progress test owner',
    roleScopes: { studio: ['admin'] },
  });
  await signIn(context, owner);
  await api.patch('users/me/preferences', { locale: 'en-US' });
  const me = await api.get<{ userId: string }>('projects/me');
  const settings = await api.get<{
    name: string;
    firstChoiceAgentId: string | null;
    fallbackAgentId: string | null;
  }>('projectManager');
  const runner = new FakeRunner(api, `progress-${suffix}`, true);
  const agent = await runner.agent();
  const captures = process.env.PM352_SCREENSHOTS_DIR;
  const records: object[] = [];
  const created: Issue[] = [];
  const needsYou =
    'Choose whether to retry the recovery now. Confirm the execution machine is ready.';
  const next = 'Resume implementation after the owner confirms recovery.';
  const reviewNeeds =
    'Review the completed progress cards. Approve the result or send it back with feedback.';
  const reviewNext = 'Address the acceptance feedback before final delivery.';
  try {
    await api.patch('projectManager', {
      name: 'Project manager',
      firstChoiceAgentId: agent,
      fallbackAgentId: null,
    });
    const make = async (title: string) => {
      const issue = await api.post<Issue>('projects/issues', {
        title,
        ownerUserId: me.userId,
        statusKey: 'in_progress',
        start: false,
      });
      created.push(issue);
      await api.post(`projectManager/issues/${issue.id}/start`);
      const run = await runner.start(issue.identifier);
      return { issue, run, headers: { 'x-nocobase-run-token': run.token } };
    };
    const blocked = await make('Confirm execution recovery');
    const comment = (content: string) =>
      api.post<{ comment: { id: string } }>(
        `projects/issues/${blocked.issue.id}/comments`,
        { content },
        blocked.headers,
      );
    const old = await comment(
      'Outdated explanation: wait for the old checkout. Needs you: an obsolete decision.',
    );
    await api.patch(
      `projects/issues/${blocked.issue.id}`,
      { statusKey: 'blocked', needsYou, next },
      blocked.headers,
    );
    await open(page, `/issues/${blocked.issue.identifier}`);
    const summary = page.getByTestId('issue-summary');
    const explanation = summary.getByRole('link', {
      name: 'View the project manager’s latest explanation',
    });
    await expect(summary.getByTestId('issue-needs-you')).toContainText(
      needsYou,
    );
    await expect(summary).toContainText(next);
    await expect(explanation).toHaveAttribute(
      'href',
      new RegExp(`comment=${old.comment.id}`),
    );
    const latest = await comment(
      'Current recovery explanation. The owner must confirm readiness; this detail is kept in the conversation.',
    );
    await expect(explanation).toHaveAttribute(
      'href',
      new RegExp(`comment=${latest.comment.id}`),
    );
    await expect(summary.getByTestId('issue-needs-you')).toContainText(
      needsYou,
    );
    await expect(summary).not.toContainText('Outdated explanation');
    await expect(summary).not.toContainText('Current recovery explanation');
    const target = page.locator(`[data-comment-id="${latest.comment.id}"]`);
    await page.setViewportSize({ width: 1440, height: 480 });
    await summary.scrollIntoViewIfNeeded();
    await expect(target).not.toBeInViewport();
    const beforeClick = await target.boundingBox();
    await explanation.click();
    await expect(target).toBeInViewport();
    await expect(target).toHaveClass(/ring-primary/u);
    const afterClick = await target.boundingBox();
    expect(afterClick!.y).toBeLessThan(beforeClick!.y);
    records.push({
      kind: 'blocked',
      issue: blocked.issue.identifier,
      url: page.url(),
      oldComment: old.comment.id,
      latestComment: latest.comment.id,
      fullText: needsYou,
      next,
      scrolled: true,
      beforeClickY: beforeClick!.y,
      afterClickY: afterClick!.y,
      highlighted: true,
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await summary.scrollIntoViewIfNeeded();
    if (captures) {
      mkdirSync(captures, { recursive: true });
      await page.screenshot({
        path: path.join(captures, 'pm352-blocked-detail.png'),
        fullPage: true,
      });
    }
    await api.delete(`projects/comments/${latest.comment.id}`);
    await expect(explanation).toHaveAttribute(
      'href',
      new RegExp(`comment=${old.comment.id}`),
    );
    await expect(summary.getByTestId('issue-needs-you')).toContainText(
      needsYou,
    );
    const final = await comment(
      'Final recovery explanation after removing the superseded note.',
    );
    await expect(explanation).toHaveAttribute(
      'href',
      new RegExp(`comment=${final.comment.id}`),
    );
    await api.patch(
      `projects/issues/${blocked.issue.id}`,
      { next: 'Dispatch the next step after recovery confirmation.' },
      blocked.headers,
    );
    await expect(summary).toContainText(
      'Dispatch the next step after recovery confirmation.',
    );
    await runner.complete(blocked.run.runId, 'Recovery decision requested.');
    const review = await make('Accept structured progress cards');
    const reviewComment = await api.post<{ comment: { id: string } }>(
      `projects/issues/${review.issue.id}/comments`,
      {
        content:
          'Acceptance explanation: check the original requests, next steps and comment positioning.',
      },
      review.headers,
    );
    await api.patch(
      `projects/issues/${review.issue.id}`,
      { statusKey: 'in_review', needsYou: reviewNeeds, next: reviewNext },
      review.headers,
    );
    await runner.complete(review.run.runId, 'Ready for acceptance.');
    await open(page, `/issues/${review.issue.identifier}`);
    await expect(summary.getByTestId('issue-needs-you')).toContainText(
      reviewNeeds,
    );
    await expect(summary).toContainText(reviewNext);
    await expect(
      summary.getByRole('button', { name: 'Send back', exact: true }),
    ).toBeVisible();
    const reviewTarget = page.locator(
      `[data-comment-id="${reviewComment.comment.id}"]`,
    );
    await page.setViewportSize({ width: 1440, height: 480 });
    await summary.scrollIntoViewIfNeeded();
    await expect(reviewTarget).not.toBeInViewport();
    const reviewBefore = await reviewTarget.boundingBox();
    await summary
      .getByRole('link', {
        name: 'View the project manager’s latest explanation',
      })
      .click();
    await expect(reviewTarget).toBeInViewport();
    await expect(reviewTarget).toHaveClass(/ring-primary/u);
    const reviewAfter = await reviewTarget.boundingBox();
    expect(reviewAfter!.y).toBeLessThan(reviewBefore!.y);
    records.push({
      kind: 'in_review',
      issue: review.issue.identifier,
      url: page.url(),
      comment: reviewComment.comment.id,
      fullText: reviewNeeds,
      next: reviewNext,
      scrolled: true,
      beforeClickY: reviewBefore!.y,
      afterClickY: reviewAfter!.y,
      highlighted: true,
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await summary.scrollIntoViewIfNeeded();
    if (captures)
      await page.screenshot({
        path: path.join(captures, 'pm352-in-review-detail.png'),
        fullPage: true,
      });
    await api.put('followUps/following', {
      issueIds: created.map((issue) => issue.id),
    });
    await open(page, `/follow-ups?issue=${blocked.issue.identifier}`);
    const mine = page.getByTestId('follow-ups-mine');
    await mine.getByRole('button', { name: /^Blocked\b/u }).click();
    const row = mine.locator(`[data-issue="${blocked.issue.identifier}"]`);
    await expect(row).toContainText(needsYou);
    await row.getByText(blocked.issue.title, { exact: true }).click();
    const activity = page.getByTestId('follow-ups-activity');
    await expect(activity.getByTestId('issue-needs-you')).toContainText(
      needsYou,
    );
    await expect(activity).toContainText(
      'Dispatch the next step after recovery confirmation.',
    );
    await expect(page.getByTestId('follow-ups-following')).toContainText(
      reviewNeeds,
    );
    if (captures) {
      await page.screenshot({
        path: path.join(captures, 'pm352-my-follow-ups.png'),
        fullPage: true,
      });
      writeFileSync(
        path.join(captures, 'pm352-browser-record.json'),
        JSON.stringify(
          {
            head: process.env.PM352_HEAD,
            entry: server.baseURL,
            records,
            followUps: page.url(),
            deletedCommentLinkRefreshed: true,
            fieldOnlyRefresh: true,
          },
          null,
          2,
        ),
      );
    }
  } finally {
    await api.patch('projectManager', {
      name: settings.name,
      firstChoiceAgentId: settings.firstChoiceAgentId,
      fallbackAgentId: settings.fallbackAgentId,
    });
  }
});
