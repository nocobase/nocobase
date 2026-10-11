import { expect, open, test, unique } from './support/fixtures.ts';

test.describe('release management', () => {
  test('the environments list shows the Preview environment running in process, with no registries page', async ({
    page,
  }) => {
    await open(page, '/environments');
    await expect(
      page.getByRole('heading', { name: '部署环境', level: 1 }),
    ).toBeVisible();
    const preview = page.getByRole('row', { name: /^预览 preview / });
    await expect(preview).toContainText('进程内');
    await expect(preview).not.toContainText('App Host');
    await expect(preview).toContainText('/{appId}/');
    await preview.getByRole('button', { name: '预览 的操作' }).click();
    await expect(page.getByRole('menuitem', { name: '编辑' })).toBeVisible();
    await page.keyboard.press('Escape');
    // Image registries are reached only from a Docker environment's form.
    await expect(page.getByRole('tab')).toHaveCount(0);
  });

  test('an in-process environment is created from its form, protected, without deploying anything', async ({
    page,
    api,
  }) => {
    const id = `e2e-${unique()}`;
    const name = `测试环境 ${id}`;
    await open(page, '/environments');
    await page.getByRole('button', { name: '添加环境' }).click();

    // With more than one driver the dialog asks for it first; the built-in one ("this server") is under test.
    const form = page.getByRole('dialog', { name: /^添加( 本服务器 )?环境$/ });
    await expect(form).toBeVisible();
    const driver = form.getByRole('radio', { name: /^本服务器/ });
    if (await driver.isVisible()) {
      await driver.click();
      await form.getByRole('button', { name: '继续' }).click();
    }

    const save = form.getByRole('button', { name: '保存' });
    await expect(save).toBeDisabled();
    await form.getByRole('textbox', { name: '名称' }).fill(name);
    await form.getByRole('textbox', { name: '环境 ID' }).fill(id);
    const runMode = form.getByRole('radiogroup', { name: '运行方式' });
    await runMode.getByRole('radio', { name: /^进程内/ }).check();
    await expect(runMode.getByRole('radio', { name: /^进程内/ })).toBeChecked();
    // Nothing read-only posing as a setting.
    await expect(form.getByText('高级设置')).toHaveCount(0);
    await form.getByRole('checkbox', { name: '受保护' }).check();
    await save.click();
    await expect(form).toBeHidden();

    const row = page.getByRole('row', { name: new RegExp(`^${name} ${id} `) });
    await expect(row).toContainText('进程内');
    await expect(row).toContainText('受保护');

    const environments = await api.get<
      {
        id: string;
        driver: string;
        protected: boolean;
        config: { backend?: string };
      }[]
    >('releases/environments');
    expect(
      environments.find((environment) => environment.id === id),
    ).toMatchObject({
      driver: 'host',
      protected: true,
      config: { backend: 'in-process' },
    });
    // Creating an environment deploys nothing to it; the demo's Apps live in environments of their own.
    const apps =
      await api.get<{ app: { environmentId: string } }[]>('releases/apps');
    expect(apps.filter((item) => item.app.environmentId === id)).toEqual([]);

    await row.getByRole('button', { name: `${name} 的操作` }).click();
    await page.getByRole('menuitem', { name: '删除' }).click();
    const confirm = page.getByRole('alertdialog');
    await confirm.getByRole('button', { name: '删除' }).click();
    await expect(row).toBeHidden();
  });

  test('the Apps page opens as the current navigation entry', async ({
    page,
  }) => {
    await open(page, '/releases');
    await expect(
      page.getByRole('heading', { name: '应用', level: 1 }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: '应用导航' })
        .getByRole('link', { name: '应用' }),
    ).toHaveAttribute('aria-current', 'page');
  });
});
