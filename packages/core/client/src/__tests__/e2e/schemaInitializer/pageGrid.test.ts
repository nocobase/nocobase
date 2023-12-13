import { expect, test } from '@nocobase/test/client';
import { createBlock } from './utils';

test.describe('Page.Grid', () => {
  test('create block', async ({ page, mockPage }) => {
    await mockPage().goto();
    const button = page.getByLabel('schema-initializer-Grid-BlockInitializers');

    // add table block
    await button.hover();
    await createBlock(page, 'Table');
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();

    // add form block
    await button.hover();
    await createBlock(page, 'Form');
    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();

    // add detail block
    await button.hover();
    await createBlock(page, 'Details');
    await expect(page.getByLabel('block-item-CardItem-users-details')).toBeVisible();

    // add list block
    await button.hover();
    await createBlock(page, 'List');
    await expect(page.getByLabel('block-item-CardItem-users-list')).toBeVisible();

    // add grid card block
    await button.hover();
    await createBlock(page, 'Grid Card');
    await expect(page.getByLabel('block-item-BlockItem-users-grid-card')).toBeVisible();

    // add filter form block
    await button.hover();
    await createBlock(page, 'Filter form');
    await expect(page.getByLabel('block-item-CardItem-users-filter-form')).toBeVisible();

    // add collapse block
    await button.hover();
    await createBlock(page, 'Collapse');
    await expect(page.getByLabel('block-item-CardItem-users-filter-collapse')).toBeVisible();

    // add markdown block
    await button.hover();
    await createBlock(page, 'Markdown');
    await expect(page.getByLabel('block-item-Markdown.Void-markdown')).toBeVisible();
  });
});
