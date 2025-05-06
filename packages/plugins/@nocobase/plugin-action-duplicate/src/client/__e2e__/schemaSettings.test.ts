/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { T4546, oneEmptyTableBlockWithDuplicateActions } from './templates';

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
    await page.getByRole('menuitem', { name: 'form Form' }).hover();
    await page.getByRole('menuitem', { name: 'Current collection' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
    await page.getByRole('menuitem', { name: 'singleLineText' }).click();
    await page.getByRole('menuitem', { name: 'oneToOneBelongsTo' }).first().click();
    await page.getByRole('menuitem', { name: 'oneToOneHasOne' }).first().click();
    await page.getByRole('menuitem', { name: 'oneToMany' }).click();
    await page.getByRole('menuitem', { name: 'manyToOne', exact: true }).click();
    await page.getByRole('menuitem', { name: 'manyToMany' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-general').click();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel('drawer-Action.Container-general-Duplicate-mask').click();

    // 再次打开弹窗，刚配置的字段应该还在
    await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').click();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText'),
    ).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo-oneToOneBelongsTo'),
    ).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.oneToOneHasOne-oneToOneHasOne'),
    ).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany'),
    ).toBeVisible();
    await expect(page.getByLabel('action-Action-Submit-submit-general-form')).toBeVisible();
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
    await page.getByRole('button', { name: 'OK', exact: true }).click();

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

  test('association block in popup', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T4546).waitForInit();
    const general1 = await mockRecord('general1');
    await nocoPage.goto();

    // 1. 先打开弹窗，然后点击弹窗中复制按钮，应该能成功复制，并显示在弹窗中
    await page.getByLabel('action-Action.Link-View record-view-general1-table-0').click();
    await page.getByLabel('action-Action.Link-Duplicate-duplicate-general2-table-0').click();
    await expect(
      page.getByLabel('block-item-CardItem-general2-').getByText(general1.oneToMany[0].singleLineText2),
    ).toHaveCount(2);

    // 2. 设置复制方式为编辑模式，点击复制按钮，应该能成功复制，并显示在弹窗中
    await page.getByLabel('action-Action.Link-Duplicate-duplicate-general2-table-0').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-Action.Link-actionSettings:duplicate-general2' })
      .hover();
    await page.getByRole('menuitem', { name: 'Duplicate mode' }).click();
    await page.getByLabel('Copy into the form and').check();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 设置表单
    await page.getByLabel('action-Action.Link-Duplicate-duplicate-general2-table-0').click();
    await page
      .getByTestId('drawer-Action.Container-general2-Duplicate')
      .getByLabel('schema-initializer-Grid-popup')
      .hover();
    await page.getByRole('menuitem', { name: 'Form right' }).hover();
    await page.getByRole('menuitem', { name: 'Current collection' }).click();
    await page
      .getByTestId('drawer-Action.Container-general2-Duplicate')
      .getByLabel('schema-initializer-ActionBar-')
      .hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel('action-Action-Submit-submit-').click();

    await expect(
      page.getByLabel('block-item-CardItem-general2-').getByText(general1.oneToMany[0].singleLineText2),
    ).toHaveCount(3);
  });
});
