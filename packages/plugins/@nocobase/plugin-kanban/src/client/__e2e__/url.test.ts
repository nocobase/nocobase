/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { kanbanURL } from './templates';

test.describe('kanban: open popup via URL', () => {
  test('basic', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(kanbanURL).waitForInit();
    await mockRecords('kanban', [{ select: 'option1' }, { select: 'option2' }, { select: 'option3' }]);
    await nocoPage.goto();

    // 1. click a card to open a popup
    await page.getByLabel('block-item-CollectionField-').filter({ hasText: 'option1' }).click();
    await expect(
      page.getByTestId('drawer-Action.Container-kanban-View record').getByLabel('block-item-CollectionField-'),
    ).toHaveText('Single select:Option1');

    // 2. then reload the page, the popup should be opened
    await page.reload();
    await expect(
      page.getByTestId('drawer-Action.Container-kanban-View record').getByLabel('block-item-CollectionField-'),
    ).toHaveText('Single select:Option1');

    // 3. click the `Edit` button to open another popup
    await page.getByLabel('action-Action-Edit-update-').click();
    await expect(
      page.getByTestId('drawer-Action.Container-kanban-Edit record').getByLabel('block-item-CollectionField-'),
    ).toHaveText('Single select:Option1');

    // 4. then reload the page, the second popup should be opened
    await page.reload();
    await expect(
      page.getByTestId('drawer-Action.Container-kanban-Edit record').getByLabel('block-item-CollectionField-'),
    ).toHaveText('Single select:Option1');

    // 5. change the `Option` then close, the previous popup's content should be updated
    await page.getByTestId('select-single').click();
    await page.getByRole('option', { name: 'Option2' }).click();
    await page.getByLabel('action-Action-Submit-submit-').click();
    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CollectionField-kanban-details-kanban.select-Single select')).toHaveText(
      'Single select:Option2',
    );

    // close the first popup
    // await page.locator('.ant-drawer-mask').click();
    // await expect(page.getByLabel('block-item-CollectionField-').filter({ hasText: 'option2' })).toHaveCount(2);
  });
});
