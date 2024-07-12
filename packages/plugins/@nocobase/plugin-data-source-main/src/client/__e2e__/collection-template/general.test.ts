/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';
import { CollectionManagerPage } from '../utils';

test.describe('edit', () => {
  test('basic', async ({ page, mockCollection }) => {
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const collectionManagerPage = new CollectionManagerPage(page);
    await mockCollection({
      name: collectionName,
      title: collectionDisplayName,
    });
    await collectionManagerPage.goto();

    const newCollectionDisplayName = uid();
    const newDescription = uid();
    const newCollectionSettings = await collectionManagerPage.edit(collectionName);
    await newCollectionSettings.change('Collection display name', newCollectionDisplayName);
    await newCollectionSettings.change('Description', newDescription);
    await newCollectionSettings.submit();
    await expect(page.getByRole('cell', { name: newCollectionDisplayName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: newDescription, exact: true })).toBeVisible();
  });
});

//创建关系字段
//sourceKey, targetKey, optional field types are [string ',' bigInt ',' integer ',' uuid ',' uid '] and are non primary key field with a Unique index set
test.describe('association constraints support selecting non-primary key fields with Unique indexes', () => {
  const fields = [
    { name: 'id', interface: 'id', type: 'bigInt' },
    { name: 'string', interface: 'input', type: 'string', unique: true },
    { name: 'bigInt', type: 'bigInt', interface: 'integer', unique: true },
    { name: 'integer', type: 'integer', interface: 'input', unique: true },
    { name: 'uuid', type: 'uuid', interface: 'input', unique: true },
    { name: 'uid', type: 'uid', interface: 'input', unique: true },
    { name: 'string1', interface: 'input', type: 'string' },
    { name: 'bigInt1', type: 'bigInt', interface: 'integer' },
    { name: 'integer1', type: 'integer', interface: 'input' },
    { name: 'uuid1', type: 'uuid', interface: 'input' },
    { name: 'uid1', type: 'uid', interface: 'input' },
  ];
  test('oho sourceKey', async ({ page, mockCollection }) => {
    const collectionName = uid();
    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'One to one (has one)' }).click();
    await page.getByLabel('block-item-SourceKey-fields-').click();
    // 获取所有选项的文本内容
    const options = await page.locator('.rc-virtual-list').evaluate(() => {
      const optionElements = document.querySelectorAll('.ant-select-item-option');
      return Array.from(optionElements).map((option) => option.textContent);
    });

    // 断言下拉列表是否符合预期
    expect(options).toEqual(expect.arrayContaining(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']));
  });
  test('obo targetKey', async ({ page, mockCollection }) => {
    const collectionName = uid();
    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).click();
    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: collectionName }).locator('div').click();
    await page.getByLabel('block-item-TargetKey-fields-').click();
    // 获取所有选项的文本内容
    const options = await page
      .locator('.rc-virtual-list')
      .nth(1)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期
    expect(options).toEqual(expect.arrayContaining(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']));
  });
  test('o2m targetKey & sourceKey', async ({ page, mockCollection }) => {
    const collectionName = uid();

    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'One to many' }).click();

    await page.getByLabel('block-item-SourceKey-fields-').click();
    // sourceKey 选项符合预期
    const sourcekeyOptions = await page.locator('.rc-virtual-list').evaluate((element) => {
      const optionElements = element.querySelectorAll('.ant-select-item-option');
      return Array.from(optionElements).map((option) => option.textContent);
    });

    // 断言下拉列表是否符合预期
    expect(sourcekeyOptions).toEqual(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']);

    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: collectionName }).locator('div').click();
    await page.getByLabel('block-item-TargetKey-fields-').click();

    //targetKey 选项符合预期
    const targetKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(2)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期,o2m的targetkey 不限制unique
    expect(targetKeyOptions).toEqual(
      expect.arrayContaining([
        'ID',
        'string',
        'bigInt',
        'integer',
        'uuid',
        'uid',
        'string1',
        'bigInt1',
        'integer1',
        'uuid1',
        'uid1',
      ]),
    );
  });

  test('m2o targetKey & foreignKey', async ({ page, mockCollection }) => {
    const collectionName = uid();
    const foreignKey = `f_${uid()}`;
    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: 'Many to one' }).click();

    await page.getByLabel('block-item-ForeignKey-fields-').locator('input').click();
    // ForeignKey 选项符合预期
    const foreignKeyOptions = await page.locator('.rc-virtual-list').evaluate((element) => {
      const optionElements = element.querySelectorAll('.ant-select-item-option');
      return Array.from(optionElements).map((option) => option.textContent);
    });

    // 断言下拉列表是否符合预期
    expect(foreignKeyOptions).toEqual(
      expect.arrayContaining([
        'ID',
        'string',
        'bigInt',
        'integer',
        'uuid',
        'uid',
        'string1',
        'bigInt1',
        'integer1',
        'uuid1',
        'uid1',
      ]),
    );
    //ForeignKey 支持自定义输入和选择
    await page.getByLabel('block-item-ForeignKey-fields-').locator('input').clear();
    await page.getByLabel('block-item-ForeignKey-fields-').locator('input').fill(foreignKey);

    const inputValue = await page.getByLabel('block-item-ForeignKey-fields-').locator('input').inputValue();
    expect(inputValue).toEqual(foreignKey);
    await page.getByRole('option', { name: 'uuid1' }).locator('div').click();
    const optionValue = await page.getByLabel('block-item-ForeignKey-fields-').locator('input').inputValue();
    expect(optionValue).toEqual('uuid1');

    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: collectionName }).locator('div').click();
    await page.getByLabel('block-item-TargetKey-fields-').click();

    //targetKey 选项符合预期
    const targetKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(2)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期, 限制unique
    expect(targetKeyOptions).toEqual(expect.arrayContaining(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']));
  });

  test('m2m sourceKey & foreignKey & targetKey', async ({ page, mockCollection }) => {
    const collectionName = uid();
    const foreignKey = `f_${uid()}`;
    await mockCollection({
      name: collectionName,
      autoGenId: true,
      fields,
    });
    await page.goto('/admin/settings/data-source-manager/list');
    await page.getByRole('button', { name: 'Configure' }).first().click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill(collectionName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`).click();
    await page.getByRole('button', { name: 'plus Add field' }).click();
    await page.getByRole('menuitem', { name: /^Many to many$/ }).click();

    await page.getByLabel('block-item-SourceKey-fields-').click();
    // sourceKey 选项符合预期
    const sourcekeyOptions = await page.locator('.rc-virtual-list').evaluate((element) => {
      const optionElements = element.querySelectorAll('.ant-select-item-option');
      return Array.from(optionElements).map((option) => option.textContent);
    });
    expect(sourcekeyOptions).toEqual(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']);

    // ForeignKey1 选项符合预期
    await page.getByLabel('block-item-ThroughCollection-').click();
    await page.getByRole('option', { name: collectionName }).locator('div').click();
    await page.getByLabel('block-item-ForeignKey-fields-Foreign key 1').locator('input').click();
    const foreignKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(2)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期
    expect(foreignKeyOptions).toEqual(
      expect.arrayContaining([
        'ID',
        'string',
        'bigInt',
        'integer',
        'uuid',
        'uid',
        'string1',
        'bigInt1',
        'integer1',
        'uuid1',
        'uid1',
      ]),
    );
    //ForeignKey1 支持自定义输入和选择
    await page.getByLabel('block-item-ForeignKey-fields-Foreign key 1').locator('input').clear();
    await page.getByLabel('block-item-ForeignKey-fields-Foreign key 1').locator('input').fill(foreignKey);

    const inputValue = await page
      .getByLabel('block-item-ForeignKey-fields-Foreign key 1')
      .locator('input')
      .inputValue();
    expect(inputValue).toEqual(foreignKey);
    await page.getByRole('option', { name: 'uuid1' }).locator('div').click();
    const optionValue = await page
      .getByLabel('block-item-ForeignKey-fields-Foreign key 1')
      .locator('input')
      .inputValue();
    expect(optionValue).toEqual('uuid1');

    await page.getByLabel('block-item-Select-fields-Target collection').click();
    await page.getByRole('option', { name: collectionName }).locator('div').click();
    await page.getByLabel('block-item-TargetKey-fields-').click();

    //targetKey 选项符合预期
    const targetKeyOptions = await page
      .locator('.rc-virtual-list')
      .nth(2)
      .evaluate((element) => {
        const optionElements = element.querySelectorAll('.ant-select-item-option');
        return Array.from(optionElements).map((option) => option.textContent);
      });

    // 断言下拉列表是否符合预期, 限制unique
    expect(targetKeyOptions).toEqual(expect.arrayContaining(['ID', 'string', 'bigInt', 'integer', 'uuid', 'uid']));
  });
});
