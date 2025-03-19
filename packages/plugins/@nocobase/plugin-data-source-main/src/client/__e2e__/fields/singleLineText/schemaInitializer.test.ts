/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expectSettingsMenu, test } from '@nocobase/test/e2e';

test.describe('form item & filter form', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage().goto();

    // 在页面上创建一个筛选表单，并在表单中添加一个字段
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Form right' }).nth(1).click();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.getByLabel('schema-initializer-Grid-filterForm:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CollectionField-').hover();
        await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FilterFormItem-users-').hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Edit tooltip',
        'Operator',
        'Set validation rules',
        'Set default value',
        'Delete',
      ],
    });
  });
});
