import { apiAs, expect, open, test, unique } from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';

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
    await expect(card.getByText('请帮忙看一下。')).toBeVisible();

    await card.getByRole('link', { name: '打开任务' }).first().click();
    await expect(
      page.getByRole('heading', { name: title, level: 1 }),
    ).toBeVisible();
  });
});
