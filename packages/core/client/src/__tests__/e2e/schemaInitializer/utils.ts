import { Page } from '@playwright/test';

export const createBlock = async (page: Page, name: string) => {
  await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();

  if (name === 'Form') {
    await page.getByText('Form', { exact: true }).first().hover();
  } else if (name === 'Filter form') {
    await page.getByText('Form', { exact: true }).nth(1).hover();
  } else {
    await page.getByText(name, { exact: true }).hover();
  }

  if (name === 'Markdown') {
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
  } else {
    await page.getByRole('menuitem', { name: 'Users' }).click();
  }

  await page.mouse.move(300, 0);
};
