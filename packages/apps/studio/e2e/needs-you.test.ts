import { expect, open, test, unique, signIn, Api } from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';
import type { FollowUpsView } from '../shared/follow-ups.js';

test.use({
  user: 'admin',
  locale: 'en-US',
  actionTimeout: 15_000,
  navigationTimeout: 30_000,
});

test('one decision card, fixed blocked source, matching follow-ups and live resume', async ({
  page,
  api,
  browser,
  context,
}) => {
  test.setTimeout(300_000);
  // Keep realtime and short UI timers, but disable query and run-discovery polling.
  await page.context().addInitScript(() => {
    const interval = globalThis.setInterval.bind(globalThis);
    const timeout = globalThis.setTimeout.bind(globalThis);
    globalThis.setInterval = ((
      callback: (...values: unknown[]) => void,
      delay?: number,
      ...args: unknown[]
    ) =>
      delay !== undefined && delay >= 2000
        ? timeout(() => {}, 0)
        : interval(
            () => callback(...args),
            delay,
          )) as typeof globalThis.setInterval;
    globalThis.setTimeout = ((
      callback: (...values: unknown[]) => void,
      delay?: number,
      ...args: unknown[]
    ) =>
      delay === 2000 || delay === 5000
        ? timeout(() => {}, 0)
        : timeout(
            () => callback(...args),
            delay,
          )) as typeof globalThis.setTimeout;
  });
  // Language, theme and follow-ups persist on the account; parallel shell tests use the demo admin.
  const owner = {
    email: `needs-you-owner-${unique()}@example.com`,
    password: 'needs-you-e2e-password',
  };
  await api.post('users', {
    ...owner,
    name: 'Needs-you test owner',
    roleScopes: { studio: ['admin'] },
  });
  const recipientUser = {
    email: `needs-you-recipient-${unique()}@example.com`,
    password: 'needs-you-e2e-password',
  };
  await api.post('users', {
    ...recipientUser,
    name: 'Needs-you test recipient',
    roleScopes: { studio: ['contributor'] },
  });
  await signIn(context, owner);
  const me = await api.get<{ userId: string }>('projects/me');
  const settings = await api.get<{
    firstChoiceAgentId: string | null;
    fallbackAgentId: string | null;
    commentRunLimit: number;
  }>('projectManager');
  const runner = new FakeRunner(api, `needs-you-${unique()}`, true);
  const agent = await runner.agent();
  await api.patch('users/me/preferences', { locale: 'en-US' });
  await api.patch('projectManager', {
    firstChoiceAgentId: agent,
    fallbackAgentId: null,
  });
  const created: Issue[] = [];
  const shot = (name: string) =>
    page.screenshot({
      path: test.info().outputPath(`pm342-${name}.png`),
      fullPage: true,
    });
  const current = (issue: Issue) =>
    api.get<Issue>(`projects/issues/${issue.id}`);
  const make = async (title: string) => {
    const issue = await api.post<Issue>('projects/issues', {
      title,
      ownerUserId: me.userId,
      statusKey: 'in_progress',
      start: false,
    });
    created.push(issue);
    await api.post(`projectManager/issues/${issue.id}/start`);
    let running: { runId: string; token: string };
    try {
      running = await runner.start(issue.identifier);
    } catch (error) {
      const state = await api.get<{
        state: string;
        managerWait?: { entries: { reason: string; blockers?: string[] }[] };
      }>(`issueProgress/${issue.id}`);
      throw new Error(
        `${String(error)} Progress: ${JSON.stringify({ state: state.state, entries: state.managerWait?.entries.map((entry) => ({ reason: entry.reason, blockers: entry.blockers })) })}`,
        { cause: error },
      );
    }
    return {
      issue,
      running,
      headers: { 'x-nocobase-run-token': running.token },
    };
  };
  const comment = (
    writer: Api,
    issue: Issue,
    content: string,
    headers: Record<string, string>,
  ) =>
    writer.post<{ comment: { id: string } }>(
      `projects/issues/${issue.id}/comments`,
      { content },
      headers,
    );
  try {
    const { issue, running, headers } = await make(
      'PM-331: restore the execution disk',
    );
    const source = await comment(
      api,
      issue,
      'Next: wait for the disk to recover.\nNeeds you: Restore the execution machine.\n\n[@Test operator](mention://user/test-operator) The disk is full. See [the runbook](https://example.com/runbook) and run `df -h`.\n\n```sh\ndf -h\n```',
      headers,
    );
    await api.patch(
      `projects/issues/${issue.id}`,
      { revision: (await current(issue)).revision, statusKey: 'blocked' },
      headers,
    );
    await comment(
      api,
      issue,
      'Next: dispatch the next step.\n\nThe report was received; continue implementation.',
      headers,
    );
    await runner.complete(running.runId, 'Reported the blocked source.');
    await api.put('followUps/following', { issueIds: [issue.id] });
    await open(page, `/issues/${issue.identifier}`);
    const summary = page.getByTestId('issue-summary');
    await expect(summary.getByTestId('issue-needs-you')).toContainText(
      'Restore the execution machine.',
    );
    await expect(
      summary.getByRole('button', { name: 'Reply', exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-decision="agent_blocked"]')).toHaveCount(
      0,
    );
    await expect(
      summary.getByText('@Test operator', { exact: true }),
    ).toBeVisible();
    await expect(
      summary.getByRole('link', { name: 'the runbook' }),
    ).toHaveAttribute('href', 'https://example.com/runbook');
    await shot('blocked-request');
    await summary.getByRole('button', { name: 'Reply', exact: true }).click();
    const editor = page.getByRole('textbox', { name: 'Comment' });
    await editor.fill('The execution disk has been restored.');
    await page
      .getByTestId('issue-composer')
      .getByRole('button', { name: 'Reply', exact: true })
      .click();
    await expect
      .poll(async () => {
        const threads = await api.get<
          { root: { id: string }; replies: { content: string }[] }[]
        >(`projects/issues/${issue.id}/comments`);
        return threads
          .find((thread) => thread.root.id === source.comment.id)
          ?.replies.some((reply) =>
            reply.content.includes('has been restored'),
          );
      })
      .toBe(true);
    await open(page, '/follow-ups?view=list');
    const rail = page.getByTestId('follow-ups-following');
    const table = page.getByRole('table');
    const status = page.getByRole('combobox', { name: 'Status', exact: true });
    await status.click();
    await expect(
      page.getByRole('option', { name: 'Blocked', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('option', { name: 'In progress', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('option', { name: 'All statuses', exact: true })
      .click();
    const ownedRow = table.getByRole('row').filter({
      has: page.getByRole('link', { name: issue.identifier, exact: true }),
    });
    const panel = page.getByTestId('follow-ups-activity');
    const standalone = await page.context().newPage();
    await open(standalone, `/issues/${issue.identifier}`);
    const standaloneSummary = standalone.getByTestId('issue-summary');
    await expect(
      standaloneSummary.getByText('Blocked', { exact: true }),
    ).toBeVisible();
    await expect(rail).toContainText(
      'Needs you: Restore the execution machine.',
    );
    await expect(ownedRow.getByText('Blocked', { exact: true })).toBeVisible();
    // The shared table exposes permission-safe attention, not a duplicate of the private question text.
    await expect(ownedRow).toContainText('Waiting for you');
    await shot('blocked-follow-ups');
    // Changes arrive through the live channel before either overview or progress polling interval.
    await api.patch(`projects/issues/${issue.id}`, {
      revision: (await current(issue)).revision,
      statusKey: 'in_progress',
    });
    await expect(rail).not.toContainText('Restore the execution machine.', {
      timeout: 3000,
    });
    await expect(
      rail.locator(`[data-issue="${issue.identifier}"] .bg-blue-500`),
    ).toBeVisible({ timeout: 3000 });
    await expect(
      panel
        .getByTestId('issue-summary')
        .getByText('In progress', { exact: true }),
    ).toBeVisible({ timeout: 3000 });
    await expect(
      ownedRow.getByText('In progress', { exact: true }),
    ).toBeVisible({ timeout: 3000 });
    await expect(
      standaloneSummary.getByText('In progress', { exact: true }),
    ).toBeVisible({ timeout: 3000 });
    await expect(panel.getByTestId('issue-needs-you')).toHaveCount(0);
    await expect(standalone.getByTestId('issue-needs-you')).toHaveCount(0);
    await shot('resumed-follow-ups-fixed');
    await standalone.screenshot({
      path: test.info().outputPath('pm342-resumed-detail-fixed.png'),
      fullPage: true,
    });
    const confirmation =
      'Realtime confirmation: the execution disk is restored.';
    await api.post(`projects/issues/${issue.id}/comments`, {
      content: confirmation,
    });
    await expect(panel.getByText(confirmation, { exact: true })).toBeVisible({
      timeout: 3000,
    });
    await expect(
      standalone.getByText(confirmation, { exact: true }),
    ).toBeVisible({ timeout: 3000 });
    await shot('comment-follow-ups-fixed');
    await standalone.screenshot({
      path: test.info().outputPath('pm342-comment-detail-fixed.png'),
      fullPage: true,
    });
    const resumedRun = await runner.start(issue.identifier);
    const work = await api.get<FollowUpsView>('followUps');
    const agentName = work.issues.find((item) => item.id === issue.id)?.progress
      ?.agent?.name;
    if (!agentName)
      throw new Error('The resumed run has no displayed agent name');
    const working = `${agentName} working`;
    await expect(rail).toContainText(working, {
      timeout: 8000,
    });
    await expect(panel.getByTestId('issue-summary')).toContainText(working, {
      timeout: 3000,
    });
    await expect(
      ownedRow.getByRole('status', { name: /is working on this issue$/u }),
    ).toBeVisible({ timeout: 3000 });
    await expect(standaloneSummary).toContainText(working, {
      timeout: 3000,
    });
    await expect(
      panel
        .getByTestId('issue-summary')
        .getByText('In progress', { exact: true }),
    ).toBeVisible();
    await shot('running-follow-ups-fixed');
    await runner.complete(resumedRun.runId, 'The execution disk is ready.');
    await expect(rail).not.toContainText(working, {
      timeout: 8000,
    });
    await expect(panel.getByTestId('issue-summary')).not.toContainText(
      working,
      { timeout: 3000 },
    );
    await expect(
      ownedRow.getByRole('status', { name: /is working on this issue$/u }),
    ).toHaveCount(0, { timeout: 3000 });
    await expect(standaloneSummary).not.toContainText(working, {
      timeout: 3000,
    });
    await standalone.close();
    await open(page, `/issues/${issue.identifier}`);
    await expect(page.getByTestId('issue-needs-you')).toHaveCount(0);
    await expect(page.locator('[data-decision="agent_blocked"]')).toHaveCount(
      0,
    );
    await shot('resumed');
    const waiting = await make('Waiting for execution checkout');
    await comment(
      api,
      waiting.issue,
      'Next: wait for checkout recovery.\n\nThe checkout failed on the execution machine.',
      waiting.headers,
    );
    await api.patch(
      `projects/issues/${waiting.issue.id}`,
      {
        revision: (await current(waiting.issue)).revision,
        statusKey: 'blocked',
      },
      waiting.headers,
    );
    await runner.complete(waiting.running.runId, 'Reported checkout failure.');
    await open(page, `/issues/${waiting.issue.identifier}`);
    await expect(page.getByTestId('issue-needs-you')).toContainText(
      'Waiting: The checkout failed',
    );
    await expect(page.getByTestId('studio-issue-waiting')).toHaveCount(0);
    await shot('blocked-waiting');
    const delivery = await make('Delivery ready for acceptance');
    const review = delivery.issue;
    await comment(
      api,
      review,
      '## Key changes\n\nThe card and live refresh are implemented.',
      delivery.headers,
    );
    await runner.complete(delivery.running.runId, 'Delivery reported.');
    await api.patch(`projects/issues/${review.id}`, {
      revision: (await current(review)).revision,
      statusKey: 'in_review',
    });
    await open(page, `/issues/${review.identifier}`);
    await expect(page.getByTestId('issue-delivery')).toBeVisible();
    await expect(page.getByTestId('issue-delivery')).toContainText(
      'The card and live refresh are implemented.',
    );
    await expect(
      page
        .getByTestId('issue-delivery')
        .getByRole('heading', { name: /^Delivery notes/u }),
    ).toBeVisible();
    await shot('acceptance');
    const limited = await make('PM-297: continue comment-triggered runs');
    const coder = new FakeRunner(api, `reporter-${unique()}`);
    await coder.wake(limited.issue);
    const coding = await coder.start(limited.issue.identifier);
    const codingHeaders = { 'x-nocobase-run-token': coding.token };
    await api.patch('projectManager', { commentRunLimit: 1 });
    await comment(
      api,
      limited.issue,
      'First implementation report.',
      codingHeaders,
    );
    await runner.complete(
      limited.running.runId,
      'Received the first implementation report.',
    );
    await comment(
      api,
      limited.issue,
      'Second implementation report.',
      codingHeaders,
    );
    await coder.complete(coding.runId, 'Posted both implementation reports.');
    await expect
      .poll(() => api.get(`issueCommentRuns/${limited.issue.id}`))
      .not.toBeNull();
    await open(page, `/issues/${limited.issue.identifier}`);
    await expect(
      page.getByRole('button', { name: 'Continue', exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('issue-summary')).toContainText(
      'Comment-triggered runs reached the limit of 1 in the last 24 hours.',
    );
    await expect(page.getByTestId('studio-issue-waiting')).toHaveCount(0);
    await shot('comment-limit');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Continue', exact: true }),
    ).toHaveCount(0);
    const transfer = await make('Take over the next implementation step');
    await runner.complete(transfer.running.runId, 'Ready.');
    const recipientContext = await browser.newContext({ locale: 'en-US' });
    await signIn(recipientContext, recipientUser);
    const recipient = {
      api: new Api(recipientContext.request),
      close: () => recipientContext.close(),
    };
    try {
      const next = await recipient.api.get<{ userId: string }>('projects/me');
      await api.patch(`projects/issues/${transfer.issue.id}`, {
        revision: (await current(transfer.issue)).revision,
        ownerUserId: next.userId,
      });
      await recipient.api.patch('users/me/preferences', { locale: 'en-US' });
      const recipientPage = await recipientContext.newPage();
      await open(recipientPage, `/issues/${transfer.issue.identifier}`);
      await expect(
        recipientPage.getByRole('button', { name: 'Take over', exact: true }),
      ).toBeVisible();
      await expect(
        recipientPage.getByRole('button', { name: 'Reject', exact: true }),
      ).toBeVisible();
      await expect(
        recipientPage.locator('[data-decision="owner_handoff"]'),
      ).toHaveCount(0);
      await recipientPage.screenshot({
        path: test.info().outputPath('pm342-owner-handoff.png'),
        fullPage: true,
      });
      await recipientPage
        .getByRole('button', { name: 'Take over', exact: true })
        .click();
      await expect(
        recipientPage.getByRole('button', { name: 'Take over', exact: true }),
      ).toHaveCount(0);
      await recipient.api.patch('users/me/preferences', { locale: 'zh-CN' });
    } finally {
      await recipient.close();
    }
  } finally {
    await api.patch('projectManager', {
      firstChoiceAgentId: settings.firstChoiceAgentId,
      fallbackAgentId: settings.fallbackAgentId,
      commentRunLimit: settings.commentRunLimit,
    });
    await api.patch('users/me/preferences', { locale: 'zh-CN' });
    for (const issue of created)
      await api.delete(`projects/issues/${issue.id}`);
  }
});
