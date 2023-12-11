import { CreateWorkFlow, EditWorkFlow, WorkflowManagement, WorkflowListRecords } from '@nocobase/plugin-workflow-test/client';
import { e2e_GeneralFormsTable, appendJsonCollectionName } from '@nocobase/plugin-workflow-test/client';
import { CollectionTriggerNode, CreateRecordNode } from '@nocobase/plugin-workflow-test/client';
import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';

test('Collection event add data trigger, single row text fields for common tables, set constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, single row text fields for common tables, set constant data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'orgname';
    const createNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    const createRecordNodefieldData = createNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByRole('textbox').fill(createRecordNodefieldData);
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(createRecordNodefieldData.toString())).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    expect(nodeResultString).toContain(createRecordNodefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table single line text field, set trigger node single line text field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table single line text field, set trigger node single line text field variable';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'orgname';
    const createNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    // const createRecordNodefieldData = createNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    // await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByRole('textbox').fill(createRecordNodefieldData);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    expect(nodeResultString).toContain(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table integer field, set constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table integer field, set constant data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'staffnum';
    const triggerNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'staffnum';
    const createNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    const createRecordNodefieldData = faker.number.int();
    await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByRole('spinbutton').fill(createRecordNodefieldData.toString());
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = faker.number.int();
    await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(createRecordNodefieldData.toString())).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    expect(nodeResultString).toContain(createRecordNodefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table integer field, set trigger node integer field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table integer field, set trigger node integer field variable';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'staffnum';
    const triggerNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'staffnum';
    const createNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    // const createRecordNodefieldData = createNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    // await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByRole('textbox').fill(createRecordNodefieldData);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = faker.number.int();
    await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    expect(nodeResultString).toContain(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table numeric field, set constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table numeric field, set constant data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'regcapital';
    const triggerNodeFieldDisplayName = '注册资本(数字)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'regcapital';
    const createNodeFieldDisplayName = '注册资本(数字)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    const createRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByRole('spinbutton').fill(createRecordNodefieldData.toString());
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(createRecordNodefieldData.toString())).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    expect(nodeResultString).toContain(createRecordNodefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table numeric field, set trigger node numeric field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table numeric field, set trigger node numeric field variable';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'regcapital';
    const triggerNodeFieldDisplayName = '注册资本(数字)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'regcapital';
    const createNodeFieldDisplayName = '注册资本(数字)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    // const createRecordNodefieldData = createNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    // await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByRole('textbox').fill(createRecordNodefieldData);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    expect(nodeResultString).toContain(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table dropdown radio field, set constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table dropdown radio field, set constant data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'status_singleselect';
    const triggerNodeFieldDisplayName = '公司状态(下拉单选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'status_singleselect';
    const createNodeFieldDisplayName = '公司状态(下拉单选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    // const createRecordNodefieldData = faker.number.int();
    await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: '存续' }).click();
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    // const addDataTriggerWorkflowPagefieldData = faker.number.int();
    // await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: '存续' }).click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '存续' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: '存续' })).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    // expect(nodeResultString).toContain(createRecordNodefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table dropdown radio field, set trigger node dropdown radio field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table dropdown radio field, set trigger node dropdown radio field variable';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'status_singleselect';
    const triggerNodeFieldDisplayName = '公司状态(下拉单选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'status_singleselect';
    const createNodeFieldDisplayName = '公司状态(下拉单选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    // const createRecordNodefieldData = createNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    // await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByRole('textbox').fill(createRecordNodefieldData);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: '存续' }).click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '存续' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: '存续' })).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    // expect(nodeResultString).toContain(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table dropdown radio fields, set constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table dropdown radio fields, set constant data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'range_multipleselect';
    const triggerNodeFieldDisplayName = '经营范围(下拉多选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'range_multipleselect';
    const createNodeFieldDisplayName = '经营范围(下拉多选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    // const createRecordNodefieldData = faker.number.int();
    await page.getByTestId('select-multiple').getByLabel('Search').click();
    await page.getByRole('option', { name: '软件销售', exact: true }).click();
    await page.getByRole('option', { name: '软件开发', exact: true }).click();
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    // const addDataTriggerWorkflowPagefieldData = faker.number.int();
    // await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByTestId('select-multiple').click();
    await page.getByRole('option', { name: '软件销售', exact: true }).click();
    await page.getByRole('option', { name: '软件开发', exact: true }).click();
    await page.getByTestId('select-multiple').click();
    // await page.mouse.move(300, 0, { steps: 100 });
    // await page.mouse.click(300, 0);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    // expect(nodeResultString).toContain(createRecordNodefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table dropdown radio fields, set trigger node dropdown radio field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table dropdown radio fields, set trigger node dropdown radio field variable';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'range_multipleselect';
    const triggerNodeFieldDisplayName = '经营范围(下拉多选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'range_multipleselect';
    const createNodeFieldDisplayName = '经营范围(下拉多选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    // const createRecordNodefieldData = createNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    // await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByRole('textbox').fill(createRecordNodefieldData);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    await page.getByTestId('select-multiple').click();
    await page.getByRole('option', { name: '软件销售', exact: true }).click();
    await page.getByRole('option', { name: '软件开发', exact: true }).click();
    // await page.mouse.move(300, 0, { steps: 100 });
    // await page.mouse.click(300, 0);
    await page.getByTestId('select-multiple').click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();
    // await expect(page.getByText('软件销售')).toBeVisible();
    // await expect(page.getByText('软件开发')).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();


    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    // expect(nodeResultString).toContain(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table date field, set constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table date field, set constant data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'establishdate';
    const triggerNodeFieldDisplayName = '成立日期(日期)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'establishdate';
    const createNodeFieldDisplayName = '成立日期(日期)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    await page.getByLabel('block-item-CollectionFieldset').getByPlaceholder('Select date').click();
    const createRecordNodefieldData = dayjs().format('YYYY-MM-DD');
    await page.getByLabel('block-item-CollectionFieldset').getByPlaceholder('Select date').fill(createRecordNodefieldData);
    await page.getByTitle(createRecordNodefieldData.toString()).locator('div').click();
    // await page.getByLabel('block-item-CollectionFieldset').click();
    // await page.getByPlaceholder('Select date').click();
    // await expect(page.getByPlaceholder('Select date')).toHaveText(createRecordNodefieldData.toString());
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = dayjs().add(1, 'day').format('YYYY-MM-DD');
    await page.getByPlaceholder('Select date').click();
    await page.getByTitle(addDataTriggerWorkflowPagefieldData.toString()).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(createRecordNodefieldData.toString())).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    // expect(nodeResultString).toContain(createRecordNodefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, normal table date field, set trigger node date field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.number.int({ min: 1000, max: 9999 }).toString();
    const createNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, normal table date field, set trigger node date field variable';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'establishdate';
    const triggerNodeFieldDisplayName = '成立日期(日期)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建查询节点数据表
    const createNodeCollectionDisplayName = e2eJsonCollectionDisplayName + createNodeAppendText;
    const createNodeCollectionName = e2eJsonCollectionName + createNodeAppendText;
    const createNodeFieldName = 'establishdate';
    const createNodeFieldDisplayName = '成立日期(日期)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), createNodeAppendText).collections);

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

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Create record-Create record', { exact: true })
        .getByRole('textbox')
        .fill(createRecordNodeName);
    const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
    await createRecordNode.nodeConfigure.click();
    await createRecordNode.collectionDropDown.click();
    await page.getByText(createNodeCollectionDisplayName).click();
    // 设置字段
    await createRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
    // const createRecordNodefieldData = createNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    // await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByRole('textbox').fill(createRecordNodefieldData);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await createRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
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

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = dayjs().add(1, 'day').format('YYYY-MM-DD');
    await page.getByPlaceholder('Select date').click();
    await page.getByTitle(addDataTriggerWorkflowPagefieldData.toString()).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置新增数据节点的数据表页面，查看数据新增成功
    const createNodeCollectionPage = mockPage();
    await createNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${createNodeCollectionDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(createNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Create record-${createRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    // expect(nodeResultString).toContain(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});
