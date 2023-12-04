import { expect } from '@nocobase/test/client';

export async function expectOptions({ showMenu, supportedOptions, page }) {
  await showMenu();
  for (const option of supportedOptions) {
    await expect(page.getByRole('menuitem', { name: option })).toBeVisible();
  }
}
