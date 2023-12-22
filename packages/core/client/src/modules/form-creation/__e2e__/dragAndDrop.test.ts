import { expect, oneFormBlockBasedOnUsers, test } from '@nocobase/test/e2e';

test('fields', async ({ page, mockPage }) => {
  await mockPage(oneFormBlockBasedOnUsers).goto();
  await page.getByLabel('schema-initializer-Grid-FormItemInitializers-users').click();
  await page.getByRole('menuitem', { name: 'Nickname' }).click();
  await page.getByRole('menuitem', { name: 'Username' }).click();
  await page.getByRole('menuitem', { name: 'Email' }).click();

  const sourceElement = page.getByLabel('block-item-CollectionField-users-form-users.nickname');
  await sourceElement.hover();
  const source = sourceElement.getByLabel('designer-drag');
  await source.hover();
  const targetElement = page.getByLabel('block-item-CollectionField-users-form-users.username');
  await source.dragTo(targetElement);

  const targetElement2 = page.getByLabel('block-item-CollectionField-users-form-users.email');
  await source.hover();
  await source.dragTo(targetElement2);

  await sourceElement.hover();
  const nickname = await source.boundingBox();
  const username = await targetElement.boundingBox();
  const email = await targetElement2.boundingBox();
  const max = Math.max(username.y, nickname.y, email.y);
  //拖拽调整排序符合预期
  expect(nickname.y).toBe(max);
});

test('actions', async () => {});
