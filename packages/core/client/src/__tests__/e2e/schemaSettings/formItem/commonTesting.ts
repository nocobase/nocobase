import { Page, expect } from '@nocobase/test/client';

export async function testEditFieldTitle(page: Page) {
  await page.getByRole('menuitem', { name: 'Edit field title' }).click();
  await page.getByLabel('block-item-Input-general-').getByRole('textbox').click();
  await page.getByLabel('block-item-Input-general-').getByRole('textbox').fill('testing edit field title');
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  await expect(page.getByText('testing edit field title')).toBeVisible();
}

export async function testDisplayTitle(page: Page, title: string) {
  await expect(page.getByRole('menuitem', { name: 'Display title' }).getByRole('switch')).toBeChecked();
  await page.getByRole('menuitem', { name: 'Display title' }).click();
  await expect(page.getByRole('menuitem', { name: 'Display title' }).getByRole('switch')).not.toBeChecked();
  await expect(page.getByText(title)).not.toBeVisible();
}

export async function testEditDescription(page: Page) {
  await page.getByRole('menuitem', { name: 'Edit description' }).click();
  await page.getByLabel('block-item-Input.TextArea-').getByLabel('textarea').click();
  await page.getByLabel('block-item-Input.TextArea-').getByLabel('textarea').fill('testing edit description');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.getByText('testing edit description')).toBeVisible();
}
export async function testRequired(page: Page) {
  // 默认情况下是关闭状态
  await expect(page.getByRole('menuitem', { name: 'Required' }).getByRole('switch')).not.toBeChecked();
  await page.getByRole('menuitem', { name: 'Required' }).click();
  await expect(page.getByRole('menuitem', { name: 'Required' }).getByRole('switch')).toBeChecked();
}
