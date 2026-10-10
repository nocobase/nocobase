import type { APIRequestContext, Page } from '@playwright/test';

import {
  atHome,
  expect,
  open,
  server,
  test,
  unique,
  url,
} from './support/fixtures.ts';

/** Calls the API with an API key instead of a session, from a request context with no cookies. */
async function withKey(
  request: APIRequestContext,
  key: string,
  path: string,
): Promise<number> {
  const response = await request.get(url(`/api/${path}`), {
    headers: { 'x-api-key': key, origin: server.origin, connection: 'close' },
  });
  return response.status();
}

async function settingsSection(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: '设置导航' })
    .getByRole('link', { name, exact: true })
    .click();
  return page.getByRole('region', { name });
}

test.describe('settings', () => {
  test('the settings navigation opens each section and goes back', async ({
    page,
  }) => {
    await open(page, '/config');
    // The bare URL opens the first page, titled by its own heading.
    await expect(
      page.getByRole('heading', { name: '常规', level: 1 }),
    ).toBeVisible();
    for (const name of ['成员', '角色', 'API 密钥', '流程模板', '标签']) {
      const section = await settingsSection(page, name);
      await expect(
        section.getByRole('heading', { name, level: 1 }),
      ).toBeVisible();
    }
    // Opened directly, the settings' Back leads home.
    await page
      .getByRole('navigation', { name: '设置导航' })
      .getByRole('link', { name: '返回' })
      .click();
    await expect(page).toHaveURL(atHome());
  });

  test('a member is given the admin role and has it taken away again', async ({
    page,
  }) => {
    await open(page, '/config/members');
    const members = page.getByRole('region', { name: '成员' });
    const row = members.getByRole('row', { name: /Zach Lewis/ });
    await expect(row.getByRole('toolbar')).not.toContainText('管理员');

    await row.getByRole('combobox', { name: 'Zach Lewis 的角色' }).click();
    await page.getByRole('option', { name: '管理员' }).click();
    await page.keyboard.press('Escape');
    await expect(row.getByRole('toolbar')).toContainText('管理员');

    await page.reload();
    const reloaded = page
      .getByRole('region', { name: '成员' })
      .getByRole('row', { name: /Zach Lewis/ });
    await expect(reloaded.getByRole('toolbar')).toContainText('管理员');

    await reloaded.getByRole('combobox', { name: 'Zach Lewis 的角色' }).click();
    await page.getByRole('option', { name: '管理员' }).click();
    await page.keyboard.press('Escape');
    await expect(reloaded.getByRole('toolbar')).not.toContainText('管理员');
  });

  test('a new role is created and opens on its own page', async ({ page }) => {
    const name = `测试角色 ${unique()}`;
    await open(page, '/config/roles');
    await page.getByRole('button', { name: '新建角色' }).click();
    const dialog = page.getByRole('dialog', { name: '新建角色', exact: true });
    await dialog.getByRole('textbox', { name: '名称' }).fill(name);
    await dialog.getByRole('button', { name: '创建' }).click();
    await expect(dialog).toBeHidden();

    // It opens on its own page, ready for its permissions.
    await expect(page).toHaveURL(/\/config\/roles\/.+/);
    await expect(
      page.getByRole('heading', { name: `${name} 自定义`, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '任务', level: 3 }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: '角色' })
        .getByRole('button', { name: `${name} 的操作` }),
    ).toBeVisible();
  });

  test('a workflow template gets a rule added through the rules dialog', async ({
    page,
    api,
  }) => {
    const name = `评审流程 ${unique()}`;
    await open(page, '/config/workflows');
    await page.getByRole('button', { name: '新建流程模板' }).click();
    const create = page.getByRole('dialog', {
      name: '新建流程模板',
      exact: true,
    });
    await create.getByRole('textbox', { name: '名称' }).fill(name);
    await expect(create.getByRole('combobox', { name: '基于' })).toContainText(
      'AI 评审开发',
    );
    await create.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/config\/workflows\/\d+/);
    const workflowId = new URL(page.url()).pathname.split('/').pop() ?? '';

    const transition = page.getByRole('button', {
      name: '从 开发中 到 已完成',
    });
    await page.getByRole('button', { name: '编辑', exact: true }).click();
    // Copied from AI-reviewed development: a person moves it to Done, with no approval.
    await expect(transition).toHaveText('人');

    await page.getByRole('button', { name: '进入“受阻”时' }).click();
    const rules = page.getByRole('dialog', { name: '进入“受阻”时' });
    await rules.getByRole('button', { name: '添加规则' }).click();
    await page.getByRole('menuitem', { name: /^通知负责人/ }).click();
    await expect(
      rules.getByRole('button', { name: /^通知负责人/ }),
    ).toBeVisible();
    await rules.getByRole('button', { name: '完成' }).click();
    await expect(rules).toBeHidden();

    await page.getByRole('button', { name: '保存' }).click();
    await expect
      .poll(async () => {
        const workflow = await api.get<{
          definition: { states: { key: string; rules?: { type: string }[] }[] };
        }>(`projects/workflows/${workflowId}`);
        const blocked = workflow.definition.states.find(
          (state) => state.key === 'blocked',
        );
        return (blocked?.rules ?? []).map((rule) => rule.type);
      })
      .toContain('notifyOwner');
    await expect(
      page
        .getByRole('region', { name: '进入状态时' })
        .getByRole('listitem')
        .filter({ hasText: '受阻' }),
    ).toContainText('通知负责人');
  });

  test('a label is created, recoloured, renamed and deleted', async ({
    page,
  }) => {
    const name = `标签${unique()}`;
    await open(page, '/config/labels');
    const labels = page.getByRole('region', { name: '标签' });
    await labels.getByRole('textbox', { name: '新标签名称' }).fill(name);
    await labels
      .getByRole('radiogroup', { name: '新标签颜色' })
      .getByRole('radio', { name: '绿色' })
      .click();
    await labels.getByRole('button', { name: '新建标签' }).click();

    const row = labels.getByRole('row', { name: new RegExp(`^${name} `) });
    await expect(row.getByRole('radio', { name: '绿色' })).toBeChecked();
    await row.getByRole('radio', { name: '紫色' }).click();
    await expect(row.getByRole('radio', { name: '紫色' })).toBeChecked();
    await page.reload();
    await expect(
      page
        .getByRole('region', { name: '标签' })
        .getByRole('row', { name: new RegExp(`^${name} `) })
        .getByRole('radio', { name: '紫色' }),
    ).toBeChecked();

    const renamed = `${name}改`;
    const current = page
      .getByRole('region', { name: '标签' })
      .getByRole('row', { name: new RegExp(`^${name} `) });
    await current.getByRole('button', { name: `${name} 的操作` }).click();
    await page.getByRole('menuitem', { name: '重命名' }).click();
    const input = page.getByRole('textbox', { name: /名称/ }).last();
    await input.fill(renamed);
    await input.press('Enter');
    const renamedRow = page
      .getByRole('region', { name: '标签' })
      .getByRole('row', { name: new RegExp(`^${renamed} `) });
    await expect(renamedRow).toBeVisible();

    await renamedRow.getByRole('button', { name: `${renamed} 的操作` }).click();
    await page.getByRole('menuitem', { name: '删除标签' }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText(renamed);
    await confirm.getByRole('button', { name: '删除' }).click();
    await expect(renamedRow).toBeHidden();
  });

  test('an API key shows its secret once, works, and is rotated', async ({
    page,
    playwright,
  }) => {
    const name = `CI 部署 ${unique()}`;
    const anonymous = await playwright.request.newContext();
    try {
      await open(page, '/config/api-keys');
      const section = page.getByRole('region', { name: 'API 密钥' });
      await section.getByRole('button', { name: '创建密钥' }).click();
      const create = page.getByRole('dialog', {
        name: '创建 API 密钥',
        exact: true,
      });
      await create.getByRole('textbox', { name: '名称' }).fill(name);
      await create.getByRole('combobox', { name: '任务的访问级别' }).click();
      await page.getByRole('option', { name: '只读' }).click();
      await create.getByRole('button', { name: '创建密钥' }).click();

      const shown = page.getByRole('dialog', {
        name: `密钥 ${name}`,
        exact: true,
      });
      await expect(shown.getByText('它只显示这一次')).toBeVisible();
      const secret = await shown
        .getByRole('textbox', { name: '密钥' })
        .inputValue();
      expect(secret.length).toBeGreaterThan(20);
      expect(
        await withKey(anonymous, secret, 'projects/issues?pageSize=1'),
      ).toBe(200);
      await shown.getByRole('button', { name: '完成' }).click();

      // Once closed, the list shows only the key's start, never the secret.
      const row = section.getByRole('row', { name: new RegExp(name) });
      await expect(row).toContainText('任务: 只读');
      await expect(row).toContainText(`${secret.slice(0, 6)}…`);
      await page.reload();
      await expect(page.getByText(secret)).toHaveCount(0);
      expect(await page.content()).not.toContain(secret);

      // Right after the reload the list may still re-render from its refetch and close a menu opened too early, so
      // open it again until the item shows.
      const rotate = page.getByRole('menuitem', { name: /轮换/ });
      await expect(async () => {
        if (!(await rotate.isVisible()))
          await page
            .getByRole('region', { name: 'API 密钥' })
            .getByRole('button', { name: `${name} 的操作` })
            .click();
        await expect(rotate).toBeVisible({ timeout: 2000 });
      }).toPass({ timeout: 20_000 });
      await rotate.click();
      const confirm = page.getByRole('alertdialog', {
        name: `轮换密钥 ${name}？`,
      });
      await expect(confirm).toContainText('当前的立即失效');
      await confirm.getByRole('button', { name: '轮换' }).click();

      const rotated = page.getByRole('dialog', {
        name: `密钥 ${name}`,
        exact: true,
      });
      const next = await rotated
        .getByRole('textbox', { name: '密钥' })
        .inputValue();
      expect(next).not.toBe(secret);
      await rotated.getByRole('button', { name: '完成' }).click();
      expect(await withKey(anonymous, next, 'projects/issues?pageSize=1')).toBe(
        200,
      );
      expect(
        await withKey(anonymous, secret, 'projects/issues?pageSize=1'),
      ).toBe(401);
    } finally {
      await anonymous.dispose();
    }
  });
});
