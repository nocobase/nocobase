/** Consent decisions own their server: concurrent tests may change the shared manager's model choices. */
import { rmSync } from 'node:fs';
import type { Page } from '@playwright/test';
import {
  Api,
  expect,
  signIn,
  test as sharedTest,
  unique,
  server as sharedServer,
} from './support/fixtures.ts';
import { startStudio, stopStudio, type ServerState } from './support/server.ts';
import { FakeRunner, type Issue } from './support/runner.ts';
import type { IssueProgress } from '../shared/project-manager.ts';
import type { RunDetail } from '@nocobase/app-plugin-agents/shared/runs';

const test = sharedTest.extend<{ studio: ServerState }>({
  studio: async ({ browser }, use) => {
    expect(browser.isConnected()).toBe(true);
    const state = await startStudio({ isolated: true });
    try {
      expect(state.origin).not.toBe(sharedServer.origin);
      expect(state.directory).not.toBe(sharedServer.directory);
      await use(state);
    } finally {
      await stopStudio(state);
      rmSync(state.directory, { recursive: true, force: true });
    }
  },
  api: async ({ context, studio }, use) => {
    await signIn(context, 'admin', studio);
    await use(new Api(context.request, studio));
  },
});

test.use({ user: 'admin', locale: 'en-US', trace: 'off' });
test.setTimeout(240_000);

async function createRequester(api: Api) {
  // Preferences persist on the account; never change the demo person used by parallel sign-in tests.
  const credentials = {
    email: `consent-requester-${unique()}@example.com`,
    password: 'consent-e2e-password',
  };
  await api.post('users', {
    ...credentials,
    name: 'Lisa Nguyen',
    roleScopes: { studio: ['contributor'] },
  });
  return credentials;
}

