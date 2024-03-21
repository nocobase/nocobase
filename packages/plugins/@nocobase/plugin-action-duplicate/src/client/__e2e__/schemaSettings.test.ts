import { expect, test } from '@nocobase/test/e2e';
import { oneEmptyTableBlockWithDuplicateActions } from './utils';

test.describe('direct duplicate & copy into the form and continue to fill in', () => {
  test('direct duplicate', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithDuplicateActions).waitForInit();
    const data = await mockRecords('general', 3);
    await nocoPage.goto();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
    await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate mode' }).click();
    await page.getByLabel('Direct duplicate').check();
    await page.getByRole('button', { name: 'singleLineText (Duplicate)' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:create')),
      page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').click(),
    ]);
    const postData = request.postDataJSON();
    //直接复制,复制的数据符合预期
    expect(postData.singleLineText).toEqual(data[0].singleLineText);
  });

  test('copy into the form and continue to fill in', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithDuplicateActions).waitForInit();
    const data = await mockRecord('general');
    await nocoPage.goto();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
    await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate mode' }).click();
    await page.getByLabel('Copy into the form and continue to fill in').check();
    await page.getByRole('button', { name: 'singleLineText (Duplicate)' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-general').hover();
    //配置表单区块
    await page.getByRole('menuitem', { name: 'form Form' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
    await page.getByRole('menuitem', { name: 'singleLineText' }).click();
    await page.getByRole('menuitem', { name: 'oneToOneBelongsTo' }).click();
    await page.getByRole('menuitem', { name: 'oneToOneHasOne' }).click();
    await page.getByRole('menuitem', { name: 'oneToMany' }).click();
    await page.getByRole('menuitem', { name: 'manyToOne', exact: true }).click();
    await page.getByRole('menuitem', { name: 'manyToMany' }).click();
    await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-general').click();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel('drawer-Action.Container-general-Duplicate-mask').click();
    //同步表单字段
    await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate mode' }).click();
    await page.getByLabel('action-Action.Link-Sync from form fields-general').click();
    //表单中的字段自动选中,hasOne 和 hasMany 的关系字段只能是复制,belongsTo 和 belongsToMany 是引用
    //select关系字段组件只适用于引用关系
    const defaultCheckedNodesText = await page.evaluate(() => {
      const defaultCheckedNodes = Array.from(document.querySelectorAll('.ant-tree-treenode-checkbox-checked'));
      return defaultCheckedNodes.map((node) => node.textContent.trim());
    });
    const expectedArray = [
      'manyToMany (Reference)',
      'singleLineText (Duplicate)',
      'oneToOneBelongsTo (Reference)',
      'manyToOne (Reference)',
    ];
    //选中的字段符合预期
    expect(expectedArray).toEqual(expect.arrayContaining(defaultCheckedNodesText));
    await page.getByRole('button', { name: 'OK' }).click();

    await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').click();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.singleLineText').getByRole('textbox'),
    ).toHaveValue(data['singleLineText']);
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:create')),
      page.getByLabel('action-Action-Submit-submit-general-form').click(),
    ]);
    const postData = request.postDataJSON();
    const manyToMany = postData.manyToMany.map((v) => v.id);
    const expectManyToMany = data.manyToMany.map((v) => v.id);
    //提交的数据符合预期
    expect(postData.singleLineText).toEqual(data.singleLineText);
    expect(postData.manyToOne['id']).toBe(data.manyToOne['id']);
    expect(postData.oneToOneBelongsTo['id']).toBe(data.oneToOneBelongsTo['id']);
    expect(manyToMany).toEqual(expect.arrayContaining(expectManyToMany));
  });
});
