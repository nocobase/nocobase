import { expect, test } from '@nocobase/test/e2e';
import { generalWithSingleSelect, oneEmptyKanbanBlock } from './utils';

//在页面中可以创建看板区块
test.describe('blockInitializers should add kanban block', () => {
  test('create kanban blocks in the page', async ({ page, mockPage, mockCollections, mockRecord }) => {
    await mockCollections(generalWithSingleSelect);
    await mockRecord('general');
    await mockPage().goto();
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await expect(page.getByRole('menuitem', { name: 'form Kanban right' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'form Kanban right' }).click();
    await page.getByRole('menuitem', { name: 'General' }).click();
    await page.getByLabel('block-item-Select-Grouping field').locator('.ant-select').click();
    await page.getByRole('option', { name: 'Single select' }).click();
    await page.getByLabel('block-item-Sorting field').getByTestId('select-single').click();
    await page.getByRole('option', { name: 'singleSelect_sort (Group' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CardItem-general-kanban')).toBeVisible();
  });
});

//配置字段
test.describe('configure fields', () => {
  test('configure normal field', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyKanbanBlock).waitForInit();
    await mockRecord('general', { singleLineText: 'singleLineText', manyToOne: { id: 1 } });
    await nocoPage.goto();
    //添加普通字段
    await page.getByLabel('block-item-Kanban.Card-general-kanban').hover();
    await page.getByLabel('designer-schema-initializer-Kanban.Card-Kanban.Card.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Single line text' }).click();
    await expect(page.getByLabel('block-item-CollectionField-general-kanban-general.singleLineText')).toHaveText(
      /singleLineText/,
    );
    await expect(page.getByLabel('block-item-CollectionField-general-kanban-general.id')).toHaveText(/1/);
    //移除字段
    await page.getByLabel('block-item-Kanban.Card-general-kanban').hover();
    await page.getByLabel('designer-schema-initializer-Kanban.Card-Kanban.Card.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Single line text' }).click();
    await expect(page.getByLabel('block-item-CollectionField-general-kanban-general.singleLineText')).not.toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-kanban-general.id')).not.toBeVisible();
  });
  test('configure association field', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyKanbanBlock).waitForInit();
    await mockRecord('general', { singleLineText: 'singleLineText', manyToOne: { id: 1 } });
    await nocoPage.goto();
    await page.getByLabel('block-item-Kanban.Card-general-kanban').hover();
    await page.getByLabel('designer-schema-initializer-Kanban.Card-Kanban.Card.Designer-general').hover();
    //添加关系字段,断言请求的appends是否符合预期
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:list')),
      page.getByRole('menuitem', { name: 'Many to one', exact: true }).click(),
    ]);
    // 获取请求参数
    const requestUrl = request.url();
    // 解析查询参数
    const queryParams = new URLSearchParams(new URL(requestUrl).search);
    const appends = queryParams.get('appends[]');
    expect(appends).toContain('manyToOne');
    await expect(page.getByLabel('block-item-CollectionField-general-kanban-general.manyToOne')).toBeVisible();
    //修改标题字段
    await page.getByLabel('schema-initializer-ActionBar-kanban:configureActions-general').click();
    await page.getByLabel('block-item-CollectionField-general-kanban-general.manyToOne').hover();
    await page.getByTestId('card-1').getByLabel('designer-schema-settings-').hover();
    await page.getByText('Title field').click();
    await page.getByRole('option', { name: 'Username' }).click();
    //显示新的标题字段符合预期
    await expect(page.getByLabel('block-item-CollectionField-general-kanban-general.manyToOne')).toHaveText(/nocobase/);
  });
});

//看板的操作配置
test.describe('configure actions', () => {
  test('filter action in kanban', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneEmptyKanbanBlock).waitForInit();
    await nocoPage.goto();
    await expect(page.getByLabel('block-item-CardItem-general-kanban')).toBeVisible();
    await expect(page.getByLabel('schema-initializer-ActionBar-kanban:configureActions-general')).toBeVisible();
    await page.getByLabel('schema-initializer-ActionBar-kanban:configureActions-general').click();
    await page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch').click();
    //按钮正常显示
    await expect(page.getByLabel('action-Filter.Action-Filter-filter-general-kanban')).toBeVisible();
  });
  test('add new action in kanban', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneEmptyKanbanBlock).waitForInit();
    await nocoPage.goto();
    await page.getByLabel('schema-initializer-ActionBar-kanban:configureActions-general').click();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    //按钮正常显示
    await expect(page.getByLabel('action-Action-Add ')).toBeVisible();
    //添加数据
    await page.getByLabel('action-Action-Add new-create-general-kanban').click();
    await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-general').click();
    await page.getByRole('menuitem', { name: 'form Form' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-form:configureFields-general').click();
    await page.getByRole('menuitem', { name: 'Single Select' }).click();
    await page.getByLabel('block-item-CollectionField-').locator('.ant-select').click();
    await page.getByRole('option', { name: 'option1' }).click();
    await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel('action-Action-Submit-submit-general-form').click();
    await page.getByLabel('block-item-Kanban.Card-general-kanban').hover();
    await page.getByLabel('designer-schema-initializer-Kanban.Card-Kanban.Card.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Created at' }).getByRole('switch').click();
    await page.getByRole('menuitem', { name: 'Single Select' }).getByRole('switch').click();

    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-Kanban.Card-general-kanban')).toBeVisible();
  });
});