test('comment work shares the decision card and runs only on an authorized identity and runner', async ({
  page,
  api,
  browser,
  studio,
}) => {
  const open = async (target: Page, route: string) => {
    await target.goto(`${studio.baseURL}${route}`);
    await target.waitForLoadState('networkidle');
  };
  const requesterContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  await signIn(requesterContext, await createRequester(api), studio);
  const requester = new Api(requesterContext.request, studio);
  const requesterPage = await requesterContext.newPage();
  await requester.patch('users/me/preferences', { locale: 'en-US' });
  await api.patch('users/me/preferences', { locale: 'en-US' });
  const owner = await api.get<{ userId: string }>('projects/me');
  const author = await requester.get<{ userId: string }>('projects/me');
  const settings = await api.get<{
    name: string;
    firstChoiceAgentId: string | null;
    fallbackAgentId: string | null;
    commentRunLimit: number;
  }>('projectManager');
  const created: Issue[] = [];
  const shot = (name: string, target = page) =>
    target.screenshot({
      path: test.info().outputPath(`pm301-${name}.png`),
      fullPage: true,
    });
  const make = async (title: string) => {
    const issue = await api.post<Issue>('projects/issues', {
      title,
      ownerUserId: owner.userId,
      statusKey: 'in_progress',
      start: false,
    });
    created.push(issue);
    return issue;
  };
  const progress = (issue: Issue) =>
    api.get<IssueProgress>(`issueProgress/${issue.id}`);
  const comment = (issue: Issue, content: string) =>
    requester.post(`projects/issues/${issue.id}/comments`, { content });
  try {
    const team = new FakeRunner(api, `consent-team-${unique()}`, true);
    await api.patch('projectManager', {
      name: 'Project manager',
      firstChoiceAgentId: await team.agent(),
      fallbackAgentId: null,
      commentRunLimit: 20,
    });
    const teamIssue = await make(
      'Team runner accepts another person’s comment',
    );
    await comment(
      teamIssue,
      'Please inspect the team delivery. This is an isolated test comment.',
    );
    const teamRun = await team.start(teamIssue.identifier);
    expect(
      (await api.get<RunDetail>(`agents/runs/${teamRun.runId}`)).actorUserId,
    ).toBe(owner.userId);
    expect((await progress(teamIssue)).personalRunnerRequests).toEqual([]);
    await open(page, `/issues/${teamIssue.identifier}/runs/${teamRun.runId}`);
    await expect(
      page.getByText('Running as Super Admin', { exact: false }).first(),
    ).toBeVisible();
    await shot('team-direct');
    await team.complete(
      teamRun.runId,
      'The team runner completed the isolated comment.',
    );

    const model = `consent-personal-${unique()}`;
    const laptop = new FakeRunner(api, `Owner test laptop ${unique()}`, true, {
      trust: 'ownerOnly',
      model,
    });
    await api.patch('projectManager', {
      firstChoiceAgentId: await laptop.agent(),
      fallbackAgentId: null,
    });
    const personalIssue = await make(
      'Owner decides whether this comment may use a personal runner',
    );
    const original =
      'Please continue the isolated personal runner delivery. Keep this original comment visible in the confirmation.';
    await comment(personalIssue, original);
    await expect
      .poll(
        async () =>
          (await progress(personalIssue)).personalRunnerRequests?.length,
      )
      .toBe(1);
    expect(await laptop.probe()).toEqual([]);
    await open(page, `/issues/${personalIssue.identifier}`);
    const card = page.getByRole('region', { name: 'Needs you', exact: true });
    await expect(card).toHaveCount(1);
    await expect(card.getByText(original)).toBeVisible();
    await expect(
      card.getByRole('button', { name: 'Confirm', exact: true }),
    ).toBeVisible();
    await shot('owner-consent-original');
    for (const statusKey of ['blocked', 'in_review']) {
      const needsYou =
        'Confirm the recovery decision. Review the personal runner request separately.';
      await api.patch(`projects/issues/${personalIssue.id}`, {
        statusKey,
        needsYou,
        next: 'Continue after the owner decisions.',
      });
      await expect(card.getByTestId('issue-needs-you')).toContainText(needsYou);
      await expect(
        card.getByRole('button', { name: 'Confirm', exact: true }),
      ).toBeVisible();
      await expect(
        card.getByRole('button', { name: 'Reject', exact: true }),
      ).toBeVisible();
      await expect(card).not.toContainText(original);
      await expect(page.getByTestId('issue-feed')).toContainText(original);
    }
    await api.patch(`projects/issues/${personalIssue.id}`, {
      statusKey: 'in_progress',
    });
    await expect(card.getByText(original)).toBeVisible();

    await open(requesterPage, `/issues/${personalIssue.identifier}`);
    await expect(
      requesterPage.getByText(
        'Waiting for the owner to confirm use of their personal runner',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      requesterPage.getByRole('button', { name: 'Run as me', exact: true }),
    ).toBeVisible();
    await shot('requester-waiting', requesterPage);
    await open(page, '/inbox');
    const inboxCard = page
      .getByRole('article')
      .filter({ hasText: 'requests your personal runner' })
      .filter({ hasText: original })
      .first();
    await expect(inboxCard).toBeVisible();
    await shot('inbox-request');
    await open(page, `/issues/${personalIssue.identifier}`);
    await page
      .getByRole('region', { name: 'Needs you', exact: true })
      .getByRole('button', { name: 'Confirm', exact: true })
      .click();
    const personalRun = await laptop.start(personalIssue.identifier);
    const confirmed = await api.get<RunDetail>(
      `agents/runs/${personalRun.runId}`,
    );
    expect(confirmed.actorUserId).toBe(owner.userId);
    expect(confirmed.confirmedByUserId).toBe(owner.userId);
    await open(
      page,
      `/issues/${personalIssue.identifier}/runs/${personalRun.runId}`,
    );
    await expect(
      page.getByText('Confirmed by Super Admin', { exact: false }).first(),
    ).toBeVisible();
    await shot('confirmed-personal-confirmer');
    await laptop.complete(
      personalRun.runId,
      'The owner confirmed this isolated comment chain.',
    );

    // Returning to In progress legitimately queues the owner's main run; settle it before checking denied comment work.
    const resumed = await laptop.start(personalIssue.identifier);
    expect(
      (await api.get<RunDetail>(`agents/runs/${resumed.runId}`)).actorUserId,
    ).toBe(owner.userId);
    await laptop.complete(
      resumed.runId,
      'The owner resumed work after the structured decisions.',
    );

    const rejectedIssue = await make(
      'A declined comment can run as its original commenter',
    );
    await comment(
      rejectedIssue,
      'Please review this isolated rejected-comment delivery.',
    );
    await open(page, `/issues/${rejectedIssue.identifier}`);
    await page
      .getByRole('region', { name: 'Needs you', exact: true })
      .getByRole('button', { name: 'Reject', exact: true })
      .click();
    await open(requesterPage, `/issues/${rejectedIssue.identifier}`);
    await expect(
      requesterPage.getByText(
        'The owner rejected the personal runner request',
        { exact: true },
      ),
    ).toBeVisible();
    await shot('requester-rejected', requesterPage);
    const authorLaptop = new FakeRunner(
      requester,
      `Commenter test laptop ${unique()}`,
      true,
      { trust: 'ownerOnly', model },
    );
    await authorLaptop.agent();
    await requesterPage
      .getByRole('button', { name: 'Run as me', exact: true })
      .click();
    const ownRun = await authorLaptop.start(rejectedIssue.identifier);
    const own = await requester.get<RunDetail>(`agents/runs/${ownRun.runId}`);
    expect(own.actorUserId).toBe(author.userId);
    expect(own.commentExecution).toBe('requester');
    expect(await laptop.probe()).toEqual([]);
    await open(
      requesterPage,
      `/issues/${rejectedIssue.identifier}/runs/${ownRun.runId}`,
    );
    await expect(
      requesterPage
        .getByText('Running as Lisa Nguyen', { exact: false })
        .first(),
    ).toBeVisible();
    await shot('requester-run-as-me', requesterPage);
    await authorLaptop.complete(
      ownRun.runId,
      'The original commenter completed the isolated work.',
    );

    const transferIssue = await make(
      'Owner handoff takes priority over personal runner decisions',
    );
    await comment(transferIssue, 'Please continue after the owner handoff.');
    await expect
      .poll(
        async () =>
          (await progress(transferIssue)).personalRunnerRequests?.length,
      )
      .toBe(1);
    const current = await api.get<Issue>(`projects/issues/${transferIssue.id}`);
    await api.patch(`projects/issues/${transferIssue.id}`, {
      revision: current.revision,
      ownerUserId: author.userId,
    });
    await open(requesterPage, `/issues/${transferIssue.identifier}`);
    await expect(requesterPage.getByTestId('issue-needs-you')).toHaveCount(1);
    await expect(
      requesterPage.getByRole('button', { name: 'Take over', exact: true }),
    ).toBeVisible();
    await expect(
      requesterPage.getByRole('button', { name: 'Run as me', exact: true }),
    ).toHaveCount(0);
    await shot('handoff-priority', requesterPage);
  } finally {
    await api.patch('projectManager', {
      name: settings.name,
      firstChoiceAgentId: settings.firstChoiceAgentId,
      fallbackAgentId: settings.fallbackAgentId,
      commentRunLimit: settings.commentRunLimit,
    });
    for (const issue of created)
      await api.delete(`projects/issues/${issue.id}`).catch(() => undefined);
    await requesterContext.close();
  }
});

test('owner delegation needs no extra consent and Run as me preserves both comment targets', async ({
  page,
  api,
  browser,
  studio,
}) => {
  const open = async (target: Page, route: string) => {
    await target.goto(`${studio.baseURL}${route}`);
    await target.waitForLoadState('networkidle');
  };
  const requesterContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  await signIn(requesterContext, await createRequester(api), studio);
  const requester = new Api(requesterContext.request, studio);
  const requesterPage = await requesterContext.newPage();
  await requester.patch('users/me/preferences', { locale: 'en-US' });
  await api.patch('users/me/preferences', { locale: 'en-US' });
  const owner = await api.get<{ userId: string }>('projects/me');
  const author = await requester.get<{ userId: string }>('projects/me');
  const settings = await api.get<{
    name: string;
    firstChoiceAgentId: string | null;
    fallbackAgentId: string | null;
    commentRunLimit: number;
  }>('projectManager');
  const created: Issue[] = [];
  const make = async (title: string) => {
    const issue = await api.post<Issue>('projects/issues', {
      title,
      ownerUserId: owner.userId,
      statusKey: 'in_progress',
      start: false,
    });
    created.push(issue);
    return issue;
  };
  const shot = (name: string, target = page) =>
    target.screenshot({
      path: test.info().outputPath(`pm301-${name}.png`),
      fullPage: true,
    });
  try {
    const suffix = unique();
    const managerModel = `consent-manager-${suffix}`;
    const workerModel = `consent-worker-${suffix}`;
    const ownerManager = new FakeRunner(api, 'Owner manager laptop', true, {
      trust: 'ownerOnly',
      model: managerModel,
    });
    const ownerWorker = new FakeRunner(api, 'Owner worker laptop', true, {
      trust: 'ownerOnly',
      model: workerModel,
    });
    const worker = await ownerWorker.discovered();
    await api.patch('projectManager', {
      name: 'Project manager',
      firstChoiceAgentId: await ownerManager.agent(),
      fallbackAgentId: null,
      commentRunLimit: 20,
    });
    const registeredOwners =
      await api.get<{ name: string; trust: string; ownerUserId: string }[]>(
        'agents/runners',
      );
    for (const name of ['Owner manager laptop', 'Owner worker laptop'])
      expect(
        registeredOwners.find((runner) => runner.name === name),
      ).toMatchObject({ trust: 'ownerOnly', ownerUserId: owner.userId });
    const ownIssue = await make(
      'Owner comment and delegated step use the personal runner directly',
    );
    const source = await api.post<{ comment: { id: string } }>(
      `projects/issues/${ownIssue.id}/comments`,
      { content: 'Please delegate my isolated delivery to the worker.' },
    );
    const managerTurn = await ownerManager.start(ownIssue.identifier);
    await api.post(
      `projects/issues/${ownIssue.id}/comments`,
      {
        content: `[@Worker](mention://agent/${worker.id}) implement the owner’s next step without another confirmation.`,
        parentId: source.comment.id,
      },
      { 'x-nocobase-run-token': managerTurn.token },
    );
    expect(
      (await api.get<IssueProgress>(`issueProgress/${ownIssue.id}`))
        .personalRunnerRequests,
    ).toEqual([]);
    await ownerManager.complete(managerTurn.runId, 'Done.');
    const workerTurn = await ownerWorker.start(ownIssue.identifier);
    const ownStep = await api.get<RunDetail>(`agents/runs/${workerTurn.runId}`);
    expect(ownStep.actorUserId).toBe(owner.userId);
    expect(ownStep.requestedByUserId).toBe(owner.userId);
    expect(ownStep.confirmedByUserId).toBeNull();
    await open(page, `/issues/${ownIssue.identifier}/runs/${workerTurn.runId}`);
    await expect(
      page.getByText('Running as Super Admin', { exact: false }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Confirm', exact: true }),
    ).toHaveCount(0);
    await shot('owner-delegation-no-consent');
    await ownerWorker.complete(workerTurn.runId, 'Done.');

    const authorManager = new FakeRunner(
      requester,
      'Commenter manager laptop',
      true,
      { trust: 'ownerOnly', model: managerModel },
    );
    const authorWorker = new FakeRunner(
      requester,
      'Commenter worker laptop',
      true,
      { trust: 'ownerOnly', model: workerModel },
    );
    await authorManager.agent();
    await authorWorker.agent();
    const registeredCommenters =
      await api.get<{ name: string; trust: string; ownerUserId: string }[]>(
        'agents/runners',
      );
    for (const name of ['Commenter manager laptop', 'Commenter worker laptop'])
      expect(
        registeredCommenters.find((runner) => runner.name === name),
      ).toMatchObject({ trust: 'ownerOnly', ownerUserId: author.userId });

    for (const state of ['pending', 'rejected'] as const) {
      const issue = await make(
        `Two comment targets continue as the commenter after ${state} consent`,
      );
      await requester.post(`projects/issues/${issue.id}/comments`, {
        content: `[@Worker](mention://agent/${worker.id}) inspect this delivery together with the project manager.`,
      });
      const before = await api.get<RunDetail[]>(
        `agents/runs?subjectKind=issue&subjectId=${issue.id}`,
      );
      expect(before).toHaveLength(2);
      await expect
        .poll(
          async () =>
            (await api.get<IssueProgress>(`issueProgress/${issue.id}`))
              .personalRunnerRequests?.length,
        )
        .toBe(1);
      expect(await ownerManager.probe()).toEqual([]);
      expect(await ownerWorker.probe()).toEqual([]);
      if (state === 'rejected') {
        await open(page, `/issues/${issue.identifier}`);
        await page
          .getByRole('region', { name: 'Needs you', exact: true })
          .getByRole('button', { name: 'Reject', exact: true })
          .click();
      }
      await open(requesterPage, `/issues/${issue.identifier}`);
      await requesterPage
        .getByRole('button', { name: 'Run as me', exact: true })
        .click();
      await expect
        .poll(
          async () =>
            (
              await requester.get<RunDetail[]>(
                `agents/runs?subjectKind=issue&subjectId=${issue.id}`,
              )
            ).filter((run) => run.status === 'queued').length,
        )
        .toBe(2);
      const after = await requester.get<RunDetail[]>(
        `agents/runs?subjectKind=issue&subjectId=${issue.id}`,
      );
      const continued = after.filter((run) => run.status === 'queued');
      expect(continued.map((run) => run.agentId).sort()).toEqual(
        before.map((run) => run.agentId).sort(),
      );
      expect(
        continued.every(
          (run) =>
            run.actorUserId === author.userId &&
            run.commentExecution === 'requester',
        ),
      ).toBe(true);
      expect(new Set(continued.map((run) => run.commentRootRunId)).size).toBe(
        1,
      );
      expect(await ownerManager.probe()).toEqual([]);
      expect(await ownerWorker.probe()).toEqual([]);
      const step = await authorWorker.start(issue.identifier);
      expect(
        (await requester.get<RunDetail>(`agents/runs/${step.runId}`))
          .actorUserId,
      ).toBe(author.userId);
      await open(
        requesterPage,
        `/issues/${issue.identifier}/runs/${step.runId}`,
      );
      await expect(
        requesterPage
          .getByText('Running as Lisa Nguyen', { exact: false })
          .first(),
      ).toBeVisible();
      await shot(`multi-${state}-worker`, requesterPage);
      await authorWorker.complete(step.runId, 'Done.');
      const manager = await authorManager.start(issue.identifier);
      expect(
        (await requester.get<RunDetail>(`agents/runs/${manager.runId}`))
          .actorUserId,
      ).toBe(author.userId);
      await open(
        requesterPage,
        `/issues/${issue.identifier}/runs/${manager.runId}`,
      );
      await expect(
        requesterPage
          .getByText('Running as Lisa Nguyen', { exact: false })
          .first(),
      ).toBeVisible();
      await shot(`multi-${state}-manager`, requesterPage);
      await authorManager.complete(manager.runId, 'Done.');
    }
  } finally {
    await api.patch('projectManager', {
      name: settings.name,
      firstChoiceAgentId: settings.firstChoiceAgentId,
      fallbackAgentId: settings.fallbackAgentId,
      commentRunLimit: settings.commentRunLimit,
    });
    for (const issue of created)
      await api.delete(`projects/issues/${issue.id}`).catch(() => undefined);
    await requesterContext.close();
  }
});
