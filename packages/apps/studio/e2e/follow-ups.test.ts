import { expect, open, test, unique, url } from './support/fixtures.ts';
import type { Issue } from './support/runner.ts';

// Fail the actual inaccessible action before the test deadline, and give cleanup its own afterEach budget.
test.use({ actionTimeout: 10_000 });
const fixtureIds: string[] = [];
test.beforeEach(() => {
  fixtureIds.length = 0;
});
test.afterEach(async ({ api }) => {
  await test.step('Clean up explicit following and workspace fixtures', async () => {
    await api.put('followUps/following', { issueIds: [] });
    for (const id of [...fixtureIds].reverse())
      await api.delete(`projects/issues/${id}`);
  });
});

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
    fixtureIds.push(review.id);
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
      url(`/my-issues/owned?view=list&q=${suffix}&tab=following#activity`),
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
    await test.step('Preview an unfollowed task and open its full scoped detail', async () => {
      // A plain row link previews without following; the explicit action opens the full scoped detail.
      await row
        .getByRole('link', { name: review.identifier, exact: true })
        .click();
      await expect(page).toHaveURL(
        new RegExp(`/my-issues/owned\\?.*issue=${review.id}`),
      );
      await expect(
        page.getByText('正在查看（未关注）', { exact: true }),
      ).toBeVisible();
      await expect
        .poll(
          async () =>
            (await api.get<{ following: string[] }>('followUps')).following,
        )
        .toEqual([]);
      await page.getByRole('link', { name: '打开任务', exact: true }).click();
    });
    await expect(
      page.getByRole('heading', { name: review.title }).last(),
    ).toBeVisible();
    await expect(page.getByTestId('issue-needs-you')).toBeVisible();
    await expect(page.getByTestId('issue-feed')).toContainText(
      '改动已完成，请验收。',
    );
    await test.step('Follow from full detail and return with browser history', async () => {
      await page.getByRole('button', { name: '关注', exact: true }).click();
      await expect
        .poll(
          async () =>
            (await api.get<{ following: string[] }>('followUps')).following,
        )
        .toEqual([review.id]);
      await page.goBack();
      await expect(page.getByTestId('follow-ups-following')).toBeVisible();
    });
    const rail = page.getByTestId('follow-ups-following');
    const followed = rail.getByRole('button').filter({ hasText: review.title });
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
        `/my-issues/owned?view=list&issue=${review.id}&q=${suffix}&tab=following#activity`,
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
  });
});

test('both scopes retain grouped expansion, keyboard preview, draft return and real search composition', async ({
  page,
  api,
}) => {
  test.setTimeout(120_000);
  const me = await api.get<{ userId: string }>('projects/me');
  const suffix = unique();
  const parent = await api.post<Issue>('projects/issues', {
    title: `Workspace parent ${suffix}`,
    ownerUserId: me.userId,
    executor: { type: 'user', id: me.userId },
    start: false,
  });
  fixtureIds.push(parent.id);
  const child = await api.post<Issue>('projects/issues', {
    title: `Workspace child ${suffix}`,
    parentIssueId: parent.id,
    ownerUserId: me.userId,
    executor: { type: 'user', id: me.userId },
    start: false,
  });
  fixtureIds.push(child.id);
  await api.put('followUps/following', { issueIds: [] });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await open(page, `/my-issues/owned?view=list&q=${suffix}#reply`);
  const expand = page.getByRole('button', {
    name: `展开${parent.identifier}的子任务`,
    exact: true,
  });
  await expand.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('link', { name: child.identifier, exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/my-issues/owned\\?.*q=${suffix}`));
  const parentRow = page.getByRole('row').filter({
    has: page.getByRole('link', { name: parent.identifier, exact: true }),
  });
  await parentRow.getByRole('button', { name: '关注', exact: true }).click();
  await expect
    .poll(
      async () =>
        (await api.get<{ following: string[] }>('followUps')).following,
    )
    .toEqual([parent.id]);
  await expect(page.getByRole('table')).toHaveAttribute('data-compact', 'true');
  await expect(
    page.getByRole('link', { name: child.identifier, exact: true }),
  ).toBeVisible();
  const childLink = page.getByRole('link', {
    name: child.identifier,
    exact: true,
  });
  await childLink.focus();
  await page.keyboard.press('Enter');
  const activity = page.getByRole('region', { name: '任务动态' });
  await expect(
    activity.getByRole('heading', { name: child.title }).last(),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (await api.get<{ following: string[] }>('followUps')).following,
    )
    .toEqual([parent.id]);
  await page.goBack();
  await expect(
    activity.getByRole('heading', { name: parent.title }).last(),
  ).toBeVisible();
  await page.goForward();
  await expect(
    activity.getByRole('heading', { name: child.title }).last(),
  ).toBeVisible();
  const editor = activity.getByRole('textbox', { name: '评论' });
  await expect(editor).toBeVisible();
  await expect(editor).toBeEditable();
  await test.step('Type a desktop draft and switch to executing without losing it', async () => {
    await editor.click();
    await editor.pressSequentially('Unsent workspace draft');
    await page.getByRole('tab', { name: '我执行的' }).click();
    await expect(editor).toContainText('Unsent workspace draft');
    await expect(page.getByRole('table')).toHaveAttribute(
      'data-compact',
      'true',
    );
  });
  const search = page.getByRole('textbox', { name: '搜索任务' });
  await test.step('Keep the preview during empty search and commit a real IME composition', async () => {
    await search.fill('no matching task');
    await expect(page.getByRole('table')).toContainText(
      '没有符合筛选条件的任务。',
    );
    await expect(
      activity.getByRole('heading', { name: child.title }).last(),
    ).toBeVisible();
    await search.fill(suffix);
    await search.focus();
    const ime = await page.context().newCDPSession(page);
    await ime.send('Input.imeSetComposition', {
      text: 'ren',
      selectionStart: 3,
      selectionEnd: 3,
    });
    await expect(search).toBeFocused();
    await ime.send('Input.insertText', { text: '人' });
    await expect(search).toHaveValue(`${suffix}人`);
    await ime.detach();
    await search.fill(suffix);
    await expect(
      page.getByRole('link', { name: parent.identifier, exact: true }),
    ).toBeVisible();
  });
  await test.step('Return from the mobile list and reopen the retained draft editor', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await activity
      .getByRole('button', { name: '返回列表', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: /返回未发送草稿/ }),
    ).toBeVisible();
    await page.getByRole('button', { name: /返回未发送草稿/ }).click();
    await activity.getByRole('button', { name: /写评论/u }).click();
    const returnedEditor = activity.getByRole('textbox', { name: '评论' });
    await expect(returnedEditor).toBeVisible();
    await expect(returnedEditor).toBeEditable();
    await expect(returnedEditor).toContainText('Unsent workspace draft');
  });
});
