import { expect, test } from '@nocobase/test/e2e';
import { T3910 } from './templatesOfBug';

test.describe('LinkageRules of view-edit-popup', () => {
  test('should be disabled', async ({ page, mockPage }) => {
    await mockPage(T3910).goto();

    await expect(page.getByLabel('action-Action-Edit-update-')).toBeDisabled();
  });
});
