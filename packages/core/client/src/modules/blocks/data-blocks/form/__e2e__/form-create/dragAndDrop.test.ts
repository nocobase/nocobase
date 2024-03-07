import { expect, oneFormBlockBasedOnUsers, test } from '@nocobase/test/e2e';

test('fields', async ({ page, mockPage }) => {
  await mockPage(oneFormBlockBasedOnUsers).goto();
  await page.getByLabel('schema-initializer-Grid-form:configureFields-users').hover();
  await page.getByRole('menuitem', { name: 'Nickname' }).click();
  await page.getByRole('menuitem', { name: 'Username' }).click();
  await page.getByRole('menuitem', { name: 'Email' }).click();
  await page.mouse.move(300, 0);

  await page.getByLabel('block-item-CollectionField-users-form-users.nickname').hover();
  await page
    .getByLabel('block-item-CollectionField-users-form-users.nickname')
    .getByLabel('designer-drag')
    .dragTo(page.getByLabel('block-item-CollectionField-users-form-users.username'));

  await page.getByLabel('block-item-CollectionField-users-form-users.nickname').hover();
  await page
    .getByLabel('block-item-CollectionField-users-form-users.nickname')
    .getByLabel('designer-drag')
    .dragTo(page.getByLabel('block-item-CollectionField-users-form-users.email'));

  const nickname = await page.getByLabel('block-item-CollectionField-users-form-users.nickname').boundingBox();
  const username = await page.getByLabel('block-item-CollectionField-users-form-users.username').boundingBox();
  const email = await page.getByLabel('block-item-CollectionField-users-form-users.email').boundingBox();
  const max = Math.max(username.y, nickname.y, email.y);
  //拖拽调整排序符合预期
  expect(nickname.y).toBe(max);
});

test('actions', async () => {});
