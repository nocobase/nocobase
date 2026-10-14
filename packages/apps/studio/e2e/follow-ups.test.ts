import { expect, open, test, unique, signIn } from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';

test.describe('my follow-ups', () => {
  test('lists what the viewer owns, shows an issue’s activity and keeps what they follow', async ({
    page,
    api,
    context,
  }) => {
    const suffix = unique();
    const owner = {
      email: `follow-ups-${suffix}@example.com`,
      password: 'isolated-follow-ups-password',
    };
    await api.post('users', {
      ...owner,
      name: 'Follow-ups test owner',
      roleScopes: { studio: ['admin'] },
    });
    await signIn(context, owner);
    const me = await api.get<{ userId: string }>('projects/me');
    const needsYou =
      'Please review the completed work. Confirm the acceptance decision.';
    const next = 'Apply the owner’s review feedback after acceptance.';
    const review = await api.post<Issue>('projects/issues', {
      title: `待验收的跟进 ${suffix}`,
      ownerUserId: me.userId,
      start: false,
    });
    await api.patch(`projects/issues/${review.id}`, {
      statusKey: 'in_review',
      needsYou,
      next,
    });
    await api.post(`projects/issues/${review.id}/comments`, {
      content: '改动已完成，请验收。',
    });
    await api.put('followUps/following', { issueIds: [] });

    await open(page, '/follow-ups');
    // Follow-ups follows the default landing navigation, including the inbox's live count.
    const menu = page.getByRole('navigation', { name: '应用导航' });
    const entries = menu.getByRole('link');
    await expect(entries.nth(0)).toHaveAccessibleName('我的任务');
    await expect(entries.nth(1)).toHaveAccessibleName('我的 Agent');
    await expect(entries.nth(2)).toHaveAccessibleName(/^收件箱(?:，.*)?$/u);
    await expect(entries.nth(3)).toHaveAccessibleName('仪表盘');
    await expect(entries.nth(4)).toHaveAccessibleName('我的跟进');
    await expect(
      page.getByRole('heading', { name: '我的跟进', level: 1 }),
    ).toBeVisible();

    const mine = page.getByTestId('follow-ups-mine');
    await mine.getByRole('searchbox').fill(suffix);
    const row = mine.locator(`li[data-issue="${review.identifier}"]`);
    await expect(row).toContainText(needsYou);
    await row.getByText(review.title).click();

    const activity = page.getByTestId('follow-ups-activity');
    await expect(
      activity.getByRole('heading', { name: review.title }),
    ).toBeVisible();
    await expect(activity.getByTestId('issue-needs-you')).toContainText(
      needsYou,
    );
    await expect(activity.getByTestId('issue-summary')).toContainText(next);
    await expect(activity.getByTestId('issue-summary')).not.toContainText(
      '改动已完成，请验收。',
    );
    await expect(activity.getByTestId('issue-feed')).toContainText(
      '改动已完成，请验收。',
    );
    await expect(page.getByTestId('follow-ups-following')).toContainText(
      '正在查看（未关注）',
    );

    await row
      .getByRole('button', { name: `关注 ${review.identifier}` })
      .click();
    const rail = page.getByTestId('follow-ups-following');
    await expect(
      rail.locator(`[data-issue="${review.identifier}"]`),
    ).toBeVisible();

    await page.reload();
    await expect(
      page
        .getByTestId('follow-ups-following')
        .locator(`[data-issue="${review.identifier}"]`),
    ).toBeVisible();
    await expect(
      rail.locator(`[data-issue="${review.identifier}"]`),
    ).toContainText(needsYou);
    await expect(activity.getByTestId('issue-needs-you')).toContainText(
      needsYou,
    );
    await expect(activity.getByTestId('issue-summary')).toContainText(next);
  });
});
