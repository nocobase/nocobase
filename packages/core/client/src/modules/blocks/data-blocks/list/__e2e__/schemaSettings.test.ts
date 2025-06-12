/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expectSettingsMenu, oneEmptyListBlock, test } from '@nocobase/test/e2e';

test.describe('list block schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyListBlock).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-general-list').hover();
        await page.getByLabel('designer-schema-settings-CardItem-List.Designer-general').hover();
      },
      supportedOptions: [
        'Edit block title & description',
        'Set the data scope',
        'Set default sorting rules',
        'Records per page',
        // 'Save as template',
        'Delete',
      ],
    });
  });
});

test.describe('actions schema settings', () => {});
