import { expect, test } from '@nocobase/test/client';

test.describe('create data block', () => {
  test('table', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByRole('button', { name: 'plus Add block' }).hover();
    await page.getByRole('menuitem', { name: 'table Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    await expect(page.getByRole('columnheader', { name: 'setting Configure columns' })).toBeVisible();
  });

  test('form', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByRole('button', { name: 'plus Add block' }).hover();
    await page.getByRole('menuitem', { name: 'form Form right' }).first().hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    await expect(page.getByRole('button', { name: 'setting Configure fields' })).toBeVisible();
  });

  test('details', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByRole('button', { name: 'plus Add block' }).hover();
    await page.getByRole('menuitem', { name: 'table Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    await expect(page.getByRole('button', { name: 'setting Configure fields' })).toBeVisible();
  });

  test('list', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByRole('button', { name: 'plus Add block' }).hover();
    await page.getByRole('menuitem', { name: 'ordered-list List right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    await expect(page.getByRole('button', { name: 'setting Configure fields' }).first()).toBeVisible();
  });

  test('grid card', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByRole('button', { name: 'plus Add block' }).hover();
    await page.getByRole('menuitem', { name: 'ordered-list Grid Card right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    await expect(page.getByRole('button', { name: 'setting Configure fields' }).first()).toBeVisible();
  });
});
