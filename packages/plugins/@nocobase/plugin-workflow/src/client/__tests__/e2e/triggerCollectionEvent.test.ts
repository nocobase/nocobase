import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';
import { appendJsonCollectionName, e2e_GeneralFormsTable, generateRandomLetters } from './pageobject/e2eTemplateJson';
import { CreateWorkFlow } from './pageobject/workFlow';

test.describe('trigger collection events', () => {
  test('add data to trigger collection events', async ({ page, mockPage }) => {
    //用例编号
    const caseNum = 'WF20AA';
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = caseNum.toLowerCase() + generateRandomLetters().toString();
    //用例标题
    const caseTitle = 'add data to trigger collection events';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的表单事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    const newPage = mockPage(appendJsonCollectionName(e2e_GeneralFormsTable, appendText));
    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    await page.getByLabel(`action-WorkflowLink-Configure-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByTestId('select-collection').click();
    await page.getByText(collectionDisplayName).click();
    await page.getByTestId('select-single').click();
    await page.getByText('After record added', { exact: true }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await page.getByLabel(`action-Action.Link-Edit-workflows-${workFlowName}`).click();
    await page.getByLabel('On', { exact: true }).check();
    await page.getByLabel('action-Action-Submit-workflows').click();

    //配置录入数据区块
    await newPage.goto();
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: collectionDisplayName }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-tt_amt_org${appendText}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-tt_amt_org${appendText}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-tt_amt_org${appendText}`).hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-tt_amt_org${appendText}`).hover();
    await page.getByRole('menuitem', { name: fieldDisplayName }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await expect(page.getByText(fieldData)).toBeVisible();

    // 3、预期结果：数据添加成功，工作流成功触发
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await expect(page.getByRole('table').locator('a').filter({ hasText: '1' })).toBeVisible();

    // 4、后置处理：删除工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});
