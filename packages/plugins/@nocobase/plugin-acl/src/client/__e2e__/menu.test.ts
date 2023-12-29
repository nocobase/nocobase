import { expect, test } from '@nocobase/test/e2e';

test('menu permission ', async ({ page, mockPage, mockRole, updateRole }) => {
  const page2 = await mockPage({ name: 'page2' });
  const page1 = await mockPage({ name: 'page1' });
  await page1.goto();
  const uid1 = await page1.getUid();
  const uid2 = await page2.getUid();
  //新建角色并切换到新角色，page1有权限,page2无权限
  const roleData = await mockRole({
    snippets: ['pm.*'],
    strategy: {
      actions: ['view', 'update'],
    },
    menuUiSchemas: [uid1],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await expect(await page.getByLabel('page1')).toBeVisible();
  await expect(await page.getByLabel('page2')).not.toBeVisible();
  await page.getByTestId('plugin-settings-button').hover();
  await page.getByLabel('acl').click();
  await page.getByLabel(`action-Action.Link-Configure-roles-${roleData.name}`).click();
  await page.getByRole('tab').getByText('Menu permissions').click();
  await page.waitForSelector('.ant-table');
  const page1Menu = await page.getByRole('row', { name: 'page1' }).locator('.ant-checkbox-input');
  const page2Menu = await page.getByRole('row', { name: 'page2' }).locator('.ant-checkbox-input');
  await expect(await page1Menu.isChecked()).toBe(true);
  await expect(await page2Menu.isChecked()).toBe(false);
  //修改菜单权限，page1无权限,page2有权限
  await updateRole({ name: roleData.name, menuUiSchemas: [uid2] });
  await page.reload();
  await expect(await page.getByLabel('page2')).toBeVisible();
  await expect(await page.getByLabel('page1')).not.toBeVisible();
  await page.getByTestId('plugin-settings-button').hover();
  await page.getByLabel('acl').click();
  await page.getByLabel(`action-Action.Link-Configure-roles-${roleData.name}`).click();
  await page.getByRole('tab').getByText('Menu permissions').click();
  await page.waitForSelector('.ant-table');
  const page1Menu1 = await page.getByRole('row', { name: 'page1' }).locator('.ant-checkbox-input');
  const page2Menu1 = await page.getByRole('row', { name: 'page2' }).locator('.ant-checkbox-input');
  await expect(await page1Menu1.isChecked()).toBe(false);
  await expect(await page2Menu1.isChecked()).toBe(true);
  //通过路由访问无权限的菜单,跳到有权限的第一个菜单
  await page.goto(`/admin/${uid1}`);
  await page.waitForSelector('.nb-page-wrapper');
  await expect(await page.url()).toContain(uid2);
});
