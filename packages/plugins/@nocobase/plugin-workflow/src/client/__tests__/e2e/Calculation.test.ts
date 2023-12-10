import { CreateWorkFlow, EditWorkFlow, WorkflowManagement, WorkflowListRecords } from '@nocobase/plugin-workflow-test/client';
import { e2e_GeneralFormsTable, appendJsonCollectionName } from '@nocobase/plugin-workflow-test/client';
import { CollectionTriggerNode,AggregateNode,ClculationNode } from '@nocobase/plugin-workflow-test/client';
import { QueryRecordNode, CreateRecordNode,  ManualNode } from '@nocobase/plugin-workflow-test/client';
import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';

test('Collection event add data trigger, static type, Math engine, get trigger node single line text variable', async ({
    page,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, static type, Math engine, get trigger node single line text variable';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
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
    await page.getByRole('option', { name: collectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置计算节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await page.getByLabel('variable-button').click();
    await page.getByText('Trigger variables').click();
    await page.getByText('Trigger data').click();
    await page.getByText('公司名称(单行文本)').click();
    await expect(page.getByLabel('textbox')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${collectionDisplayName}`}).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: `${fieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到触发节点的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText(fieldData);

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, static type, Formula engine, get trigger node single line text variable', async ({
    page,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, static type, Formula engine, get trigger node single line text variable';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
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
    await page.getByRole('option', { name: collectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置计算节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await calculationNode.formulaCalculationEngine.click();
    await page.getByLabel('variable-button').click();
    await page.getByText('Trigger variables').click();
    await page.getByText('Trigger data').click();
    await page.getByText('公司名称(单行文本)').click();
    await expect(page.getByLabel('textbox')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${collectionDisplayName}`}).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: `${fieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到触发节点的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText(fieldData);

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data triggers, static type, Math engine, get predecessor static type, Math engine arithmetic node data', async ({
    page,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data triggers, static type, Math engine, get predecessor static type, Math engine arithmetic node data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
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
    await page.getByRole('option', { name: collectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置前置计算节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const preCalculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Calculation-Calculation', { exact: true })
        .getByRole('textbox')
        .fill(preCalculationNodeName);
    const preCalculationNode = new ClculationNode(page, preCalculationNodeName);
    await preCalculationNode.nodeConfigure.click();
    await page.getByLabel('variable-button').click();
    await page.getByText('Trigger variables').click();
    await page.getByText('Trigger data').click();
    await page.getByText('公司名称(单行文本)').click();
    await expect(page.getByLabel('textbox')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
    await preCalculationNode.submitButton.click();

    //配置计算节点
    await preCalculationNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await page.getByLabel('variable-button').click();
    await page.getByText('Node result').click();
    await page.getByRole('menuitemcheckbox', { name: preCalculationNodeName }).click();
    await expect(page.getByLabel('textbox')).toHaveText(`Node result / ${preCalculationNodeName}`);
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${collectionDisplayName}`}).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: `${fieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到前置计算节点的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText(fieldData);

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data triggers, static type, Formula engine, get predecessor static type, Formula engine arithmetic node data', async ({
    page,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data triggers, static type, Formula engine, get predecessor static type, Formula engine arithmetic node data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
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
    await page.getByRole('option', { name: collectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置前置计算节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const preCalculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Calculation-Calculation', { exact: true })
        .getByRole('textbox')
        .fill(preCalculationNodeName);
    const preCalculationNode = new ClculationNode(page, preCalculationNodeName);
    await preCalculationNode.nodeConfigure.click();
    await preCalculationNode.formulaCalculationEngine.click();
    await page.getByLabel('variable-button').click();
    await page.getByText('Trigger variables').click();
    await page.getByText('Trigger data').click();
    await page.getByText('公司名称(单行文本)').click();
    await expect(page.getByLabel('textbox')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
    await preCalculationNode.submitButton.click();

    //配置计算节点
    await preCalculationNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await calculationNode.formulaCalculationEngine.click();
    await page.getByLabel('variable-button').click();
    await page.getByText('Node result').click();
    await page.getByRole('menuitemcheckbox', { name: preCalculationNodeName }).click();
    await expect(page.getByLabel('textbox')).toHaveText(`Node result / ${preCalculationNodeName}`);
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${collectionDisplayName}`}).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: `${fieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到前置计算节点的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText(fieldData);

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection events add data triggers, static types, Math engine, get single line of text data for front query data nodes', async ({
    page,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection events add data triggers, static types, Math engine, get single line of text data for front query data nodes';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
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
    await page.getByRole('option', { name: collectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置前置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(preQueryRecordNodeName);
    const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
    await preQueryRecordNode.nodeConfigure.click();
    await preQueryRecordNode.collectionDropDown.click();
    await page.getByRole('option', { name: collectionDisplayName }).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByText('ID', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await expect(page.getByLabel('block-item-Filter-workflows-Filter').getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / ID');
    await preQueryRecordNode.submitButton.click();

    //配置计算节点
    await preQueryRecordNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
    await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
    await expect(page.getByLabel('textbox')).toHaveText(`Node result / ${preQueryRecordNodeName} / 公司名称(单行文本)`);
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${collectionDisplayName}`}).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: `${fieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到查询节点的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText(fieldData);

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection events add data triggers, static types, Formula engine, get single line of text data for front query data nodes', async ({
    page,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const appendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection events add data triggers, static types, Formula engine, get single line of text data for front query data nodes';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';

    const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
    const collectionName = e2eJsonCollectionName + appendText;
    const fieldName = 'orgname';
    const fieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
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
    await page.getByRole('option', { name: collectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置前置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const preQueryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(preQueryRecordNodeName);
    const preQueryRecordNode = new QueryRecordNode(page, preQueryRecordNodeName);
    await preQueryRecordNode.nodeConfigure.click();
    await preQueryRecordNode.collectionDropDown.click();
    await page.getByRole('option', { name: collectionDisplayName }).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByText('ID', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await expect(page.getByLabel('block-item-Filter-workflows-Filter').getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / ID');
    await preQueryRecordNode.submitButton.click();

    //配置计算节点
    await preQueryRecordNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await calculationNode.formulaCalculationEngine.click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
    await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeName }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
    await expect(page.getByLabel('textbox')).toHaveText(`Node result / ${preQueryRecordNodeName} / 公司名称(单行文本)`);
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${collectionDisplayName}`}).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(fieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${collectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${collectionName}`).hover();
    await page.getByRole('menuitem', { name: `${fieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = fieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${collectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到查询节点的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText(fieldData);

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, static type, Math engine, get front added data node single line text data', async ({
    page,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createRecordNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, static type, Math engine, get front added data node single line text data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    const triggerNodeCollection = mockPage(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText),
    );
    await page.waitForTimeout(2000);
    // 创建新增数据节点数据表
    const createRecordNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createRecordNodeAppendText;
    const createRecordNodeCollectionName = e2eJsonCollectionName + createRecordNodeAppendText;
    const createRecordNodeFieldName = 'orgname';
    const createRecordNodeFieldDisplayName = '公司名称(单行文本)';
    const createRecordNodCollection = mockPage(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createRecordNodeAppendText),
    );

    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + triggerNodeAppendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置前置添加数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const preCreateRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(preCreateRecordNodeName);
    const preCreateRecordNode = new CreateRecordNode(page, preCreateRecordNodeName);
    await preCreateRecordNode.nodeConfigure.click();
    await preCreateRecordNode.collectionDropDown.click();
    await page.getByText(createRecordNodeCollectionDisplayName).click();
    await preCreateRecordNode.addFieldsButton.click();
    await page.getByText(createRecordNodeFieldDisplayName).click();
    await page.getByLabel('variable-button').click();
    await page.getByText('Trigger variables').click();
    await page.getByText('Trigger data').click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
    await expect(page.getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
    await preCreateRecordNode.submitButton.click();

    //配置计算节点
    await preCreateRecordNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
    await page.getByRole('menuitemcheckbox', { name: preCreateRecordNodeName }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
    await expect(page.getByLabel('textbox')).toHaveText(
        `Node result / ${preCreateRecordNodeName} / 公司名称(单行文本)`,
    );
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await triggerNodeCollection.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到查询节点的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText(fieldData);

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, static type, Formula engine, get front added data node single line text data', async ({
    page,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createRecordNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, static type, Formula engine, get front added data node single line text data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    const triggerNodeCollection = mockPage(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText),
    );
    await page.waitForTimeout(2000);
    // 创建新增数据节点数据表
    const createRecordNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createRecordNodeAppendText;
    const createRecordNodeCollectionName = e2eJsonCollectionName + createRecordNodeAppendText;
    const createRecordNodeFieldName = 'orgname';
    const createRecordNodeFieldDisplayName = '公司名称(单行文本)';
    const createRecordNodCollection = mockPage(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createRecordNodeAppendText),
    );

    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + triggerNodeAppendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置前置添加数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const preCreateRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(preCreateRecordNodeName);
    const preCreateRecordNode = new CreateRecordNode(page, preCreateRecordNodeName);
    await preCreateRecordNode.nodeConfigure.click();
    await preCreateRecordNode.collectionDropDown.click();
    await page.getByText(createRecordNodeCollectionDisplayName).click();
    await preCreateRecordNode.addFieldsButton.click();
    await page.getByText(createRecordNodeFieldDisplayName).click();
    await page.getByLabel('variable-button').click();
    await page.getByText('Trigger variables').click();
    await page.getByText('Trigger data').click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
    await expect(page.getByLabel('variable-tag')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
    await preCreateRecordNode.submitButton.click();

    //配置计算节点
    await preCreateRecordNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await calculationNode.formulaCalculationEngine.click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
    await page.getByRole('menuitemcheckbox', { name: preCreateRecordNodeName }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
    await expect(page.getByLabel('textbox')).toHaveText(
        `Node result / ${preCreateRecordNodeName} / 公司名称(单行文本)`,
    );
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await triggerNodeCollection.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到查询节点的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText(fieldData);

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event adds data triggers, static types, Math engine, fetches data from front-end aggregation query nodes', async ({
    page,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event adds data triggers, static types, Math engine, fetches data from front-end aggregation query nodes';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    const triggerNodeCollection = mockPage(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText),
    );

    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + triggerNodeAppendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置前置聚合查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const preAggregateNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(preAggregateNodeName);
    const preAggregateNode = new AggregateNode(page, preAggregateNodeName);
    await preAggregateNode.nodeConfigure.click();
    await preAggregateNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await preAggregateNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: triggerNodeFieldDisplayName, exact: true }).click();
    await preAggregateNode.submitButton.click();

    //配置计算节点
    await preAggregateNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
    await page.getByRole('menuitemcheckbox', { name: preAggregateNodeName }).click();
    await expect(page.getByLabel('textbox')).toHaveText(`Node result / ${preAggregateNodeName}`);
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await triggerNodeCollection.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到查询节点的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event adds data triggers, static types, Formula engine, fetches data from front-end aggregation query nodes', async ({
    page,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event adds data triggers, static types, Formula engine, fetches data from front-end aggregation query nodes';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    const triggerNodeCollection = mockPage(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText),
    );

    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + triggerNodeAppendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置前置聚合查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const preAggregateNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(preAggregateNodeName);
    const preAggregateNode = new AggregateNode(page, preAggregateNodeName);
    await preAggregateNode.nodeConfigure.click();
    await preAggregateNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await preAggregateNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: triggerNodeFieldDisplayName, exact: true }).click();
    await preAggregateNode.submitButton.click();

    //配置计算节点
    await preAggregateNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await calculationNode.formulaCalculationEngine.click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
    await page.getByRole('menuitemcheckbox', { name: preAggregateNodeName }).click();
    await expect(page.getByLabel('textbox')).toHaveText(`Node result / ${preAggregateNodeName}`);
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    await triggerNodeCollection.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到查询节点的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('1');

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test.skip('Collection event add data trigger, static type, Math engine, get front manual node add form single line text data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createRecordFormAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, static type, Math engine, get front manual node add form single line text data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
    );
    // await page.waitForTimeout(2000);
    // 创建人工节点新增数据表
    const createRecordFormCollectionDisplayName = e2eJsonCollectionDisplayName + createRecordFormAppendText;
    const createRecordFormCollectionName = e2eJsonCollectionName + createRecordFormAppendText;
    const createRecordFormFieldName = 'orgname';
    const createRecordFormFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createRecordFormAppendText)
            .collections,
    );

    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + triggerNodeAppendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置前置人工节点新增数据表单
    //配置表单
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const preManualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(preManualNodeName);
    const preManualNode = new ManualNode(page, preManualNodeName);
    await preManualNode.nodeConfigure.click();
    await preManualNode.assigneesDropDown.click();
    await page.getByTitle('Super Admin').getByText('Super Admin').click();
    await preManualNode.configureUserInterfaceButton.click();
    await preManualNode.addBlockButton.hover();
    await preManualNode.createRecordFormMenu.hover();
    await page.getByRole('menuitem', { name: createRecordFormCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    //配置表单标题
    await page.getByLabel(`block-item-CardItem-${createRecordFormCollectionName}`).hover();
    await page
        .getByLabel(`designer-schema-settings-CardItem-CreateFormDesigner-${createRecordFormCollectionName}`)
        .hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const createRecordFormBlockTitle =
        createRecordFormCollectionDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(createRecordFormBlockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    //配置录入数据字段
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${createRecordFormCollectionName}`).hover();
    await page.getByRole('menuitem', { name: '公司名称(单行文本)' }).getByRole('switch').click();
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializers-workflows').hover();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await preManualNode.submitButton.click();

    //配置计算节点
    await preManualNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
    await page.getByRole('menuitemcheckbox', { name: preManualNodeName }).click();
    await page.getByRole('menuitemcheckbox', { name: createRecordFormBlockTitle }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
    await expect(page.getByLabel('textbox')).toHaveText(
        `Node result / ${preManualNodeName} / ${createRecordFormBlockTitle} / 公司名称(单行文本)`,
    );
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    const addDataPage = mockPage();
    await addDataPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);
    // 配置工作流待办区块
    const workflowTodoPage = mockPage();
    await workflowTodoPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'Workflow todos' }).click()
    await page.waitForLoadState('networkidle');
    // 2、测试步骤：添加数据触发工作流，进入待办区块页面办理任务
    await addDataPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到人工节点新增表单的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await workflowTodoPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeVisible();
    await expect(page.getByText(preManualNodeName)).toBeVisible();
    await page.getByLabel('action-Action.Link-View-users_jobs-workflow-todo-0').click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel('action-Action-Continue the').click();
    await page.waitForLoadState('networkidle');
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('4');

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test.skip('Collection event add data trigger, static type, Formula engine, get front manual node add form single line text data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createRecordFormAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, static type, Formula engine, get front manual node add form single line text data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
    );
    // await page.waitForTimeout(2000);
    // 创建人工节点新增数据表
    const createRecordFormCollectionDisplayName = e2eJsonCollectionDisplayName + createRecordFormAppendText;
    const createRecordFormCollectionName = e2eJsonCollectionName + createRecordFormAppendText;
    const createRecordFormFieldName = 'orgname';
    const createRecordFormFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createRecordFormAppendText)
            .collections,
    );

    //配置工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowManagement = new WorkflowManagement(page);
    await workflowManagement.addNewButton.click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + triggerNodeAppendText;
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByTitle('Collection event').getByText('Collection event').click();
    await createWorkFlow.submitButton.click();
    await expect(page.getByText(workFlowName)).toBeVisible();

    //配置工作流触发器
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.configureAction.click();
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置前置人工节点新增数据表单
    //配置表单
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const preManualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(preManualNodeName);
    const preManualNode = new ManualNode(page, preManualNodeName);
    await preManualNode.nodeConfigure.click();
    await preManualNode.assigneesDropDown.click();
    await page.getByTitle('Super Admin').getByText('Super Admin').click();
    await preManualNode.configureUserInterfaceButton.click();
    await preManualNode.addBlockButton.hover();
    await preManualNode.createRecordFormMenu.hover();
    await page
        .getByLabel(
            `Form-createRecordForm-createRecordForm-child-createRecordForm-child-${createRecordFormCollectionName}`,
            { exact: true },
        )
        .click();
    await page.mouse.move(300, 0, { steps: 100 });
    //配置表单标题
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${createRecordFormCollectionName}`).hover();
    await page
        .getByLabel(`designer-schema-settings-CardItem-CreateFormDesigner-${createRecordFormCollectionName}`)
        .hover();
    await page.getByLabel('Edit block title').click();
    const createRecordFormBlockTitle =
        createRecordFormCollectionDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-item-Input-').getByRole('textbox').fill(createRecordFormBlockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    //配置录入数据字段
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${createRecordFormCollectionName}`).hover();
    await page.getByRole('menuitem', { name: '公司名称(单行文本)' }).getByRole('switch').click();
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializers-workflows').hover();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await preManualNode.submitButton.click();

    //配置计算节点
    await preManualNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
    const calculationNode = new ClculationNode(page, calculationNodeName);
    await calculationNode.nodeConfigure.click();
    await calculationNode.formulaCalculationEngine.click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
    await page.getByRole('menuitemcheckbox', { name: preManualNodeName }).click();
    await page.getByRole('menuitemcheckbox', { name: createRecordFormBlockTitle }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
    await expect(page.getByLabel('textbox')).toHaveText(
        `Node result / ${preManualNodeName} / ${createRecordFormBlockTitle} / 公司名称(单行文本)`,
    );
    await calculationNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置录入数据区块
    const addDataPage = mockPage();
    await addDataPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
        .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
        .hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);
    // 配置工作流待办区块
    const workflowTodoPage = mockPage();
    await workflowTodoPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('media-workflowTodos').click();
    await page.waitForLoadState('networkidle');
    // 2、测试步骤：添加数据触发工作流，进入待办区块页面办理任务
    await addDataPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,计算节点获取到人工节点新增表单的单行文本字段值正确
    await expect(page.getByText(fieldData)).toBeVisible();
    await workflowTodoPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeVisible();
    await expect(page.getByText(preManualNodeName)).toBeVisible();
    await page.getByLabel('action-Action.Link-View-users_jobs-workflow-todo-0').click();
    await page.getByRole('textbox').fill(fieldData);
    // await page.getByLabel(`action-Action-Continue the process-${triggerNodeCollectionName}-workflow-todo-0`).click();
    await page.getByLabel('action-Action-Continue the').click();
    await page.waitForLoadState('networkidle');
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Calculation-${calculationNodeName}`, { exact: true })
        .getByRole('button', { name: 'check' })
        .click();
    await expect(page.getByLabel('block-item-Input.JSON-executions-Node result')).toContainText('4');

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});
