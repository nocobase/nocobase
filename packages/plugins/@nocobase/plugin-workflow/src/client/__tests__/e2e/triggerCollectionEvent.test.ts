import { expect, test } from '@nocobase/test/client';
import { CreateWorkFlow, EditWorkFlow } from './pageobject/workFlow';
import { dayjs } from '@nocobase/utils';
import { e2e_GeneralFormsTable, appendJsonCollectionName, generateRandomLetters } from './pageobject/e2eTemplateJson';

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
    await page.goto('/admin/settings/workflow/workflows');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('create-action').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await page.getByTestId('submit-action').click();
    await expect(page.getByText(workFlowName)).toBeAttached();

    //配置工作流触发器
    await page
      .getByRole('row', { name: '1 ' + workFlowName + ' Collection event Off 0 Configure Edit Duplicate Delete' })
      .getByRole('link')
      .click();
    await page.getByRole('button', { name: 'Configure' }).click();
    await page.getByTestId('antd-select').getByLabel('Search').click();
    await page.getByText('自动>组织[普通表]').click();
    await page.getByTestId('mode-item').getByLabel('Search').click();
    await page.getByText('After record added', { exact: true }).click();
    await page.getByTestId('submit-action').click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await page
      .getByRole('row', { name: '1 ' + workFlowName + ' Collection event Off 0 Configure Edit Duplicate Delete' })
      .getByTestId('update-action')
      .click();
    await page.getByTestId('enabled-item').getByLabel('On').check();
    await page.getByTestId('submit-action').click();

    //配置录入数据区块
    await newPage.goto();
    await page.getByRole('button', { name: 'plus Add block' }).hover();
    await page.getByRole('menuitem', { name: 'table Table right' }).hover();
    await page.getByRole('menuitem', { name: collectionDisplayName }).click();
    await page.getByRole('button', { name: 'setting Configure columns' }).click();
    await page.getByRole('menuitem', { name: fieldDisplayName }).getByRole('switch').click();
    await page.getByRole('button', { name: 'setting Configure actions' }).hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();
    await page.getByRole('button', { name: 'setting Configure columns' }).hover();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('Add new').getByRole('button', { name: 'plus Add block' }).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();
    await page.getByRole('button', { name: 'plus Add tab' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.getByLabel('Add new').getByRole('button', { name: 'setting Configure actions' }).click();
    await page.getByRole('group').getByText('Submit').click();
    await page.getByRole('button', { name: 'setting Configure fields' }).click();
    await page.getByRole('menuitem', { name: fieldDisplayName }).getByRole('switch').click();
    await page.getByRole('button', { name: 'plus Add tab' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    await page
      .getByTestId(collectionName + '.' + fieldName + '-field')
      .getByRole('textbox')
      .click();
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByTestId(collectionName + '.' + fieldName + '-field')
      .getByRole('textbox')
      .fill(fieldData);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText(fieldData)).toBeAttached();

    // 3、预期结果：数据添加成功，工作流成功触发
    await expect(page.getByText(fieldData)).toBeAttached();
    await page.goto('/admin/settings/workflow/workflows');
    await expect(page.getByRole('table').locator('a').filter({ hasText: '1' })).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByTestId('filter-action').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('cell', { name: 'Configure Edit Duplicate Delete' }).getByTestId('delete-action').click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});
