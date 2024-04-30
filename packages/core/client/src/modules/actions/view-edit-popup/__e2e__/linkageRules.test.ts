/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { T3910 } from './templatesOfBug';

test.describe('LinkageRules of view-edit-popup', () => {
  test('should be disabled', async ({ page, mockPage }) => {
    await mockPage(T3910).goto();

    await expect(page.getByLabel('action-Action-Edit-update-')).toBeDisabled();
  });
});
