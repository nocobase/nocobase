/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expectSettingsMenu, test } from '@nocobase/test/e2e';
import { oneTableWithTagField } from './templatesOfBug';

test.describe('SchemaSettings of Tag', () => {
  test('supports options', async ({ page, mockPage }) => {
    await mockPage(oneTableWithTagField).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Roles' }).hover();
        await page
          .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
          .hover();
      },
      supportedOptions: [
        'Custom column title',
        'Column width',
        'Fixed',
        'Field component',
        'Tag color field',
        'Title field',
        'Enable link',
      ],
    });
  });
});
