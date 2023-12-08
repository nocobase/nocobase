import { CreateWorkFlow, EditWorkFlow, WorkflowManagement, WorkflowListRecords } from '@nocobase/plugin-workflow-test';
import { e2e_GeneralFormsTable, appendJsonCollectionName } from '@nocobase/plugin-workflow-test';
import { CollectionTriggerNode, DeleteRecordNode } from '@nocobase/plugin-workflow-test';
import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';

test('Collection event add data trigger, filter single line text field not null, delete common table data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const deleteNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, filter single line text field not null, delete common table data';

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

    // 创建更新节点数据表
    const deleteNodeCollectionDisplayName = e2eJsonCollectionDisplayName + deleteNodeAppendText;
    const deleteNodeCollectionName = e2eJsonCollectionName + deleteNodeAppendText;
    const deleteNodeFieldName = 'orgname';
    const deleteNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), deleteNodeAppendText).collections);
    const deleteNodeCollectionRecordOne = deleteNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const deleteNodeCollectionRecordTwo = deleteNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const deleteNodeCollectionRecordThree = deleteNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const deleteNodeCollectionRecords = await mockRecords(deleteNodeCollectionName, [{ orgname: deleteNodeCollectionRecordOne }, { orgname: deleteNodeCollectionRecordTwo }, { orgname: deleteNodeCollectionRecordThree }]);

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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置删除数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'destroy', exact: true }).click();
    const deleteRecordNodeName = 'Delete record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Delete record-Delete record', { exact: true })
        .getByRole('textbox')
        .fill(deleteRecordNodeName);
    const deleteRecordNode = new DeleteRecordNode(page, deleteRecordNodeName);
    await deleteRecordNode.nodeConfigure.click();
    await deleteRecordNode.collectionDropDown.click();
    await page.getByText(deleteNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: deleteNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();
    await deleteRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置删除数据节点的数据表页面，查看删除前数据
    const deleteNodeCollectionPage = mockPage();
    await deleteNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByLabel(`dataBlocks-table-${deleteNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(deleteNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(deleteNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(deleteNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(deleteNodeCollectionRecordThree.toString())).toBeVisible();

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
    // 进入删除数据节点的数据表页面，查看删除后数据
    await deleteNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(deleteNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(deleteNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(deleteNodeCollectionRecordThree.toString())).not.toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Delete record-${deleteRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    expect(nodeResultString).toContain('3');
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, filter single line text field is trigger node single line text field variable , delete common table data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const deleteNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, filter single line text field not null, delete common table data';

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

    // 创建更新节点数据表
    const deleteNodeCollectionDisplayName = e2eJsonCollectionDisplayName + deleteNodeAppendText;
    const deleteNodeCollectionName = e2eJsonCollectionName + deleteNodeAppendText;
    const deleteNodeFieldName = 'orgname';
    const deleteNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), deleteNodeAppendText).collections);
    const deleteNodeCollectionRecordOne = deleteNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const deleteNodeCollectionRecordTwo = deleteNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const deleteNodeCollectionRecordThree = deleteNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const deleteNodeCollectionRecords = await mockRecords(deleteNodeCollectionName, [{ orgname: deleteNodeCollectionRecordOne }, { orgname: deleteNodeCollectionRecordTwo }, { orgname: deleteNodeCollectionRecordThree }]);

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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置删除数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'destroy', exact: true }).click();
    const deleteRecordNodeName = 'Delete record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Delete record-Delete record', { exact: true })
        .getByRole('textbox')
        .fill(deleteRecordNodeName);
    const deleteRecordNode = new DeleteRecordNode(page, deleteRecordNodeName);
    await deleteRecordNode.nodeConfigure.click();
    await deleteRecordNode.collectionDropDown.click();
    await page.getByText(deleteNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: deleteNodeFieldDisplayName.toString() }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-Filter-workflows-Filter').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await deleteRecordNode.submitButton.click();


    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置删除数据节点的数据表页面，查看删除前数据
    const deleteNodeCollectionPage = mockPage();
    await deleteNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByLabel(`dataBlocks-table-${deleteNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(deleteNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(deleteNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(deleteNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(deleteNodeCollectionRecordThree.toString())).toBeVisible();

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
    const addDataTriggerWorkflowPagefieldData = deleteNodeCollectionRecordOne;
    await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 进入删除数据节点的数据表页面，查看删除后数据
    await deleteNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(deleteNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(deleteNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(deleteNodeCollectionRecordThree.toString())).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Delete record-${deleteRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    expect(nodeResultString).toContain('1');
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});