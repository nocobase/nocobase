import {
  apiAs,
  expect,
  open,
  signIn,
  test,
  unique,
} from './support/fixtures.ts';
import { FakeRunner, type Issue } from './support/runner.ts';
import { STUDIO_INBOX_TOPIC } from '../shared/inbox.js';

test.describe('inbox notifications', () => {
  test('a mention reaches the notifications and opens its issue', async ({
    page,
    api,
    browser,
  }) => {
    const me = await api.get<{ userId: string }>('projects/me');
    const title = `收件箱提及 ${unique()}`;
    const lisa = await apiAs(browser, 'lisa');
    let issue: Issue;
    try {
      const lisaMe = await lisa.api.get<{ userId: string }>('projects/me');
      issue = await lisa.api.post<Issue>('projects/issues', {
        title,
        ownerUserId: lisaMe.userId,
      });
      await lisa.api.post(`projects/issues/${issue.id}/comments`, {
        content: `[@Alex Turner](mention://user/${me.userId}) 请帮忙看一下。`,
      });
    } finally {
      await lisa.close();
    }

    await open(page, '/inbox');
    const notifications = page.getByRole('tab', { name: /^通知/ });
    await notifications.click();
    await expect(page).toHaveURL(/view=notifications/);
    await expect(notifications).toHaveAttribute('aria-selected', 'true');
    const item = page
      .getByRole('button', { name: new RegExp(issue.identifier) })
      .first();
    await expect(item).toBeVisible();
    await item.click();
    expect(new URL(page.url()).searchParams.get('item')).toBeTruthy();
    const card = page.getByRole('article').filter({ hasText: title }).first();
    // The comment is quoted; the issue's recent activity below it lists it too.
    await expect(card.getByRole('blockquote')).toContainText('请帮忙看一下。');

    await card.getByRole('link', { name: title }).click();
    await expect(
      page.getByRole('heading', { name: title, level: 1 }),
    ).toBeVisible();
  });
});

test.describe('terminal decision cleanup', () => {
  test.use({ isolatedStudio: true, user: 'admin' });
  for (const statusKey of ['done', 'cancelled']) {
    test(`terminal ${statusKey} clears the open decision list and badge through realtime`, async ({
      page,
      api,
      browser,
      context,
      studio,
    }) => {
      const admin = await apiAs(browser, 'admin', studio);
      const settings = await admin.api.get<{
        firstChoiceAgentId: string | null;
        fallbackAgentId: string | null;
      }>('projectManager');
      const owner = {
        email: `inbox-terminal-${unique()}@example.com`,
        password: 'inbox-terminal-test-password',
      };
      try {
        await admin.api.post('users', {
          ...owner,
          name: 'Inbox terminal test owner',
          roleScopes: { studio: ['admin'] },
        });
        await signIn(context, owner);
        await api.patch('users/me/preferences', { locale: 'en-US' });
        await page.addInitScript(() => {
          localStorage.setItem('nocobase.locale', 'en-US');
          // Keep short UI timers, but suppress polling so only realtime can refresh the list.
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
        const me = await api.get<{ userId: string }>('projects/me');
        const runner = new FakeRunner(admin.api, `inbox-terminal-${unique()}`);
        const agent = await runner.agent();
        await admin.api.patch('projectManager', {
          firstChoiceAgentId: agent,
          fallbackAgentId: null,
        });
        const issue = await api.post<Issue>('projects/issues', {
          title: `Clear terminal decision ${statusKey}`,
          ownerUserId: me.userId,
          statusKey: 'in_progress',
          start: false,
        });
        await api.post(`projectManager/issues/${issue.id}/start`);
        const running = await runner.start(issue.identifier);
        const current = await api.get<Issue>(`projects/issues/${issue.id}`);
        await api.patch(
          `projects/issues/${issue.id}`,
          {
            revision: current.revision,
            statusKey: 'blocked',
            needsYou: 'Confirm the test decision.',
          },
          { 'x-nocobase-run-token': running.token },
        );
        await runner.complete(running.runId, 'Waiting for the test decision.');
        await expect
          .poll(
            async () =>
              (await api.get<{ decision: number }>('inbox/pending')).decision,
          )
          .toBe(1);
        const news = await admin.api.post<Issue>('projects/issues', {
          title: 'Keep ordinary information',
          executor: null,
          start: false,
        });
        await admin.api.post(`projects/issues/${news.id}/comments`, {
          content: `[@Inbox terminal test owner](mention://user/${me.userId}) Keep this information unread.`,
        });
        await expect
          .poll(
            async () => (await api.get<{ info: number }>('inbox/pending')).info,
          )
          .toBeGreaterThan(0);
        const infoBefore = (await api.get<{ info: number }>('inbox/pending'))
          .info;
        let subscribed = false;
        page.on('websocket', (socket) => {
          socket.on('framereceived', ({ payload }) => {
            try {
              const message = JSON.parse(payload.toString());
              if (
                message.type === 'subscribed' &&
                message.topic === STUDIO_INBOX_TOPIC
              )
                subscribed = true;
            } catch {
              /* Transport frames need not be JSON. */
            }
          });
        });
        await open(page, '/inbox');
        await expect.poll(() => subscribed).toBe(true);
        const item = page
          .getByRole('button', { name: new RegExp(issue.identifier) })
          .first();
        await expect(item).toBeVisible();
        const badge = page.getByTestId('studio-inbox-badge');
        await expect(badge).toHaveAttribute('data-kind', 'decisions');
        await expect(badge).toHaveText('1');
        await page.screenshot({
          path: test.info().outputPath(`${statusKey}-before.png`),
        });
        const navigations: string[] = [];
        page.on('request', (request) => {
          if (request.isNavigationRequest()) navigations.push(request.url());
        });
        const latest = await api.get<Issue>(`projects/issues/${issue.id}`);
        await api.patch(`projects/issues/${issue.id}`, {
          revision: latest.revision,
          statusKey,
        });
        await expect(item).toHaveCount(0);
        await expect(
          page.locator(
            '[data-testid="studio-inbox-badge"][data-kind="decisions"]',
          ),
        ).toHaveCount(0);
        await expect(badge).toHaveAttribute('data-kind', 'unread');
        expect(navigations).toEqual([]);
        expect(await api.get('inbox/pending')).toMatchObject({
          decision: 0,
          info: infoBefore,
        });
        expect(
          await api.get(`inbox/waiting?subject=issue:${issue.id}`),
        ).toEqual([]);
        await page.screenshot({
          path: test.info().outputPath(`${statusKey}-after.png`),
        });
      } finally {
        await admin.api.patch('projectManager', {
          firstChoiceAgentId: settings.firstChoiceAgentId,
          fallbackAgentId: settings.fallbackAgentId,
        });
        await admin.close();
      }
    });
  }
});
