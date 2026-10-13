import { expect, open, test, unique, url } from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';

test.describe('personal task workspace', () => {
  test('lists personal tasks, opens scoped details and keeps explicit following through legacy links and refresh', async ({
    page,
    api,
  }) => {
    const me = await api.get<{ userId: string }>('projects/me');
    const suffix = unique();
    const review = await api.post<Issue>('projects/issues', {
      title: `待验收的跟进 ${suffix}`,
      ownerUserId: me.userId,
      start: false,
    });
    try {
      await api.patch(`projects/issues/${review.id}`, {
        revision: review.revision,
        statusKey: 'in_review',
      });
      await api.post(`projects/issues/${review.id}/comments`, {
        content: '改动已完成，请验收。',
      });
      await api.put('followUps/following', { issueIds: [] });
      await open(page, `/follow-ups?view=list&q=${suffix}#activity`);
      await expect(page).toHaveURL(
        url(`/my-issues/owned?view=list&q=${suffix}#activity`),
      );
      const menu = page.getByRole('navigation', { name: '应用导航' });
      const entries = menu.getByRole('link');
      await expect(entries.nth(0)).toHaveAccessibleName('我的任务-α');
      await expect(entries.nth(1)).toHaveAccessibleName('我的 Agent');
      await expect(entries.nth(2)).toHaveAccessibleName(/^收件箱(?:，.*)?$/u);
      await expect(entries.nth(3)).toHaveAccessibleName('仪表盘');
      await expect(
        menu.getByRole('link', { name: '我的跟进', exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('heading', { name: '我的任务-α', level: 1 }).last(),
      ).toBeVisible();
      await expect(page.getByTestId('follow-ups-following')).toHaveCount(0);
      await expect(page.getByRole('textbox', { name: '搜索任务' })).toHaveValue(
        suffix,
      );
      const row = page.getByRole('row').filter({ hasText: review.title });
      await expect(row).toHaveCount(1);
      // Row preview/follow slots are a later PM-336 integration; use the existing full-detail link now.
      await row
        .getByRole('link', { name: review.identifier, exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: review.title }).last(),
      ).toBeVisible();
      await expect(page.getByTestId('issue-needs-you')).toBeVisible();
      await expect(page.getByTestId('issue-feed')).toContainText(
        '改动已完成，请验收。',
      );
      await page.getByRole('button', { name: '关注', exact: true }).click();
      await expect
        .poll(
          async () =>
            (await api.get<{ following: string[] }>('followUps')).following,
        )
        .toEqual([review.id]);
      await page.goBack();
      await expect(page.getByTestId('follow-ups-following')).toBeVisible();
      const rail = page.getByTestId('follow-ups-following');
      const followed = rail
        .getByRole('button')
        .filter({ hasText: review.title });
      await expect(followed).toBeVisible();
      await followed.click();
      const activity = page.getByRole('region', { name: '任务动态' });
      await expect(activity.getByTestId('issue-feed')).toContainText(
        '改动已完成，请验收。',
      );
      await page.reload();
      await expect(
        rail.getByRole('button').filter({ hasText: review.title }),
      ).toHaveAttribute('aria-current', 'true');
      await expect(activity.getByTestId('issue-feed')).toContainText(
        '改动已完成，请验收。',
      );
      await api.put('followUps/following', { issueIds: [] });
      await open(
        page,
        `/follow-ups?view=list&issue=${review.id}&q=${suffix}#activity`,
      );
      await expect(page).toHaveURL(
        url(
          `/my-issues/owned?view=list&issue=${review.id}&q=${suffix}#activity`,
        ),
      );
      await expect(
        page.getByText('正在查看（未关注）', { exact: true }),
      ).toBeVisible();
      await expect(activity.getByTestId('issue-feed')).toBeVisible();
      await expect
        .poll(
          async () =>
            (await api.get<{ following: string[] }>('followUps')).following,
        )
        .toEqual([]);
    } finally {
      await api.put('followUps/following', { issueIds: [] });
      await api.delete(`projects/issues/${review.id}`);
    }
  });
});
