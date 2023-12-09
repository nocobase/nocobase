import { CreateWorkFlow, EditWorkFlow, WorkflowManagement, WorkflowListRecords } from '@nocobase/plugin-workflow-test/client';
import { e2e_GeneralFormsTable, e2e_GeneralFormsTableData, appendJsonCollectionName } from '@nocobase/plugin-workflow-test/client';
import { CollectionTriggerNode, QueryRecordNode } from '@nocobase/plugin-workflow-test/client';
import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';

test('Collection event add data trigger, no filter no sort query common table 1 record', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle = 'Collection event add data trigger, no filter no sort query common table 1 record';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
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

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    // // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByRole('button', { name: 'Select field' }).click();
    // await page.getByText('ID', { exact: true }).click();
    // await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await queryRecordNode.submitButton.click();

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

    // 2、测试步骤：录入数据，触发工作流
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询节点获取到一条记录
    await expect(page.getByText(fieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Query record-${queryRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串不为空,转换为JSON不报错，为JSON格式
    expect(nodeResultString).not.toBeNull();
    expect(() => JSON.parse(nodeResultString)).not.toThrow();
    expect(() => JSON.parse(nodeResultString)).toBeInstanceOf(Object);

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, no filtering and no sorting, query common table multiple records, set page 1 20 per page', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, no filtering and no sorting, query common table multiple records, set page 1 20 per page';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
    );
    const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
    const triggerNodeCollectionRecords = await mockRecords(
        triggerNodeCollectionName,
        triggerNodeCollectionRecordNumber,
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

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByRole('button', { name: 'Select field' }).click();
    // await page.getByText('ID', { exact: true }).click();
    // await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
    await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
    await queryRecordNode.submitButton.click();

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

    // 2、测试步骤：录入数据触发工作流
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(fieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Query record-${queryRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串不为空,转换为数组不报错，为数组格式,长度为X
    expect(nodeResultString).not.toBeNull();
    expect(() => JSON.parse(nodeResultString)).not.toThrow();
    expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
    expect(JSON.parse(nodeResultString).length).toBe(triggerNodeCollectionRecordNumber + 1);
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, no filter ID ascending, query common table with multiple records, set page X to Y per page', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, no filter ID ascending, query common table with multiple records, set page X to Y per page';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
    );
    const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
    const triggerNodeCollectionRecords = await mockRecords(
        triggerNodeCollectionName,
        triggerNodeCollectionRecordNumber,
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

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置排序条件
    await queryRecordNode.addSortFieldsButton.click();
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: 'ID', exact: true }).click();
    await page.getByLabel('block-item-Radio.Group-workflows').getByText('ASC').click();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByRole('button', { name: 'Select field' }).click();
    // await page.getByText('ID', { exact: true }).click();
    // await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
    await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
    const pageNumber = faker.number.int({ min: 1, max: 5 });
    const pageSize = faker.number.int({ min: 1, max: 4 });
    await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
    await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
    await queryRecordNode.submitButton.click();

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

    // 2、测试步骤：录入数据触发工作流
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(fieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Query record-${queryRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串不为空,转换为数组不报错，为数组格式,长度为X
    let nodeResultRecords = 0;
    const recordCount = triggerNodeCollectionRecordNumber + 1;
    if (pageNumber > Math.ceil(recordCount / pageSize)) {
        nodeResultRecords = 0;
        expect(nodeResultString).toBe('[]');
    } else if (pageNumber * pageSize > recordCount) {
        nodeResultRecords = recordCount - (pageNumber - 1) * pageSize;
        expect(nodeResultString).not.toBeNull();
        expect(() => JSON.parse(nodeResultString)).not.toThrow();
        expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
        expect(JSON.parse(nodeResultString).length).toBe(nodeResultRecords);
        // 获取数组中对象下ID的值
        const nodeResultRecordsIDArray = JSON.parse(nodeResultString).map((obj) => obj.id);
        // 断言数组的最小值等于（页码-1）*每页记录数+1
        expect(Math.min(...nodeResultRecordsIDArray)).toBe((pageNumber - 1) * pageSize + 1);
        // 断言数组的最大值等于总记录数
        expect(Math.max(...nodeResultRecordsIDArray)).toBe(recordCount);
    } else {
        nodeResultRecords = pageSize;
        expect(nodeResultString).not.toBeNull();
        expect(() => JSON.parse(nodeResultString)).not.toThrow();
        expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
        expect(JSON.parse(nodeResultString).length).toBe(nodeResultRecords);
        const nodeResultRecordsIDArray = JSON.parse(nodeResultString).map((obj) => obj.id);
        // 断言数组的最小值等于（页码-1）*每页记录数+1
        expect(Math.min(...nodeResultRecordsIDArray)).toBe((pageNumber - 1) * pageSize + 1);
        // 断言数组的最大值等于pageNumber * pageSize
        expect(Math.max(...nodeResultRecordsIDArray)).toBe(pageNumber * pageSize);
    }
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, no filter ID descending, query common table with multiple records, set page X to Y per page', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, no filter ID descending, query common table with multiple records, set page X to Y per page';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
    );
    const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
    const triggerNodeCollectionRecords = await mockRecords(
        triggerNodeCollectionName,
        triggerNodeCollectionRecordNumber,
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

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置排序条件
    await queryRecordNode.addSortFieldsButton.click();
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: 'ID', exact: true }).click();
    await page.getByLabel('block-item-Radio.Group-workflows').getByText('DESC').click();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByRole('button', { name: 'Select field' }).click();
    // await page.getByText('ID', { exact: true }).click();
    // await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
    await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
    const pageNumber = faker.number.int({ min: 1, max: 5 });
    const pageSize = faker.number.int({ min: 1, max: 4 });
    await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
    await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
    await queryRecordNode.submitButton.click();

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

    // 2、测试步骤：录入数据触发工作流
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(fieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Query record-${queryRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串不为空,转换为数组不报错，为数组格式,长度为X
    let nodeResultRecords = 0;
    const recordCount = triggerNodeCollectionRecordNumber + 1;
    if (pageNumber > Math.ceil(recordCount / pageSize)) {
        nodeResultRecords = 0;
        expect(nodeResultString).toBe('[]');
    } else if (pageNumber * pageSize > recordCount) {
        nodeResultRecords = recordCount - (pageNumber - 1) * pageSize;
        expect(nodeResultString).not.toBeNull();
        expect(() => JSON.parse(nodeResultString)).not.toThrow();
        expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
        expect(JSON.parse(nodeResultString).length).toBe(nodeResultRecords);
        // 获取数组中对象下ID的值
        const nodeResultRecordsIDArray = JSON.parse(nodeResultString).map((obj) => obj.id);
        // 断言数组的最小值等于1
        expect(Math.min(...nodeResultRecordsIDArray)).toBe(1);
        // 断言数组的最大值等于总记录数
        expect(Math.max(...nodeResultRecordsIDArray)).toBe(nodeResultRecords);
    } else {
        nodeResultRecords = pageSize;
        expect(nodeResultString).not.toBeNull();
        expect(() => JSON.parse(nodeResultString)).not.toThrow();
        expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
        expect(JSON.parse(nodeResultString).length).toBe(nodeResultRecords);
        const nodeResultRecordsIDArray = JSON.parse(nodeResultString).map((obj) => obj.id);
        // 断言数组的最小值等于（页码-1）*每页记录数+1
        expect(Math.min(...nodeResultRecordsIDArray)).toBe(recordCount - pageNumber * pageSize + 1);
        // 断言数组的最大值等于pageNumber * pageSize
        expect(Math.max(...nodeResultRecordsIDArray)).toBe(recordCount - (pageNumber - 1) * pageSize);
    }
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, no filtering and no sorting, query multiple records of a common table, set page X to Y per page', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, no filtering and no sorting, query multiple records of a common table, set page X to Y per page';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
    );
    const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
    const triggerNodeCollectionRecords = await mockRecords(
        triggerNodeCollectionName,
        triggerNodeCollectionRecordNumber,
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

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByRole('button', { name: 'Select field' }).click();
    // await page.getByText('ID', { exact: true }).click();
    // await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
    await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
    const pageNumber = faker.number.int({ min: 1, max: 5 });
    const pageSize = faker.number.int({ min: 1, max: 4 });
    await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
    await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
    await queryRecordNode.submitButton.click();

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

    // 2、测试步骤：录入数据触发工作流
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(fieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Query record-${queryRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串不为空,转换为数组不报错，为数组格式,长度为X
    let nodeResultRecords = 0;
    if (pageNumber > Math.ceil(triggerNodeCollectionRecordNumber / pageSize)) {
        nodeResultRecords = 0;
        expect(nodeResultString).toBe('[]');
    } else if (pageNumber * pageSize > triggerNodeCollectionRecordNumber) {
        nodeResultRecords = triggerNodeCollectionRecordNumber - (pageNumber - 1) * pageSize;
        expect(nodeResultString).not.toBeNull();
        expect(() => JSON.parse(nodeResultString)).not.toThrow();
        expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
        expect(JSON.parse(nodeResultString).length).toBe(nodeResultRecords);
    } else {
        nodeResultRecords = pageSize;
        expect(nodeResultString).not.toBeNull();
        expect(() => JSON.parse(nodeResultString)).not.toThrow();
        expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
        expect(JSON.parse(nodeResultString).length).toBe(nodeResultRecords);
    }
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, no filtering and no sorting, query the ordinary table 1 record, set the X page Y per page, query the results of the empty, exit the process', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, no filtering and no sorting, query the ordinary table 1 record, set the X page Y per page, query the results of the empty, exit the process';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
    );
    const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
    const triggerNodeCollectionRecords = await mockRecords(
        triggerNodeCollectionName,
        triggerNodeCollectionRecordNumber,
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

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    // await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByRole('button', { name: 'Select field' }).click();
    // await page.getByText('ID', { exact: true }).click();
    // await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
    await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
    const pageNumber = faker.number.int({ min: 5, max: 5 });
    const pageSize = faker.number.int({ min: 5, max: 5 });
    await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
    await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
    await queryRecordNode.exitProcessOptionsBoxWithEmptyResult.check();
    await expect(queryRecordNode.exitProcessOptionsBoxWithEmptyResult).toBeChecked();
    await queryRecordNode.submitButton.click();

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

    // 2、测试步骤：录入数据触发工作流
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(fieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Query record-${queryRecordNodeName}`)
        .getByRole('button', { name: 'exclamation' })
        .click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串不为空,转换为数组不报错，为数组格式,长度为X
    let nodeResultRecords = 0;
    if (pageNumber > Math.ceil(triggerNodeCollectionRecordNumber / pageSize)) {
        nodeResultRecords = 0;
        // expect(nodeResultString).toBe('[]');
        expect(nodeResultString).not.toBeNull();
    } else if (pageNumber * pageSize > triggerNodeCollectionRecordNumber) {
        nodeResultRecords = triggerNodeCollectionRecordNumber - (pageNumber - 1) * pageSize;
        expect(nodeResultString).not.toBeNull();
        expect(() => JSON.parse(nodeResultString)).not.toThrow();
        expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
        expect(JSON.parse(nodeResultString).length).toBe(nodeResultRecords);
    } else {
        nodeResultRecords = pageSize;
        expect(nodeResultString).not.toBeNull();
        expect(() => JSON.parse(nodeResultString)).not.toThrow();
        expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
        expect(JSON.parse(nodeResultString).length).toBe(nodeResultRecords);
    }
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, no filtering and no sorting, query the common table multiple records, set the X page Y per page, query results are empty, exit the process', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, no filtering and no sorting, query the common table multiple records, set the X page Y per page, query results are empty, exit the process';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';

    //创建数据表
    await mockCollections(
        appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections,
    );
    const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
    const triggerNodeCollectionRecords = await mockRecords(
        triggerNodeCollectionName,
        triggerNodeCollectionRecordNumber,
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

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByRole('button', { name: 'Select field' }).click();
    // await page.getByText('ID', { exact: true }).click();
    // await page.getByLabel('block-item-Filter-workflows-').getByLabel('variable-button').click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
    await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
    const pageNumber = faker.number.int({ min: 5, max: 5 });
    const pageSize = faker.number.int({ min: 5, max: 5 });
    await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
    await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
    await queryRecordNode.exitProcessOptionsBoxWithEmptyResult.check();
    await expect(queryRecordNode.exitProcessOptionsBoxWithEmptyResult).toBeChecked();
    await queryRecordNode.submitButton.click();

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

    // 2、测试步骤：录入数据触发工作流
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(fieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page
        .getByLabel(`Query record-${queryRecordNodeName}`)
        .getByRole('button', { name: 'exclamation' })
        .click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串不为空,转换为数组不报错，为数组格式,长度为X
    let nodeResultRecords = 0;
    if (pageNumber > Math.ceil(triggerNodeCollectionRecordNumber / pageSize)) {
        nodeResultRecords = 0;
        expect(nodeResultString).toBe('[]');
        // expect(nodeResultString).not.toBeNull();
    } else if (pageNumber * pageSize > triggerNodeCollectionRecordNumber) {
        nodeResultRecords = triggerNodeCollectionRecordNumber - (pageNumber - 1) * pageSize;
        expect(nodeResultString).not.toBeNull();
        expect(() => JSON.parse(nodeResultString)).not.toThrow();
        expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
        expect(JSON.parse(nodeResultString).length).toBe(nodeResultRecords);
    } else {
        nodeResultRecords = pageSize;
        expect(nodeResultString).not.toBeNull();
        expect(() => JSON.parse(nodeResultString)).not.toThrow();
        expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
        expect(JSON.parse(nodeResultString).length).toBe(nodeResultRecords);
    }
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, filter to meet all conditions (status_singleselect=1 and staffnum>180) unsorted, query normal table 1 record', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const queryNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, filter to meet all conditions (status_singleselect=1 and staffnum>180) unsorted, query normal table 1 record';

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
    const queryNodeCollectionDisplayName = e2eJsonCollectionDisplayName + queryNodeAppendText;
    const queryNodeCollectionName = e2eJsonCollectionName + queryNodeAppendText;
    const queryNodeFieldName = 'orgname';
    const queryNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), queryNodeAppendText).collections);
    const queryNodeCollectionRecords = await mockRecords(queryNodeCollectionName, e2e_GeneralFormsTableData);

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

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByText(queryNodeCollectionDisplayName).click();
    // await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司状态(下拉单选)' }).click();
    await page.getByTestId('select-single').click();
    await page.getByRole('option', { name: '存续' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page
        .getByLabel('block-item-Filter-workflows-Filter')
        .getByRole('button', { name: 'Search Select field' })
        .click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: 'Search =' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('180');

    await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
    await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
    // const pageNumber = faker.number.int({ min: 1, max: 5 });
    // const pageSize = faker.number.int({ min: 1, max: 4 });
    // await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
    // await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
    await queryRecordNode.submitButton.click();

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

    // 2、测试步骤：录入数据触发工作流
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(fieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Query record-${queryRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串不为空,转换为数组不报错，为数组格式,长度为X
    expect(nodeResultString).not.toBeNull();
    expect(() => JSON.parse(nodeResultString)).not.toThrow();
    expect(() => JSON.parse(nodeResultString)).toBeInstanceOf(Object);
    const nodeResultRecordID = JSON.parse(nodeResultString).testdataid;
    const expectRecordIDArray = [33, 35, 12];
    // 断言nodeResultRecordID的值在expectRecordIDArray数组中
    expect(expectRecordIDArray).toContain(nodeResultRecordID);
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});

test('Collection event add data trigger, filter to satisfy any condition (status_singleselect=1 or staffnum>180) unsorted, query common table for multiple rows, set page X to Y per page', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
}) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const queryNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
        'Collection event add data trigger, filter to satisfy any condition (status_singleselect=1 or staffnum>180) unsorted, query common table for multiple rows, set page X to Y per page';

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
    const queryNodeCollectionDisplayName = e2eJsonCollectionDisplayName + queryNodeAppendText;
    const queryNodeCollectionName = e2eJsonCollectionName + queryNodeAppendText;
    const queryNodeFieldName = 'orgname';
    const queryNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), queryNodeAppendText).collections);
    const queryNodeCollectionRecords = await mockRecords(queryNodeCollectionName, e2e_GeneralFormsTableData);

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

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
        .getByLabel('Query record-Query record', { exact: true })
        .getByRole('textbox')
        .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByText(queryNodeCollectionDisplayName).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    await page.getByTestId('filter-select-all-or-any').click();
    await page.getByRole('option', { name: 'Any' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司状态(下拉单选)' }).click();
    await page.getByTestId('select-single').click();
    await page.getByRole('option', { name: '存续' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page
        .getByLabel('block-item-Filter-workflows-Filter')
        .getByRole('button', { name: 'Search Select field' })
        .click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: 'Search =' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('180');

    await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
    await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
    await queryRecordNode.pageNumberEditBox.fill('1');
    await queryRecordNode.pageSizeEditBox.fill('30');
    await queryRecordNode.submitButton.click();

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

    // 2、测试步骤：录入数据触发工作流
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(fieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Query record-${queryRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串不为空,转换为数组不报错，为数组格式,长度为X
    expect(nodeResultString).not.toBeNull();
    expect(() => JSON.parse(nodeResultString)).not.toThrow();
    expect(Array.isArray(JSON.parse(nodeResultString))).toBeTruthy();
    expect(JSON.parse(nodeResultString).length).toBe(26);
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
});
