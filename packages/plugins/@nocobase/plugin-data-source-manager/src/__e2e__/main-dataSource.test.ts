import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';

test.describe('Initializing main data source by default', () => {
  test('basic', async ({ page }) => {
    await page.goto('/');
    // await page.goto('admin/settings/data-source-manager');
  });
});
