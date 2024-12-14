/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { supportedVariablesInCustomRequestButtonsAcrossDifferentBlocks } from './template';

test.describe('custom request action', () => {
  test('supported variables in custom request buttons across different blocks', async ({ page, mockPage }) => {
    await mockPage(supportedVariablesInCustomRequestButtonsAcrossDifferentBlocks).goto();

    const expectSupportedVariables = async (variables: string[]) => {
      for (const variable of variables) {
        await expect(page.getByRole('menuitemcheckbox', { name: variable })).toBeVisible();
      }
    };

    // 1. 表格顶部的 “Custom request” 按钮，支持什么变量
    await page.getByLabel('action-CustomRequestAction-Custom request-customize:table:request:global-users-').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CustomRequestAction-actionSettings:customRequest-users' })
      .hover();
    await page.getByRole('menuitem', { name: 'Request settings' }).click();
    await page.getByLabel('block-item-Variable.TextArea-').getByLabel('variable-button').click();
    await expectSupportedVariables(['Current user right', 'Current time', 'API token']);
    await page.getByText('Request settings*HTTP method:').getByLabel('Close', { exact: true }).click();

    // 2. 新增表单的 “Custom request” 按钮，支持什么变量
    await page.getByLabel('action-Action-Add new-create-').click();
    await page
      .getByTestId('drawer-Action.Container-users-Add record')
      .getByLabel('action-CustomRequestAction-')
      .hover();
    await page
      .getByTestId('drawer-Action.Container-users-Add record')
      .getByLabel('designer-schema-settings-CustomRequestAction-actionSettings:customRequest-users')
      .hover();
    await page.getByRole('menuitem', { name: 'Request settings' }).click();
    await page.getByLabel('block-item-Variable.TextArea-').getByLabel('variable-button').click();
    await expectSupportedVariables(['Current form right', 'Current user right', 'Current time', 'API token']);
    await page.getByText('Request settings*HTTP method:').getByLabel('Close', { exact: true }).click();
    await page.getByLabel('drawer-Action.Container-users-Add record-mask').click();

    // 3. 表格行的 “Custom request” 按钮，支持什么变量
    await page.getByLabel('action-CustomRequestAction-Custom request-customize:table:request-users-table-').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-CustomRequestAction-actionSettings:customRequest-users' })
      .hover();
    await page.getByRole('menuitem', { name: 'Request settings' }).click();
    await page.getByLabel('block-item-Variable.TextArea-').getByLabel('variable-button').click();
    await expectSupportedVariables(['Current record right', 'Current user right', 'Current time', 'API token']);
    await page.getByText('Request settings*HTTP method:').getByLabel('Close', { exact: true }).click();

    // 4. 详情区块的 “Custom request” 按钮，支持什么变量
    await page.getByLabel('action-Action.Link-View-view-').click();
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('action-CustomRequestAction-')
      .hover();
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('designer-schema-settings-CustomRequestAction-actionSettings:customRequest-users')
      .hover();
    await page.getByRole('menuitem', { name: 'Request settings' }).click();
    await page.getByLabel('block-item-Variable.TextArea-').getByLabel('variable-button').click();
    await expectSupportedVariables(['Current record right', 'Current user right', 'Current time', 'API token']);
    await page.getByText('Request settings*HTTP method:').getByLabel('Close', { exact: true }).click();
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();

    // 5. 编辑表单的 “Custom request” 按钮，支持什么变量
    await page.getByLabel('action-Action.Link-Edit-').click();
    await page
      .getByTestId('drawer-Action.Container-users-Edit record')
      .getByLabel('action-CustomRequestAction-')
      .hover();
    await page
      .getByTestId('drawer-Action.Container-users-Edit record')
      .getByLabel('designer-schema-settings-CustomRequestAction-actionSettings:customRequest-users')
      .hover();
    await page.getByRole('menuitem', { name: 'Request settings' }).click();
    await page.getByLabel('block-item-Variable.TextArea-').getByLabel('variable-button').click();
    await expectSupportedVariables([
      'Current record right',
      'Current form right',
      'Current user right',
      'Current time',
      'API token',
    ]);
    await page.getByText('Request settings*HTTP method:').getByLabel('Close', { exact: true }).click();
    await page.getByLabel('drawer-Action.Container-users-Edit record-mask').click();
  });
});
