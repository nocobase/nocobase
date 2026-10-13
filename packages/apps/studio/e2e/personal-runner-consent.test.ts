/** Real application consent decisions, using isolated demo people and runner protocol clients. */
import { Api, expect, open, signIn, test, unique } from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';
import type { IssueProgress } from '../shared/project-manager.ts';
import type { RunDetail } from '@nocobase/app-plugin-agents/shared/runs';

test.use({ user: 'admin', locale: 'en-US', trace: 'off' });

test('comment work shares the decision card and runs only on an authorized identity and runner', async ({
  page,
  api,
  browser,
}) => {
  test.setTimeout(240_000);
  const requesterContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  await signIn(requesterContext, 'lisa');
  const requester = new Api(requesterContext.request);
  const requesterPage = await requesterContext.newPage();
  await requester.patch('users/me/preferences', { locale: 'en-US' });
  await api.patch('users/me/preferences', { locale: 'en-US' });
  const owner = await api.get<{ userId: string }>('projects/me');
  const author = await requester.get<{ userId: string }>('projects/me');
  const settings = await api.get<{
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
      firstChoiceAgentId: settings.firstChoiceAgentId,
      fallbackAgentId: settings.fallbackAgentId,
      commentRunLimit: settings.commentRunLimit,
    });
    for (const issue of created)
      await api.delete(`projects/issues/${issue.id}`).catch(() => undefined);
    await requesterContext.close();
  }
});
