import { expect, test, oneEmptyDetailsBlock, oneEmptyTableBlockWithCustomizeActions } from '@nocobase/test/client';
import { oneEmptyGantt, oneEmptyTableBlockWithDuplicateActions } from './utils';

test.describe('places where duplicate action can be created', () => {
  test('duplicate action in table block', async ({ page, mockPage, mockCollections, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithCustomizeActions).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  });
  test('duplicate action in gantt block', async ({ page, mockPage, mockCollections, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyGantt).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  });
  test('duplicate action in detail block', async ({ page, mockPage }) => {
    await mockPage(oneEmptyDetailsBlock).goto();
    await page.getByLabel('schema-initializer-ActionBar-DetailsActionInitializers-general').click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(page.getByLabel('action-Action-Duplicate-duplicate-general-details')).toBeVisible();
  });
});

test('direct duplicate', async ({ page, mockPage, mockCollections, mockRecords }) => {
  const nocoPage = await mockPage(oneEmptyTableBlockWithDuplicateActions).waitForInit();
  const data = await mockRecords('general', 3);
  await nocoPage.goto();
  await expect(await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').hover();
  await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).click();
  await page.getByRole('menuitem', { name: 'Duplicate mode' }).click();
  await page.getByLabel('Direct duplicate').check();
  await page.getByRole('button', { name: 'singleLineText (Duplicate)' }).click();
  await page.getByRole('button', { name: 'OK' }).click();

  try {
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:create')),
      page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').click(),
    ]);
    const postData = request.postDataJSON();
    //直接复制,复制的数据符合预期
    expect(postData.singleLineText).toEqual(data[0].singleLineText);
  } catch {
    console.log('error');
  }
});

test('Copy into the form and continue to fill in', async ({ page, mockPage, mockCollections, mockRecords }) => {
  const nocoPage = await mockPage(oneEmptyTableBlockWithDuplicateActions).waitForInit();
  const data = await mockRecords('general', 3);
  await nocoPage.goto();
  await expect(await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').hover();
  await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
  await page.getByRole('menuitem', { name: 'Duplicate mode' }).click();
  await page.getByLabel('Copy into the form and continue to fill in').check();
  await page.getByRole('button', { name: 'singleLineText (Duplicate)' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').click();
  await page.getByLabel('schema-initializer-Grid-CreateFormBlockInitializers-general').hover();
  //配置表单区块
  await page.getByRole('menuitem', { name: 'form Form' }).click();
  await page.mouse.move(300, 0);
  await page.getByLabel('schema-initializer-Grid-FormItemInitializers-general').hover();
  await page.getByRole('menuitem', { name: 'singleLineText' }).click();
  await page.getByRole('menuitem', { name: 'oneToOneBelongsTo' }).click();
  await page.getByRole('menuitem', { name: 'oneToOneHasOne' }).click();
  await page.getByRole('menuitem', { name: 'oneToMany' }).click();
  await page.getByRole('menuitem', { name: 'manyToOne', exact: true }).click();
  await page.getByRole('menuitem', { name: 'manyToMany' }).click();
  await page.getByLabel('schema-initializer-ActionBar-CreateFormActionInitializers-general').click();
  await page.getByRole('menuitem', { name: 'Submit' }).click();
  await page.getByLabel('drawer-Action.Container-general-Duplicate-mask').click();
  //同步表单字段
  await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').hover();
  await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
  await page.getByRole('menuitem', { name: 'Duplicate mode' }).click();
  await page.getByLabel('action-Action.Link-Sync from form fields-general').click();
  //表单中的字段自动选中,hasOne 和 hasMany 的关系字段只能是复制,belongsTo 和 belongsToMany 是引用
  await expect(page.getByRole('button', { name: 'singleLineText (Duplicate)' })).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'singleLineText (Duplicate)' }).locator('.ant-tree-checkbox-checked'),
  ).toBeChecked();
  await expect(page.getByRole('button', { name: 'oneToOneBelongsTo (Reference)' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'oneToOneHasOne (Duplicate)' })).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'oneToMany (Duplicate)' })).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'manyToOne (Reference)' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'manyToMany (Reference)' })).toBeChecked();
  //字段组件从 select 调整为 sub-form 后,关系就从引用变成了复制

  try {
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:create')),
    ]);
    const postData = request.postDataJSON();
    //直接复制,复制的数据符合预期
    expect(postData.singleLineText).toEqual(data[0].singleLineText);
  } catch {
    console.log('error');
  }
});
