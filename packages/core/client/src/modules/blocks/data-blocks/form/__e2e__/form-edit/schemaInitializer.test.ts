import { expect, oneEmptyTableBlockWithActions, test } from '@nocobase/test/e2e';
import { T3848 } from '../../../details-single/__e2e__/templatesOfBug';

test.describe('where edit form block can be added', () => {
  test('popup', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-Edit-update-general-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByText('Form').first().click();
    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
  });

  // https://nocobase.height.app/T-3848/description
  test('popup opened by clicking on the button for the relationship field', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T3848).waitForInit();
    await mockRecord('example');
    await nocoPage.goto();

    // 1.打开弹窗
    await page.getByRole('button', { name: '2', exact: true }).getByText('2').click();

    // 2.通过 Current record 创建一个详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Form (Edit)' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-').getByText('2')).toBeVisible();
  });
});

test.describe('configure actions', () => {});

test.describe('configure fields', () => {});
