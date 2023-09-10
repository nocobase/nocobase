import { test } from '@playwright/test';
import { registerHooks } from 'e2eUtils';

registerHooks();

test('test', async ({ page }) => {
  await page.goto('/');
});
