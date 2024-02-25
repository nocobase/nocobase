import { expect, test } from '@nocobase/test/e2e';

async function waitForModalToBeHidden(page) {
  await page.waitForFunction(() => {
    const modal = document.querySelector('.ant-modal');
    if (modal) {
      const computedStyle = window.getComputedStyle(modal);
      return computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
    }
    return true; // if the modal cannot be found, consider it hidden
  });
}

test.describe.skip('add plugin in front', () => {
  test.slow();
  test('add plugin from npm registry, then remove plugin', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('plugin-manager-button').click();
    await expect(page.getByLabel('sample-custom-collection-template')).not.toBeVisible();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByLabel('block-item-Input-Npm package name')
      .getByRole('textbox')
      .fill('@nocobase/plugin-sample-custom-collection-template');
    await page.getByLabel('Submit').click();
    // wait for the page to finish refreshing
    await page.waitForFunction(() => {
      const modal = document.querySelector('.ant-modal');
      if (modal) {
        const computedStyle = window.getComputedStyle(modal);
        return computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
      }
      return true; // if the modal cannot be found, consider it hidden
    });
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('sample-custom-collection-template');
    await expect(page.getByLabel('sample-custom-collection-template')).toBeVisible();
    // remove the added plugin
    await page.getByLabel('sample-custom-collection-template').getByText('Remove').click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await page.waitForTimeout(300);
    // wait for the page to finish refreshing
    await waitForModalToBeHidden(page);
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('sample-custom-collection-template');
    await expect(page.getByLabel('sample-custom-collection-template')).not.toBeVisible();
  });
  test.skip('add plugin from local upload', async ({ page, mockPage }) => {});
  test.skip('add plugin from file URL', async ({ page, mockPage }) => {});
});

test.describe.skip('remove plugin', () => {
  test.slow();
  test('remove plugin, then add plugin', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('plugin-manager-button').click();
    // the Hello plugin is not enabled by default
    await page.getByPlaceholder('Search plugin').fill('Hello');
    await expect(page.getByLabel('Hello')).toBeVisible();
    const isActive = await page.getByLabel('Hello').getByLabel('enable').isChecked();
    expect(isActive).toBe(false);
    // remove the Hello plugin
    await page.getByLabel('Hello').getByText('Remove').click();
    await page.getByRole('button', { name: 'Yes' }).click();
    // wait for the page to finish refreshing
    await waitForModalToBeHidden(page);
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(page.getByLabel('Hello')).not.toBeVisible();
    // add the removed plugin back
    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByLabel('block-item-Input-Npm package name')
      .getByRole('textbox')
      .fill('@nocobase/plugin-sample-hello');
    await page.getByLabel('Submit').click();
    // wait for the modal to disappear and the page to finish refreshing
    await page.waitForFunction(() => {
      const modal = document.querySelector('.ant-modal');
      if (modal) {
        const computedStyle = window.getComputedStyle(modal);
        return computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
      }
      return true; // if the modal cannot be found, consider it hidden
    });
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(page.getByLabel('Hello')).toBeVisible();
    // cannot remove enabled plugins like ACL
    await page.getByPlaceholder('Search plugin').fill('ACL');
    await expect(page.getByLabel('ACL')).toBeVisible();
    const isAclActive = await page.getByLabel('ACL').getByLabel('enable').isChecked();
    expect(isAclActive).toBe(true);
    await expect(page.getByLabel('ACL').getByText('Remove')).not.toBeVisible();
  });
});

test.describe.skip('enable & disable plugin', () => {
  test.slow();
  test('enable plugin', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('plugin-manager-button').click();
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(page.getByLabel('Hello')).toBeVisible();
    await expect(page.getByLabel('Hello').getByLabel('enable')).not.toBeChecked();
    // activate the plugin
    await page.getByLabel('Hello').getByLabel('enable').click();
    await page.waitForTimeout(1000); // Wait for 1 second
    // wait for the modal to disappear and the page to finish refreshing
    await waitForModalToBeHidden(page);
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(page.getByLabel('Hello').getByLabel('enable')).toBeChecked();
    // disable the activated plugin
    await page.getByLabel('Hello').getByLabel('enable').click();
    // wait for the modal to disappear and the page to finish refreshing
    await waitForModalToBeHidden(page);
    await page.waitForLoadState('load');
    await expect(page.getByLabel('Hello').getByLabel('enable')).not.toBeChecked();
  });
});
