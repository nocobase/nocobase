/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expectSettingsMenu, test } from '@nocobase/test/e2e';
import { oneFormWithSubTableSelectField } from './templatesOfBug';

//子表格中的对多关系字段
test('supports options', async ({ page, mockPage }) => {
  await mockPage(oneFormWithSubTableSelectField).goto();
  // 在子表格中
  await expectSettingsMenu({
    page,
    showMenu: async () => {
      await page.getByRole('button', { name: 'o2m(test3)' }).click();
      await page.getByLabel('designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-test2').click();
    },
    supportedOptions: [
      'Custom column title',
      'Column width',
      'Set default value',
      'Required',
      'Fixed',
      'Field component',
      'Set the data scope',
      'Set default sorting rules',
      'Allow multiple',
      'Title field',
    ],
  });

  // 在表单中
  await expectSettingsMenu({
    page,
    showMenu: async () => {
      await page.getByLabel('block-item-CollectionField-').hover();
      await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-test1-test1.o2m').hover();
      await page.getByText('Field componentSub-table').click();
      await page.getByRole('option', { name: 'Select' }).click();
    },
    supportedOptions: [
      'Edit field title',
      'Display title',
      'Edit description',
      'Edit tooltip',
      'Required',
      'Pattern',
      'Field component',
      'Set the data scope',
      'Set default sorting rules',
      'Quick create',
      'Allow multiple',
      'Title field',
    ],
  });
});
