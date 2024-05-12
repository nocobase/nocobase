/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneTableWithFileCollection } from './templates';

test.describe('file collection block', () => {
  // TODO: 不稳定，先 skip 掉
  test.skip('What blocks are supported', async ({ page, mockPage }) => {
    await mockPage({
      collections: [
        {
          name: 'files',
          template: 'file',
        },
      ],
    }).goto();

    const supportedBlocks = async (blockNameList: string[]) => {
      for (const blockName of blockNameList) {
        await page.getByLabel('schema-initializer-Grid-page:').hover();
        await page.getByRole('menuitem', { name: ` ${blockName} right` }).hover();
        await expect(page.getByRole('menuitem', { name: 'files' })).toBeVisible();
        await page.mouse.move(500, 0);
      }
    };
    const unsupportedBlocks = async (blockNameList: string[]) => {
      for (const blockName of blockNameList) {
        await page.getByLabel('schema-initializer-Grid-page:').hover();
        if (blockName === 'Filter form') {
          await page.getByRole('menuitem', { name: ` Form right` }).nth(1).hover();
        } else {
          await page
            .getByRole('menuitem', { name: ` ${blockName} right` })
            .first()
            .hover();
        }
        await expect(page.getByRole('menuitem', { name: 'files' })).not.toBeVisible();
        await page.mouse.move(500, 0);
      }
    };

    await supportedBlocks(['Table', 'List', 'Details', 'Grid Card', 'Map', 'Gantt']);
    await unsupportedBlocks(['Form', 'Calendar', 'Kanban', 'Filter form']);
  });

  test('correctly size', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableWithFileCollection).waitForInit();
    await mockRecord('files');
    await nocoPage.goto();

    // 1. Table 中没有 size 选项，并且应该显示小尺寸的图片
    await page.getByRole('button', { name: 'Preview' }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-files').hover();
    await expect(page.getByRole('menuitem', { name: 'Custom column title' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Column width' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Size' })).not.toBeVisible();

    const imgBox = await page.getByLabel('block-item-CardItem-').locator('.ant-upload-list-item-image').boundingBox();
    expect(imgBox.width).toBeLessThanOrEqual(28);

    // 2. 弹窗中应该可以配置图片尺寸
    await page.getByLabel('action-Action.Link-View').click();
    await page.getByLabel('block-item-CollectionField-files-details-files.preview-Preview').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-files-files.preview', {
        exact: true,
      })
      .hover();
    await expect(page.getByRole('menuitem', { name: 'Size' })).toBeVisible();
  });
});
