import type { Page, WebSocket } from '@playwright/test';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { expect, url, test, unique, signIn, Api } from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';
import type { ServerState } from './support/server.ts';

// Live projections require an acknowledged subscription, not global HTTP idleness or a polling fallback.
async function open(
  target: Page,
  path: string,
  studio: ServerState,
): Promise<void> {
  const topics = new Set<string>();
  const observe = (socket: WebSocket): void => {
    socket.on('framereceived', ({ payload }) => {
      try {
        const message = JSON.parse(payload.toString()) as {
          type?: string;
          topic?: string;
        };
        if (message.type === 'subscribed' && message.topic)
          topics.add(message.topic);
      } catch {
        // Non-JSON transport frames cannot acknowledge a subscription.
      }
    });
  };
  target.on('websocket', observe);
  try {
    await target.goto(url(path, studio));
    await expect
      .poll(() => topics.has(PM_REALTIME_TOPIC), {
        message:
          'The issue change subscription must be acknowledged before live mutations',
      })
      .toBe(true);
  } finally {
    target.off('websocket', observe);
  }
}

test.use({
  isolatedStudio: true,
  user: 'admin',
  locale: 'en-US',
  actionTimeout: 15_000,
  navigationTimeout: 30_000,
});

test('structured owner request, latest explanation, matching follow-ups and live resume', async ({
  page,
  api,
  browser,
  context,
  studio,
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
  await signIn(context, owner, studio);
  const me = await api.get<{ userId: string }>('projects/me');
  const settings = await api.get<{
    name: string;
    firstChoiceAgentId: string | null;
    fallbackAgentId: string | null;
    commentRunLimit: number;
  }>('projectManager');
  // The name this test gives the manager below, not the one it found: that is restored when the test ends.
  const managerName = 'Project manager';
  const managerWorking = `${managerName} working`;
  const runner = new FakeRunner(api, `needs-you-${unique()}`, true);
  const agent = await runner.agent();
  await api.patch('users/me/preferences', { locale: 'en-US' });
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
    const initialManagerName = 'PM-360 initial manager';
    expect(initialManagerName).not.toBe(managerName);
    for (const originalName of [managerName, '项目经理']) {
      await api.patch('projectManager', { name: originalName });
      const originalSettings = await api.get<{ name: string }>(
        'projectManager',
      );
      try {
        await api.patch('projectManager', { name: initialManagerName });
        const initialSettings = await api.get<{ name: string }>(
          'projectManager',
        );
        expect(initialSettings.name).toBe(initialManagerName);
        await api.patch('projectManager', { name: managerName });
        const configuredSettings = await api.get<{ name: string }>(
          'projectManager',
        );
        expect(configuredSettings.name).toBe(managerName);
      } finally {
        await api.patch('projectManager', { name: originalSettings.name });
        const restoredSettings = await api.get<{ name: string }>(
          'projectManager',
        );
        expect(restoredSettings.name).toBe(originalSettings.name);
      }
    }
    await api.patch('projectManager', {
      name: managerName,
      firstChoiceAgentId: agent,
      fallbackAgentId: null,
    });
    const { issue, running, headers } = await make(
      'PM-331: restore the execution disk',
    );
    const previous = await comment(
      api,
      issue,
      'Next: wait for the disk to recover.\nNeeds you: Restore the execution machine.\n\n[@Test operator](mention://user/test-operator) The disk is full. See [the runbook](https://example.com/runbook) and run `df -h`.\n\n```sh\ndf -h\n```',
      headers,
    );
    await api.patch(
      `projects/issues/${issue.id}`,
      {
        revision: (await current(issue)).revision,
        statusKey: 'blocked',
        needsYou:
          'Restore the execution machine. Verify the recovered disk capacity.',
        next: 'Resume implementation after disk recovery.',
      },
      headers,
    );
    await api.put('followUps/following', { issueIds: [issue.id] });
    await open(page, `/issues/${issue.identifier}`, studio);
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
    await expect(summary).not.toContainText('The disk is full.');
    await expect(summary).toContainText('Verify the recovered disk capacity.');
    await expect(summary).toContainText(
      'Resume implementation after disk recovery.',
    );
    await expect(summary).not.toContainText('dispatch the next step');
    const explanationLink = summary.getByRole('link', {
      name: 'View the project manager’s latest explanation',
    });
    await expect(explanationLink).toHaveAttribute(
      'href',
      new RegExp(`comment=${previous.comment.id}`),
    );
    const explanation = await comment(
      api,
      issue,
      'Next: dispatch the next step.\n\nThe report was received; continue implementation.',
      headers,
    );
    await runner.complete(running.runId, 'Reported the blocked source.');
    await expect(
      summary.getByTestId('issue-needs-you').locator('span').first(),
    ).toHaveText(
      'Restore the execution machine. Verify the recovered disk capacity.',
    );
    await expect(explanationLink).toHaveAttribute(
      'href',
      new RegExp(`comment=${explanation.comment.id}`),
    );
    await explanationLink.click();
    await expect(page).toHaveURL(
      new RegExp(`comment=${explanation.comment.id}`),
    );
    await expect(
      page.locator(`[data-comment-id="${explanation.comment.id}"]`),
    ).toBeInViewport();
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
          .find((thread) => thread.root.id === explanation.comment.id)
          ?.replies.some((reply) =>
            reply.content.includes('has been restored'),
          );
      })
      .toBe(true);
    await open(page, '/follow-ups', studio);
    const rail = page.getByTestId('follow-ups-following');
    const mine = page.getByTestId('follow-ups-mine');
    await mine.getByRole('button', { name: /^Blocked\b/u }).click();
    await mine.getByRole('button', { name: /^In progress\b/u }).click();
    const ownedRow = mine.locator(`[data-issue="${issue.identifier}"]`);
    const panel = page.getByTestId('follow-ups-activity');
    const standalone = await page.context().newPage();
    await open(standalone, `/issues/${issue.identifier}`, studio);
    const standaloneSummary = standalone.getByTestId('issue-summary');
    await expect(
      standaloneSummary.getByText('Blocked', { exact: true }),
    ).toBeVisible();
    await expect(rail).toContainText(
      'Needs you: Restore the execution machine.',
    );
    await expect(rail).toContainText('Verify the recovered disk capacity.');
    await expect(ownedRow.getByText('Blocked', { exact: true })).toBeVisible();
    await expect(ownedRow).toContainText(
      'Needs you: Restore the execution machine.',
    );
    const panelSummary = panel.getByTestId('issue-summary');
    await panelSummary
      .getByRole('link', {
        name: 'View the project manager’s latest explanation',
      })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`comment=${explanation.comment.id}`),
    );
    const focusedExplanation = panel.locator(
      `[data-comment-id="${explanation.comment.id}"]`,
    );
    await expect(focusedExplanation).toBeInViewport();
    await expect(focusedExplanation).toHaveClass(/ring-2/u);
    await test.info().attach('follow-ups-explanation-location.json', {
      body: JSON.stringify({
        entryURL: page.url(),
        issue: issue.identifier,
        commentId: explanation.comment.id,
        highlighted: true,
      }),
      contentType: 'application/json',
    });
    await shot('blocked-follow-ups-explanation');
    await panelSummary.scrollIntoViewIfNeeded();
    await expect(panelSummary).toContainText(
      'Restore the execution machine. Verify the recovered disk capacity.',
    );
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
      rail.locator(
        `[data-issue="${issue.identifier}"] [data-status-shape="started"]`,
      ),
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
    await expect(rail).toContainText(managerWorking, {
      timeout: 8000,
    });
    await expect(panel.getByTestId('issue-summary')).toContainText(
      managerWorking,
      { timeout: 3000 },
    );
    await expect(ownedRow).toContainText(managerWorking, {
      timeout: 3000,
    });
    await expect(standaloneSummary).toContainText(managerWorking, {
      timeout: 3000,
    });
    await expect(
      panel
        .getByTestId('issue-summary')
        .getByText('In progress', { exact: true }),
    ).toBeVisible();
    await shot('running-follow-ups-fixed');
    await runner.complete(resumedRun.runId, 'The execution disk is ready.');
    await expect(rail).not.toContainText(managerWorking, {
      timeout: 8000,
    });
    await expect(panel.getByTestId('issue-summary')).not.toContainText(
      managerWorking,
      { timeout: 3000 },
    );
    await expect(ownedRow).not.toContainText(managerWorking, {
      timeout: 3000,
    });
    await expect(standaloneSummary).not.toContainText(managerWorking, {
      timeout: 3000,
    });
    await standalone.close();
    await open(page, `/issues/${issue.identifier}`, studio);
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
        needsYou: 'Please restore the execution checkout.',
        next: 'Resume work after checkout recovery.',
      },
      waiting.headers,
    );
    await runner.complete(waiting.running.runId, 'Reported checkout failure.');
    await open(page, `/issues/${waiting.issue.identifier}`, studio);
    await expect(page.getByTestId('issue-needs-you')).toContainText(
      'Please restore the execution checkout.',
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
      needsYou: 'Please review the card and live refresh implementation.',
    });
    await open(page, `/issues/${review.identifier}`, studio);
    await expect(page.getByTestId('issue-needs-you')).toContainText(
      'Please review the card and live refresh implementation.',
    );
    await expect(page.getByTestId('issue-summary')).not.toContainText(
      'The card and live refresh are implemented.',
    );
    await expect(
      page
        .getByTestId('issue-summary')
        .getByRole('button', { name: 'Send back', exact: true }),
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
    // A new comment has its own authorization chain instead of being injected into the earlier running manager.
    const earlier = await api.get<{ inputs: { text: string }[] }>(
      `agents/runs/${limited.running.runId}`,
    );
    expect(
      earlier.inputs.some(
        (input) => input.text === 'First implementation report.',
      ),
    ).toBe(false);
    await runner.complete(limited.running.runId, 'Done.');
    const reportRun = await runner.start(limited.issue.identifier);
    await comment(
      api,
      limited.issue,
      'Second implementation report.',
      codingHeaders,
    );
    await coder.complete(coding.runId, 'Done.');
    await runner.complete(reportRun.runId, 'Done.');
    await expect
      .poll(() => api.get(`issueCommentRuns/${limited.issue.id}`))
      .not.toBeNull();
    await open(page, `/issues/${limited.issue.identifier}`, studio);
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
    // Continue enqueues legitimate work for this issue; finish that scenario before claiming another issue.
    const continued = await runner.start(limited.issue.identifier);
    const continuedDetail = await api.get<{
      actorUserId: string;
      subject: { kind: string; id: string };
      inputs: unknown[];
    }>(`agents/runs/${continued.runId}`);
    expect(continuedDetail.actorUserId).toBe(me.userId);
    expect(continuedDetail.subject).toEqual({
      kind: 'issue',
      id: limited.issue.id,
    });
    expect(continuedDetail.inputs).toHaveLength(1);
    await runner.complete(
      continued.runId,
      'Handled the explicitly continued report.',
    );
    const transfer = await make('Take over the next implementation step');
    await runner.complete(transfer.running.runId, 'Ready.');
    const recipientContext = await browser.newContext({ locale: 'en-US' });
    await signIn(recipientContext, recipientUser, studio);
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
      await open(recipientPage, `/issues/${transfer.issue.identifier}`, studio);
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
      name: settings.name,
      firstChoiceAgentId: settings.firstChoiceAgentId,
      fallbackAgentId: settings.fallbackAgentId,
      commentRunLimit: settings.commentRunLimit,
    });
    await api.patch('users/me/preferences', { locale: 'zh-CN' });
    for (const issue of created)
      await api.delete(`projects/issues/${issue.id}`);
  }
});
