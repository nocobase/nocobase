import { createBlockInPage, expect, oneEmptyListBlock, test } from '@nocobase/test/e2e';

test.describe('where list block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'List');
    await expect(page.getByLabel('block-item-CardItem-users-list')).toBeVisible();
  });
});

test.describe('configure global actions', () => {
  test('filter & add new & refresh', async ({ page, mockPage }) => {
    await mockPage(oneEmptyListBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-list:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-list:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });
});

test.describe('configure item actions', () => {
  test('view & edit & delete', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyListBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-list:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-list').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-list').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-list').first()).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-list:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-list').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-list').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-list').first()).not.toBeVisible();
  });

  test('customize: popup & update record', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyListBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-list:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'Popup' }).click();
    await page.getByRole('menuitem', { name: 'Update record' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-Popup-customize:popup-general-list').first()).toBeVisible();
    await expect(
      page.getByLabel('action-Action.Link-Update record-customize:update-general-list').first(),
    ).toBeVisible();
  });
});

test.describe('configure fields', () => {
  test('display collection fields & display association fields & add text', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyListBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-details:configureFields-general').first();

    // add fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    // TODO: 二级菜单点击后，不应该被关闭；只有在鼠标移出下拉列表的时候，才应该被关闭
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-list-general.id-ID').first()).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-list-general.manyToOne.nickname').first(),
    ).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('tooltip').getByText('Display association fields').hover();
    await page.mouse.wheel(0, -300);
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-list-general.id-ID').first()).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-list-general.manyToOne.nickname').first(),
    ).not.toBeVisible();

    // add text
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Add text' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-list').first()).toBeVisible();
  });
});
