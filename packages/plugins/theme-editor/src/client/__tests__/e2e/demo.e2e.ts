import { describe, test } from 'e2eUtils';

describe('demo', () => {
  test('test', async ({ page }) => {
    await page.goto('/');
  });
});
