import { expect } from '@nocobase/test/client';

export async function expectOptions({ showMenu, enableOptions, page }) {
  await showMenu();
  for (const option of enableOptions) {
    await expect(page.getByRole('menuitem', { name: option })).toBeVisible();
  }
}
