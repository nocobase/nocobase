import { expect, horizontalOverflow, open, test } from './support/fixtures.ts';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

/** Key pages at phone width, and what shows that each one rendered. */
const PAGES: readonly { path: string; heading: string | null }[] = [
  { path: '/', heading: '今天要做什么？' },
  { path: '/dashboard', heading: '仪表盘' },
  { path: '/inbox', heading: '收件箱' },
  { path: '/my-issues', heading: '我的任务' },
  { path: '/issues?view=list', heading: '任务' },
  { path: '/issues?view=board', heading: '任务' },
  { path: '/issues?view=agent', heading: '任务' },
  {
    path: '/issues/PM-1',
    heading:
      'Drag to reorder issues on the board and move them between columns',
  },
  { path: '/issues/new', heading: null },
  { path: '/projects', heading: '项目' },
  { path: '/knowledge', heading: '系统知识' },
  { path: '/config/members', heading: '成员' },
  { path: '/config/workflows', heading: '流程模板' },
  { path: '/config/api-keys', heading: 'API 密钥' },
  { path: '/environments', heading: '部署环境' },
];

test.describe('phone width', () => {
  for (const { path, heading } of PAGES) {
    test(`${path} has no horizontal overflow`, async ({ page }) => {
      await open(page, path);
      if (heading)
        await expect(
          page.getByRole('heading', { name: heading, level: 1 }).last(),
        ).toBeVisible();
      else
        await expect(
          page.getByRole('dialog', { name: '新建任务', exact: true }),
        ).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }

  test('the account settings dialog fits a phone', async ({ page }) => {
    await open(page, '/account/preferences');
    const dialog = page.getByRole('dialog', { name: '个人设置' });
    await expect(
      dialog.getByRole('region', { name: '偏好设置' }),
    ).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('the navigation opens from the header on a phone', async ({ page }) => {
    await open(page, '/inbox');
    const nav = page.getByRole('navigation', { name: '应用导航' });
    await expect(nav).toBeHidden();
    await page
      .getByRole('banner')
      .getByRole('button', { name: /导航/ })
      .click();
    await expect(nav).toBeVisible();
    await nav.getByRole('link', { name: '任务', exact: true }).click();
    await expect(page).toHaveURL(/\/issues/);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});

test.describe('header chat at phone width', () => {
  test('the multiline editor fits and the duplicate floating launcher is absent', async ({
    page,
  }) => {
    await open(page, '/issues/PM-1');
    const editor = page.getByTestId('header-chat-mobile').getByRole('textbox');
    await editor.pressSequentially('第一行');
    await editor.press('Shift+Enter');
    await editor.pressSequentially('第二行');
    await expect(editor).toHaveValue('第一行\n第二行');
    await expect(page.getByTestId('chat-floating-button')).toHaveCount(0);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    expect((await editor.boundingBox())!.width).toBeGreaterThan(240);
  });
});
