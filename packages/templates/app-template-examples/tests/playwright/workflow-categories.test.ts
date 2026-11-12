import { expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { workflowNamesEnUS } from '../../shared/workflow-names.js';
import { test } from './page-freshness.fixture.js';

interface WorkflowSummary {
  id: string;
  name: string;
}

interface WorkflowCategory {
  id: string;
  title: string;
}

test.use({
  locale: 'en-US',
  viewport: { width: 1280, height: 800 },
  launchOptions: process.env.E2E_BROWSER_PATH
    ? { executablePath: process.env.E2E_BROWSER_PATH }
    : {},
});

async function readDefinitions(
  page: import('@playwright/test').Page,
  app: string,
  q?: string,
): Promise<WorkflowSummary[]> {
  const url = new URL(`${app}/api/workflows/definitions`);
  if (q) url.searchParams.set('q', q);
  const response = await page.request.get(url.toString());
  expect(response.status()).toBe(200);
  return ((await response.json()) as { data: WorkflowSummary[] }).data;
}

async function readCategories(
  page: import('@playwright/test').Page,
  app: string,
): Promise<WorkflowCategory[]> {
  const response = await page.request.get(`${app}/api/workflows/categories`);
  expect(response.status()).toBe(200);
  return ((await response.json()) as { data: WorkflowCategory[] }).data;
}

function workflowLabel(workflow: WorkflowSummary): string {
  return (
    workflowNamesEnUS[workflow.name as keyof typeof workflowNamesEnUS] ??
    workflow.name
  );
}

test('workflow categories persist through reload and search filters restore', async ({
  page,
  freshness,
}) => {
  const app = freshness.url.replace(/\/$/u, '');
  const title = `QA category ${randomUUID()}`;
  let categoryId: string | undefined;

  await page.goto(`${app}/login`);
  await page
    .getByLabel('Username or email')
    .fill(freshness.credentials.username);
  await page
    .getByLabel('Password', { exact: true })
    .fill(freshness.credentials.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));

  try {
    await page.goto(`${app}/workflows/definitions`);
    const baseline = await readDefinitions(page, app);
    const matches = await readDefinitions(page, app, 'Expense');
    const noMatches = await readDefinitions(
      page,
      app,
      `no-match-${randomUUID()}`,
    );
    expect(baseline.length).toBeGreaterThan(matches.length);
    expect(matches.length).toBeGreaterThan(0);
    expect(noMatches).toEqual([]);

    await page
      .getByRole('button', { name: 'New category', exact: true })
      .click();
    const createDialog = page.getByRole('dialog');
    const categoryName = createDialog.getByRole('textbox', {
      name: 'Category name',
    });
    await categoryName.fill(title);
    const createResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname.endsWith(
          '/api/workflows/categories',
        ) && response.request().method() === 'POST',
    );
    await createDialog
      .getByRole('button', { name: 'Save', exact: true })
      .click();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);
    categoryId = ((await createResponse.json()) as { data: WorkflowCategory })
      .data.id;
    await expect(
      page.getByRole('group', { name: title, exact: true }),
    ).toBeVisible();
    expect(
      (await readCategories(page, app)).some(
        (category) => category.id === categoryId,
      ),
    ).toBe(true);

    await page.reload();
    await expect(
      page.getByRole('group', { name: title, exact: true }),
    ).toBeVisible();
    expect(
      (await readCategories(page, app)).some(
        (category) => category.id === categoryId,
      ),
    ).toBe(true);

    const search = page.getByRole('searchbox', { name: 'Filter by name' });
    const table = page.getByRole('table');
    await search.fill('Expense');
    await search.press('Enter');
    await expect
      .poll(() => new URL(page.url()).searchParams.get('name'))
      .toBe('Expense');
    await expect(table.getByRole('link')).toHaveCount(matches.length);
    for (const workflow of matches) {
      await expect(
        table.getByRole('link', { name: workflowLabel(workflow), exact: true }),
      ).toBeVisible();
    }

    const missingTerm = `no-match-${randomUUID()}`;
    await search.fill(missingTerm);
    await search.press('Enter');
    await expect
      .poll(() => new URL(page.url()).searchParams.get('name'))
      .toBe(missingTerm);
    await expect(table.getByRole('link')).toHaveCount(0);

    await search.fill('');
    await search.press('Enter');
    await expect
      .poll(() => new URL(page.url()).searchParams.has('name'))
      .toBe(false);
    await expect(table.getByRole('link')).toHaveCount(baseline.length);
    for (const workflow of baseline) {
      await expect(
        table.getByRole('link', { name: workflowLabel(workflow), exact: true }),
      ).toBeVisible();
    }

    const category = page.getByRole('group', { name: title, exact: true });
    await category
      .getByRole('button', { name: `Category menu: ${title}`, exact: true })
      .click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm).toContainText(`Delete “${title}”?`);
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname.endsWith(
          `/api/workflows/categories/${categoryId}`,
        ) && response.request().method() === 'DELETE',
    );
    await confirm
      .getByRole('button', { name: 'Confirm deletion', exact: true })
      .click();
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(200);
    await expect(category).toHaveCount(0);
    expect(
      (await readCategories(page, app)).some((item) => item.id === categoryId),
    ).toBe(false);
  } finally {
    const categories = await readCategories(page, app);
    const leftovers = categories.filter(
      (category) => category.title === title || category.id === categoryId,
    );
    for (const category of leftovers) {
      const response = await page.request.delete(
        `${app}/api/workflows/categories/${encodeURIComponent(category.id)}`,
      );
      expect(response.status()).toBe(200);
    }
  }
});
