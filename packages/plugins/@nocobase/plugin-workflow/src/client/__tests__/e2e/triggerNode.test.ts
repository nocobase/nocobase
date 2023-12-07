import { expect, test } from '@nocobase/test/client';
import { e2e_GeneralFormsTable, appendJsonCollectionName, generateRandomLetters } from './pageobject/e2eTemplateJson';
import { CreateWorkFlow, EditWorkFlow, CollectionTriggerNode, FromEventTriggerNode } from './pageobject/workFlow';
import { WorkflowManagement, WorkflowListRecords, ScheduleTriggerNode } from './pageobject/workFlow';
import { dayjs } from '@nocobase/utils';

test.describe('form event', () => {
  test('Form Submit Button Binding Workflow Add Data Trigger', async ({ page, mockPage }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = generateRandomLetters().toString();
    //用例标题
    const caseTitle = 'Form Submit Button Binding Workflow Add Data Trigger';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的表单事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(e2e_GeneralFormsTable, appendText));
    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + appendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Form event').getByText('Form event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    // await page.getByLabel(`action-WorkflowLink-Configure-workflows-${workFlowName}`).click();
    const fromEventTriggerNode = new FromEventTriggerNode(page, workFlowName, collectionName);
    await fromEventTriggerNode.nodeConfigure.click();
    // await page.getByRole('button', { name: 'Configure' }).click();
    await fromEventTriggerNode.collectionDropDown.click();
    // await page.getByTestId('select-collection').getByLabel('Search').click();
    await page.getByText(collectionDisplayName).click();
    await fromEventTriggerNode.submitButton.click();
    // await page.getByLabel('action-Action-Submit-workflows').click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    // await page.getByLabel(`action-Action.Link-Edit-workflows-${workFlowName}`).click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    // await page.getByLabel('On', { exact: true }).check();
    await editWorkFlow.submitButton.click();
    // await page.getByLabel('action-Action-Submit-workflows').click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${collectionDisplayName}`).click();
    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${fieldDisplayName}` }).click();
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`).hover();
    await page
      .getByRole('button', { name: `designer-schema-settings-Action-Action.Designer-${collectionName}` })
      .hover();
    await page.getByLabel('Bind workflows').click();
    await page.getByRole('button', { name: 'plus Add workflow' }).click();
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByText(workFlowName).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();

    // 3、预期结果：数据添加成功，工作流成功触发
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // await expect(page.getByRole('table').locator('a').filter({ hasText: '1' })).toBeVisible();

    // 4、后置处理：删除工作流
    await workflowListRecords.deleteAction.click();
    // await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('Form Submit to Workflow Button Add Data Trigger', async ({ page, mockPage }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = generateRandomLetters().toString();
    //用例标题
    const caseTitle = 'Form Submit to Workflow Button Add Data Trigger';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的表单事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(e2e_GeneralFormsTable, appendText));
    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + appendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Form event').getByText('Form event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const fromEventTriggerNode = new FromEventTriggerNode(page, workFlowName, collectionName);
    await fromEventTriggerNode.nodeConfigure.click();
    await fromEventTriggerNode.collectionDropDown.click();
    await page.getByText(collectionDisplayName).click();
    await fromEventTriggerNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${collectionDisplayName}`).click();
    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${fieldDisplayName}` }).click();
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByRole('button', { name: 'Customize', exact: true }).hover();
    await page.getByLabel('Customize-Submit to workflow').click();
    await page.getByLabel(`action-Action-Submit to workflow-customize:triggerWorkflows-${collectionName}-form`).hover();
    await page
      .getByTestId(`drawer-Action.Container-${collectionName}-Add record`)
      .getByLabel(`designer-schema-settings-Action-Action.Designer-${collectionName}`)
      .hover();
    await page.getByLabel('Bind workflows').click();
    await page.getByRole('button', { name: 'plus Add workflow' }).click();
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByText(workFlowName).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit to workflow-customize:triggerWorkflows-${collectionName}-form`).click();

    // 3、预期结果：数据未添加到数据表，工作流成功触发
    await expect(page.getByText(fieldData)).toBeHidden();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');

    // 4、后置处理：删除工作流
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});

test.describe('collection event', () => {
  test('Add Data Trigger with No Filter', async ({ page, mockPage }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = generateRandomLetters().toString();
    //用例标题
    const caseTitle = 'Add Data Trigger with No Filter';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(e2e_GeneralFormsTable, appendText));
    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + appendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    // await page.getByLabel(`action-WorkflowLink-Configure-workflows-${workFlowName}`).click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, collectionName);
    await collectionTriggerNode.nodeConfigure.click();
    // await page.getByRole('button', { name: 'Configure' }).click();
    await collectionTriggerNode.collectionDropDown.click();
    // await page.getByTestId('select-collection').getByLabel('Search').click();
    await page.getByText(collectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    // await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();
    // await page.getByLabel('action-Action-Submit-workflows').click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    // await page.getByLabel(`action-Action.Link-Edit-workflows-${workFlowName}`).click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    // await page.getByLabel('On', { exact: true }).check();
    await editWorkFlow.submitButton.click();
    // await page.getByLabel('action-Action-Submit-workflows').click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${collectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${fieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await expect(page.getByText(fieldData)).toBeVisible();

    // 3、预期结果：数据添加成功，工作流成功触发
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // await expect(page.getByRole('table').locator('a').filter({ hasText: '1' })).toBeVisible();

    // 4、后置处理：删除工作流
    await workflowListRecords.deleteAction.click();
    // await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('Modify Data Without Filter Trigger', async ({ page, mockPage }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = generateRandomLetters().toString();
    //用例标题
    const caseTitle = 'Modify Data Without Filter Trigger';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块 ,并添加一条数据
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(e2e_GeneralFormsTable, appendText));
    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + appendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, collectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByText(collectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record updated', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${collectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();
    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${fieldDisplayName}` }).click();
    await page.mouse.move(300, 0);

    //新增一条数据用于编辑
    const fieldData = fieldDisplayName + appendText;
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await expect(page.getByText(fieldData)).toBeVisible();

    //配置编辑数据区块
    //查询录入的数据
    await page.getByLabel(`schema-initializer-ActionBar-TableActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Filter').getByRole('switch').click();
    await page.getByLabel(`action-Filter.Action-Filter-filter-${collectionName}-table`).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').getByLabel('Search').click();
    await page.getByTitle(fieldDisplayName).getByText(fieldDisplayName).click();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByRole('button', { name: 'Submit' }).click();

    //配置编辑操作
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page
      .getByLabel(`designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-${collectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Edit').getByRole('switch').click();
    //进入编辑弹窗，配置编辑表单
    await page.getByLabel(`action-Action.Link-Edit-update-${collectionName}-table-0`).click();
    await page.getByLabel(`schema-initializer-Grid-RecordBlockInitializers-${collectionName}`).hover();
    await page.getByLabel('Current record blocks-form').click();
    await page.mouse.move(0, 300);
    await page.getByLabel(`schema-initializer-ActionBar-UpdateFormActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Submit').click();
    // 2、测试步骤：进入“数据区块”-“编辑”操作，填写表单，点击“提交”按钮
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form-0`).click();

    // 3、预期结果：数据编辑成功，工作流成功触发
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // await page.waitForTimeout(5000);

    // 4、后置处理：删除工作流
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('No-filter new or modified data triggers', async ({ page, mockPage }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = generateRandomLetters().toString();
    //用例标题
    const caseTitle = 'No-filter new or modified data triggers';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块 ,并添加一条数据
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(e2e_GeneralFormsTable, appendText));
    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + appendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, collectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByText(collectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added or updated', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${collectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();
    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${fieldDisplayName}` }).click();
    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“提交”按钮
    //新增一条数据用于编辑
    const fieldData = fieldDisplayName + appendText;
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await expect(page.getByText(fieldData)).toBeVisible();

    //配置编辑数据区块
    //查询录入的数据
    await page.getByLabel(`schema-initializer-ActionBar-TableActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Filter').getByRole('switch').click();
    await page.getByLabel(`action-Filter.Action-Filter-filter-${collectionName}-table`).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').getByLabel('Search').click();
    await page.getByTitle(fieldDisplayName).getByText(fieldDisplayName).click();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByRole('button', { name: 'Submit' }).click();

    //配置编辑操作
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page
      .getByLabel(`designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-${collectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Edit').getByRole('switch').click();
    //进入编辑弹窗，配置编辑表单
    await page.getByLabel(`action-Action.Link-Edit-update-${collectionName}-table-0`).click();
    await page.getByLabel(`schema-initializer-Grid-RecordBlockInitializers-${collectionName}`).hover();
    await page.getByLabel('Current record blocks-form').click();
    await page.mouse.move(0, 300);
    await page.getByLabel(`schema-initializer-ActionBar-UpdateFormActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Submit').click();

    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form-0`).click();

    // 3、预期结果：数据编辑成功，工作流成功触发
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('2');
    // 4、后置处理：删除工作流
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('Filter radio fields equal to a specific value new data trigger', async ({ page, mockPage }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = generateRandomLetters().toString();
    //用例标题
    const caseTitle = 'Filter radio fields equal to a specific value new data trigger';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(e2e_GeneralFormsTable, appendText));
    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + appendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, collectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByText(collectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    // 设置触发器过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').getByLabel('Search').click();
    await page.getByText('公司状态(下拉单选)').click();
    await page
      .getByLabel('block-item-Filter-workflows-Only triggers when match conditions')
      .getByTestId('select-single')
      .click();
    await page.getByRole('option', { name: '存续' }).click();

    await collectionTriggerNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${collectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${fieldDisplayName}` }).click();
    await page.getByRole('button', { name: 'Display collection fields-公司状态(下拉单选)' }).click();
    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel('Search').click();
    await page.getByText('存续').click();
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await expect(page.getByText(fieldData)).toBeVisible();

    // 3、预期结果：数据添加成功，工作流成功触发
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');

    // 4、后置处理：删除工作流
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('Filter radio fields equal to a specific value Edit Data Trigger', async ({ page, mockPage }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = generateRandomLetters().toString();
    //用例标题
    const caseTitle = 'Filter radio fields equal to a specific value Edit Data Trigger';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块 ,并添加一条数据
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(e2e_GeneralFormsTable, appendText));
    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + appendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, collectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByText(collectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record updated', { exact: true }).click();
    // 设置触发器过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').getByLabel('Search').click();
    await page.getByText('公司状态(下拉单选)').click();
    await page
      .getByLabel('block-item-Filter-workflows-Only triggers when match conditions')
      .getByTestId('select-single')
      .click();
    await page.getByRole('option', { name: '存续' }).click();

    await collectionTriggerNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${collectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();
    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${fieldDisplayName}` }).click();
    await page.getByRole('button', { name: 'Display collection fields-公司状态(下拉单选)' }).click();
    await page.mouse.move(300, 0);

    //新增一条数据用于编辑
    const fieldData = fieldDisplayName + appendText;
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel('Search').click();
    await page.getByText('存续').click();
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await expect(page.getByText(fieldData)).toBeVisible();

    //配置编辑数据区块
    //查询录入的数据
    await page.getByLabel(`schema-initializer-ActionBar-TableActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Filter').getByRole('switch').click();
    await page.getByLabel(`action-Filter.Action-Filter-filter-${collectionName}-table`).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').getByLabel('Search').click();
    await page.getByTitle(fieldDisplayName).getByText(fieldDisplayName).click();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByRole('button', { name: 'Submit' }).click();

    //配置编辑操作
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page
      .getByLabel(`designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-${collectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Edit').getByRole('switch').click();
    //进入编辑弹窗，配置编辑表单
    await page.getByLabel(`action-Action.Link-Edit-update-${collectionName}-table-0`).click();
    await page.getByLabel(`schema-initializer-Grid-RecordBlockInitializers-${collectionName}`).hover();
    await page.getByLabel('Current record blocks-form').click();
    await page.mouse.move(0, 300);
    await page.getByLabel(`schema-initializer-ActionBar-UpdateFormActionInitializers-${collectionName}`).hover();
    await page.getByLabel('Enable actions-Submit').click();
    // 2、测试步骤：进入“数据区块”-“编辑”操作，填写表单，点击“提交”按钮
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form-0`).click();

    // 3、预期结果：数据编辑成功，工作流成功触发
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // await page.waitForTimeout(5000);

    // 4、后置处理：删除工作流
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});

test.describe('schedule event', () => {
  test('Triggered one minute after the current time of the customized time', async ({ page, mockPage }) => {
    test.setTimeout(120000);
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = generateRandomLetters().toString();
    //用例标题
    const caseTitle = 'Triggered one minute after the current time of the customized time';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    // const newPage = mockPage(appendJsonCollectionName(e2e_GeneralFormsTable, appendText));
    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + appendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Schedule event').getByText('Schedule event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const scheduleTriggerNode = new ScheduleTriggerNode(page, workFlowName, collectionName);
    await scheduleTriggerNode.nodeConfigure.click();
    await scheduleTriggerNode.startTimeEntryBox.click();
    await scheduleTriggerNode.startTimeEntryBox.fill(dayjs().add(60, 'second').format('YYYY-MM-DD HH:mm:ss'));
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await scheduleTriggerNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 2、测试步骤：等待60秒
    await page.waitForTimeout(60000);

    // 3、预期结果：工作流成功触发
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');

    // 4、后置处理：删除工作流
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});

test.describe('approval', () => {});
