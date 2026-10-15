import { expect, open, signIn, test, unique, url } from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';

test.use({ isolatedStudio: true, user: 'admin' });

test.describe('project manager live refresh', () => {
  let issue: Issue;
  let originalName: string;
  let originalFirstChoice: string | null;
  let originalFallback: string | null;

  test.beforeEach(async ({ api }) => {
    const me = await api.get<{ userId: string }>('projects/me');
    issue = await api.post<Issue>('projects/issues', {
      title: `Manager refresh ${unique()}`,
      description: 'Live identity refresh acceptance issue.',
      ownerUserId: me.userId,
      statusKey: 'in_progress',
      start: false,
    });
    const settings = await api.get<{
      name: string;
      firstChoiceAgentId: string | null;
      fallbackAgentId: string | null;
    }>('projectManager');
    originalName = settings.name;
    originalFirstChoice = settings.firstChoiceAgentId;
    originalFallback = settings.fallbackAgentId;
    const managerAgentId = await new FakeRunner(
      api,
      `manager-refresh-${unique()}`,
    ).agent();
    await api.patch('projectManager', {
      firstChoiceAgentId: managerAgentId,
      fallbackAgentId: null,
    });
    await api.patch('users/me/preferences', { locale: 'en-US' });
  });

  test.afterEach(async ({ api }) => {
    await api.patch('projectManager', {
      name: originalName,
      firstChoiceAgentId: originalFirstChoice,
      fallbackAgentId: originalFallback,
    });
  });

  test('refreshes an open @ list when its real candidate request finishes', async ({
    page,
    studio,
  }, testInfo) => {
    let releaseResponse!: () => void;
    let responseHeld!: () => void;
    const responseArrived = new Promise<void>((resolve) => {
      responseHeld = resolve;
    });
    const waitForRelease = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route('**/api/projects/mentionCandidates**', async (route) => {
      const response = await route.fetch();
      responseHeld();
      await waitForRelease;
      await route.fulfill({ response });
    });

    try {
      await page.goto(url(`/issues/${issue.identifier}`, studio));
      await expect(
        page.getByRole('heading', { name: issue.title }),
      ).toBeVisible();
      await responseArrived;
      const editor = page.getByRole('textbox', { name: 'Comment' });
      await editor.fill('@');
      await expect(page.getByText('No matches')).toBeVisible();
      releaseResponse();
      await expect(
        page.getByRole('option', { name: originalName }),
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath('manager-candidate-loaded-en.png'),
      });
    } finally {
      releaseResponse();
      await page.unrouteAll({ behavior: 'wait' });
    }
  });

  test('refreshes the executor and open candidate list after a manager rename', async ({
    page,
    browser,
    studio,
  }, testInfo) => {
    await open(page, `/issues/${issue.identifier}`);
    const executor = page
      .getByRole('region', { name: 'Properties' })
      .getByRole('combobox', { name: 'Arrange' });
    await expect(executor).toContainText(originalName);

    const editor = page.getByRole('textbox', { name: 'Comment' });
    await editor.fill('@');
    await expect(
      page.getByRole('option', { name: originalName }),
    ).toBeVisible();

    const context = await browser.newContext({ locale: 'en-US' });
    try {
      await signIn(context, 'admin', studio);
      const settingsPage = await context.newPage();
      await open(settingsPage, '/agents/project-manager');
      const renamed = `Delivery lead ${unique()}`;
      await settingsPage.getByLabel('Name').fill(renamed);
      await settingsPage.getByRole('button', { name: 'Save' }).click();
      await expect(settingsPage.getByRole('dialog')).toBeHidden();

      await expect(executor).toContainText(renamed);
      await expect(page.getByRole('option', { name: renamed })).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath('manager-renamed-live-en.png'),
      });
    } finally {
      await context.close();
    }
  });
});
