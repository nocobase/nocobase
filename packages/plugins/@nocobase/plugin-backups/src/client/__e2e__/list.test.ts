import { expect, test } from '@nocobase/test/e2e';

test.describe('backups listing view', () => {
  test.beforeAll(async ({ page }) => {
    await page.goto('/admin/settings/backups/list');
  });

  test('should be able to create new backup', async ({ page }) => {
    await page.getByRole('link', { name: 'New backup' }).click();
    // success to submit operation
    await expect(page.getByText('New backup operation started')).toBeVisible();
    // backing up
    await expect(page.getByText(/.*Backing\sup.*/)).toBeVisible();
    // new backup has been created
    await expect(page.getByText(/New\sbackups\[.*\.nbdata\]\screated\ssuccessfully/)).toBeVisible();
  });

  test('should be able to delete backup', async ({ page }) => {
    // create a new backup
    await page.getByRole('button', { name: 'New backup' }).click();
    // success to submit operation
    await expect(page.getByText('New backup operation started')).toBeVisible();
    // backing up
    await expect(page.getByText(/.*Backing\sup.*/)).toBeVisible();
    // new backup has been created
    await expect(page.getByText(/New\sbackups\[.*\.nbdata\]\screated\ssuccessfully/)).toBeVisible();
    // refresh the table
    await page.getByRole('button', { name: 'Refresh' }).click();
    // delete the backup
    await page.getByRole('link', { name: 'Delete' }).click();
    // confirm the deletion
    await page.getByRole('button', { name: 'OK' }).click();
    // success to delete the backup
    await expect(page.getByText('The deletion was successful.')).toBeVisible();
  });

  test('should be able to restore backup', async ({ page }) => {
    // create a new backup
    await page.getByRole('button', { name: 'New backup' }).click();
    // success to submit operation
    await expect(page.getByText('New backup operation started')).toBeVisible();
    // backing up
    await expect(page.getByText(/.*Backing\sup.*/)).toBeVisible();
    // new backup has been created
    await expect(page.getByText(/New\sbackups\[.*\.nbdata\]\screated\ssuccessfully/)).toBeVisible();
    // refresh the table
    await page.getByRole('button', { name: 'Refresh' }).click();
    // restore the backup
    await page.getByRole('link', { name: 'Restore' }).click();
    // confirm the restoration
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('APP Restoring')).toBeVisible();
    await expect(page.getByText('APP upgrading')).toBeVisible();
  });
});
