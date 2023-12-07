import { expect, test } from '@nocobase/test/client';
import { e2e_GeneralFormsTable, appendJsonCollectionName, generateRandomLetters } from './pageobject/e2eTemplateJson';
import { e2e_GeneralFormsTableData, } from './pageobject/e2eTemplateJson';
import { CreateWorkFlow, EditWorkFlow, CollectionTriggerNode, FromEventTriggerNode } from './pageobject/workFlow';
import { WorkflowManagement, WorkflowListRecords, ScheduleTriggerNode, ClculationNode } from './pageobject/workFlow';
import { QueryRecordNode, CreateRecordNode, UpdateRecordNode, DeleteRecordNode } from './pageobject/workFlow';
import { AggregateNode, ManualNode, ConditionYesNode, ConditionBranchNode } from './pageobject/workFlow';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';

test.describe('query data node', () => {
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Query record-Query record', { exact: true })
      .getByLabel('textarea')
      .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByText(triggerNodeCollectionDisplayName).click();
    // // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByTestId('filter-select-field').getByLabel('Search').click();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Query record-Query record', { exact: true })
      .getByLabel('textarea')
      .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByTestId('filter-select-field').getByLabel('Search').click();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Query record-Query record', { exact: true })
      .getByLabel('textarea')
      .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置排序条件
    await queryRecordNode.addSortFieldsButton.click();
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: 'ID', exact: true }).click();
    await page.getByLabel('block-item-Radio.Group-workflows').getByText('ASC').click();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByTestId('filter-select-field').getByLabel('Search').click();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Query record-Query record', { exact: true })
      .getByLabel('textarea')
      .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置排序条件
    await queryRecordNode.addSortFieldsButton.click();
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: 'ID', exact: true }).click();
    await page.getByLabel('block-item-Radio.Group-workflows').getByText('DESC').click();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByTestId('filter-select-field').getByLabel('Search').click();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Query record-Query record', { exact: true })
      .getByLabel('textarea')
      .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByTestId('filter-select-field').getByLabel('Search').click();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Query record-Query record', { exact: true })
      .getByLabel('textarea')
      .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByText(triggerNodeCollectionDisplayName).click();
    // await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByTestId('filter-select-field').getByLabel('Search').click();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Query record-Query record', { exact: true })
      .getByLabel('textarea')
      .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByTestId('filter-select-field').getByLabel('Search').click();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Query record-Query record', { exact: true })
      .getByLabel('textarea')
      .fill(queryRecordNodeName);
    const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
    await queryRecordNode.nodeConfigure.click();
    await queryRecordNode.collectionDropDown.click();
    await page.getByText(queryNodeCollectionDisplayName).click();
    // await queryRecordNode.allowMultipleDataBoxesForResults.check();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').getByLabel('Search').click();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置查询节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'query', exact: true }).click();
    const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Query record-Query record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByTestId('filter-select-field').getByLabel('Search').click();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
});
test.describe('create data node', () => {
  test('Collection event add data trigger, single row text fields for common tables, set constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
    const triggerNodeAppendText = faker.lorem.word(4);
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
    await page.getByText(triggerNodeCollectionDisplayName).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    //配置新增数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'create', exact: true }).click();
    const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Create record-Create record', { exact: true })
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${createNodeCollectionDisplayName}`).click();
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
});
test.describe('update data node,batch update', () => {
  test('Collection event add data trigger, batch update, filter single line text field not empty, common table single line text field data, set single line text field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter single line text field not empty, common table single line text field data, set single line text field constant data';

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
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'orgname';
    const updateNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ orgname: updateNodeCollectionRecordOne }, { orgname: updateNodeCollectionRecordTwo }, { orgname: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-item-CollectionFieldset').getByRole('textbox').fill(updayteRecordNodefieldData);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter single line text field not empty, common table single line text field data, set trigger node single line text field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter single line text field not empty, common table single line text field data, set trigger node single line text field variable';

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
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'orgname';
    const updateNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ orgname: updateNodeCollectionRecordOne }, { orgname: updateNodeCollectionRecordTwo }, { orgname: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
    await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter multi-line text field not empty, common table multi-line text field data, set multi-line text field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter multi-line text field not empty, common table multi-line text field data, set multi-line text field constant data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'address';
    const triggerNodeFieldDisplayName = '公司地址(多行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'address';
    const updateNodeFieldDisplayName = '公司地址(多行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ address: updateNodeCollectionRecordOne }, { address: updateNodeCollectionRecordTwo }, { address: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-item-CollectionFieldset').getByLabel('textarea').fill(updayteRecordNodefieldData);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('textarea').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter multiline text field not empty, common table multiline text field data, set trigger node multiline text field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter multiline text field not empty, common table multiline text field data, set trigger node multiline text field variable';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'address';
    const triggerNodeFieldDisplayName = '公司地址(多行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'address';
    const updateNodeFieldDisplayName = '公司地址(多行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ address: updateNodeCollectionRecordOne }, { address: updateNodeCollectionRecordTwo }, { address: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
    await page.getByLabel('textarea').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter integer field not null, common table integer field data, set integer field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter integer field not null, common table integer field data, set integer field constant data';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'staffnum';
    const updateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = faker.number.int();
    const updateNodeCollectionRecordTwo = faker.number.int();
    const updateNodeCollectionRecordThree = faker.number.int();
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ staffnum: updateNodeCollectionRecordOne }, { staffnum: updateNodeCollectionRecordTwo }, { staffnum: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updayteRecordNodefieldData = faker.number.int();
    await page.getByLabel('block-item-CollectionFieldset').getByRole('spinbutton').fill(updayteRecordNodefieldData.toString());
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter integer field not empty, common table integer field data, set trigger node integer field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter integer field not empty, common table integer field data, set trigger node integer field variable';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'staffnum';
    const updateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = faker.number.int();
    const updateNodeCollectionRecordTwo = faker.number.int();
    const updateNodeCollectionRecordThree = faker.number.int();
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ staffnum: updateNodeCollectionRecordOne }, { staffnum: updateNodeCollectionRecordTwo }, { staffnum: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = faker.number.int();
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
    await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter numeric field not null, common table numeric field data, set numeric field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter numeric field not null, common table numeric field data, set numeric field constant data';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'regcapital';
    const updateNodeFieldDisplayName = '注册资本(数字)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    // 定义随机4位数小数的数值
    // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
    const updateNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecordTwo = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecordThree = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ regcapital: updateNodeCollectionRecordOne }, { regcapital: updateNodeCollectionRecordTwo }, { regcapital: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updayteRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    await page.getByLabel('block-item-CollectionFieldset').getByRole('spinbutton').fill(updayteRecordNodefieldData.toString());
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter numeric field not empty, common table numeric field data, set trigger node numeric field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter numeric field not empty, common table numeric field data, set trigger node numeric field variable';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'regcapital';
    const updateNodeFieldDisplayName = '注册资本(数字)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecordTwo = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecordThree = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ regcapital: updateNodeCollectionRecordOne }, { regcapital: updateNodeCollectionRecordTwo }, { regcapital: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
    await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter dropdown radio field not null, common table dropdown radio field data, set dropdown radio field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter dropdown radio field not null, common table dropdown radio field data, set dropdown radio field constant data';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'status_singleselect';
    const updateNodeFieldDisplayName = '公司状态(下拉单选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    // 定义随机4位数小数的数值
    // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
    const updateNodeCollectionRecordOne = '1';
    const updateNodeCollectionRecordTwo = '2';
    const updateNodeCollectionRecordThree = '3';
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ status_singleselect: updateNodeCollectionRecordOne }, { status_singleselect: updateNodeCollectionRecordTwo }, { status_singleselect: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updayteRecordNodefieldData = '注销';
    await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: '注销' }).click();
    await updateRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText('存续')).toBeVisible();
    await expect(page.getByText('在业')).toBeVisible();
    await expect(page.getByText('吊销')).toBeVisible();
    await expect(page.getByText('注销')).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = '注销';
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: '注销' }).click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '注销' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('存续')).not.toBeVisible();
    await expect(page.getByText('在业')).not.toBeVisible();
    await expect(page.getByText('吊销')).not.toBeVisible();
    await expect(page.getByText('注销').first()).toBeVisible();
    await expect(page.getByText('注销').nth(1)).toBeVisible();
    await expect(page.getByText('注销').nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter dropdown radio field not empty, common table dropdown radio field data, set trigger node dropdown radio field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter dropdown radio field not empty, common table dropdown radio field data, set trigger node dropdown radio field variable';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'status_singleselect';
    const updateNodeFieldDisplayName = '公司状态(下拉单选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = '1';
    const updateNodeCollectionRecordTwo = '2';
    const updateNodeCollectionRecordThree = '3';
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ status_singleselect: updateNodeCollectionRecordOne }, { status_singleselect: updateNodeCollectionRecordTwo }, { status_singleselect: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    // const updayteRecordNodefieldData = '注销';
    await expect(page.getByText('存续')).toBeVisible();
    await expect(page.getByText('在业')).toBeVisible();
    await expect(page.getByText('吊销')).toBeVisible();
    await expect(page.getByText('注销')).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = '注销';
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: '注销' }).click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '注销' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('存续')).not.toBeVisible();
    await expect(page.getByText('在业')).not.toBeVisible();
    await expect(page.getByText('吊销')).not.toBeVisible();
    await expect(page.getByText('注销').first()).toBeVisible();
    await expect(page.getByText('注销').nth(1)).toBeVisible();
    await expect(page.getByText('注销').nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'range_multipleselect';
    const updateNodeFieldDisplayName = '经营范围(下拉多选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    // 定义随机4位数小数的数值
    // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
    const updateNodeCollectionRecordOne = ['F3134','I3006'];
    const updateNodeCollectionRecordTwo = ['F3134','I3007'];
    const updateNodeCollectionRecordThree = ['I3006','I3007'];
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ range_multipleselect: updateNodeCollectionRecordOne }, { range_multipleselect: updateNodeCollectionRecordTwo }, { range_multipleselect: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    // const createRecordNodefieldData = faker.number.int();
    await page.getByTestId('select-multiple').getByLabel('Search').click();
    await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
    await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
    await updateRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    // const addDataTriggerWorkflowPagefieldData = '注销';
    await page.getByTestId('select-multiple').click();
    await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
    await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
    await page.getByTestId('select-multiple').click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(1)).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'range_multipleselect';
    const updateNodeFieldDisplayName = '经营范围(下拉多选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = ['F3134','I3006'];
    const updateNodeCollectionRecordTwo = ['F3134','I3007'];
    const updateNodeCollectionRecordThree = ['I3006','I3007'];
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ range_multipleselect: updateNodeCollectionRecordOne }, { range_multipleselect: updateNodeCollectionRecordTwo }, { range_multipleselect: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    // const updayteRecordNodefieldData = '注销';
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

        // 2、测试步骤：录入数据触发工作流
    // const addDataTriggerWorkflowPagefieldData = '注销';
    await page.getByTestId('select-multiple').click();
    await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
    await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
    await page.getByTestId('select-multiple').click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(1)).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter date field not null, common table date field data, set date field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'establishdate';
    const updateNodeFieldDisplayName = '成立日期(日期)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    // 定义随机4位数小数的数值
    // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
    const updateNodeCollectionRecordOne = dayjs().add(-3,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecordTwo = dayjs().add(-2,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecordThree = dayjs().add(-1,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ establishdate: updateNodeCollectionRecordOne }, { establishdate: updateNodeCollectionRecordTwo }, { establishdate: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updateRecordNodefieldData = dayjs().format('YYYY-MM-DD');
    await page.getByLabel('block-item-CollectionFieldset').getByPlaceholder('Select date').click();
    await page.getByLabel('block-item-CollectionFieldset').getByPlaceholder('Select date').fill(updateRecordNodefieldData);
    await page.getByTitle(updateRecordNodefieldData.toString()).locator('div').click();
    await updateRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = dayjs().format('YYYY-MM-DD');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = dayjs().format('YYYY-MM-DD');
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
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, batch update, filter date field not empty, common table date field data, set trigger node date field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, batch update, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'establishdate';
    const updateNodeFieldDisplayName = '成立日期(日期)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = dayjs().add(-3,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecordTwo = dayjs().add(-2,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecordThree = dayjs().add(-1,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ establishdate: updateNodeCollectionRecordOne }, { establishdate: updateNodeCollectionRecordTwo }, { establishdate: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = dayjs().format('YYYY-MM-DD');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

        // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
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
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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
});
test.describe('update data node,update item by item', () => {
  test('Collection event add data trigger, update item by item, filter single line text field not empty, common table single line text field data, set single line text field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter single line text field not empty, common table single line text field data, set single line text field constant data';

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
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'orgname';
    const updateNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ orgname: updateNodeCollectionRecordOne }, { orgname: updateNodeCollectionRecordTwo }, { orgname: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-item-CollectionFieldset').getByRole('textbox').fill(updayteRecordNodefieldData);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter single line text field not empty, common table single line text field data, set trigger node single line text field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter single line text field not empty, common table single line text field data, set trigger node single line text field variable';

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
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'orgname';
    const updateNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ orgname: updateNodeCollectionRecordOne }, { orgname: updateNodeCollectionRecordTwo }, { orgname: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
    await page.getByRole('textbox').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter multi-line text field not empty, common table multi-line text field data, set multi-line text field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter multi-line text field not empty, common table multi-line text field data, set multi-line text field constant data';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'address';
    const triggerNodeFieldDisplayName = '公司地址(多行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'address';
    const updateNodeFieldDisplayName = '公司地址(多行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ address: updateNodeCollectionRecordOne }, { address: updateNodeCollectionRecordTwo }, { address: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-item-CollectionFieldset').getByLabel('textarea').fill(updayteRecordNodefieldData);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('textarea').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter multiline text field not empty, common table multiline text field data, set trigger node multiline text field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter multiline text field not empty, common table multiline text field data, set trigger node multiline text field variable';

    // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流；1.3、存在一个添加数据的区块
    //创建数据表
    const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
    const e2eJsonCollectionName = 'tt_amt_org';
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = e2eJsonCollectionDisplayName + triggerNodeAppendText;
    const triggerNodeCollectionName = e2eJsonCollectionName + triggerNodeAppendText;
    const triggerNodeFieldName = 'address';
    const triggerNodeFieldDisplayName = '公司地址(多行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), triggerNodeAppendText).collections);

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'address';
    const updateNodeFieldDisplayName = '公司地址(多行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordTwo = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecordThree = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString() + faker.lorem.word(4);
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ address: updateNodeCollectionRecordOne }, { address: updateNodeCollectionRecordTwo }, { address: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = updateNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
    await page.getByLabel('textarea').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter integer field not null, common table integer field data, set integer field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter integer field not null, common table integer field data, set integer field constant data';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'staffnum';
    const updateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = faker.number.int();
    const updateNodeCollectionRecordTwo = faker.number.int();
    const updateNodeCollectionRecordThree = faker.number.int();
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ staffnum: updateNodeCollectionRecordOne }, { staffnum: updateNodeCollectionRecordTwo }, { staffnum: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updayteRecordNodefieldData = faker.number.int();
    await page.getByLabel('block-item-CollectionFieldset').getByRole('spinbutton').fill(updayteRecordNodefieldData.toString());
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter integer field not empty, common table integer field data, set trigger node integer field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter integer field not empty, common table integer field data, set trigger node integer field variable';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'staffnum';
    const updateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = faker.number.int();
    const updateNodeCollectionRecordTwo = faker.number.int();
    const updateNodeCollectionRecordThree = faker.number.int();
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ staffnum: updateNodeCollectionRecordOne }, { staffnum: updateNodeCollectionRecordTwo }, { staffnum: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = faker.number.int();
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
    await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter numeric field not null, common table numeric field data, set numeric field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter numeric field not null, common table numeric field data, set numeric field constant data';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'regcapital';
    const updateNodeFieldDisplayName = '注册资本(数字)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    // 定义随机4位数小数的数值
    // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
    const updateNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecordTwo = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecordThree = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ regcapital: updateNodeCollectionRecordOne }, { regcapital: updateNodeCollectionRecordTwo }, { regcapital: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updayteRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    await page.getByLabel('block-item-CollectionFieldset').getByRole('spinbutton').fill(updayteRecordNodefieldData.toString());
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter numeric field not empty, common table numeric field data, set trigger node numeric field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter numeric field not empty, common table numeric field data, set trigger node numeric field variable';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'regcapital';
    const updateNodeFieldDisplayName = '注册资本(数字)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecordTwo = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecordThree = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ regcapital: updateNodeCollectionRecordOne }, { regcapital: updateNodeCollectionRecordTwo }, { regcapital: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
    await page.getByRole('spinbutton').fill(addDataTriggerWorkflowPagefieldData.toString());
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByText(addDataTriggerWorkflowPagefieldData.toString())).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter dropdown radio field not null, common table dropdown radio field data, set dropdown radio field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter dropdown radio field not null, common table dropdown radio field data, set dropdown radio field constant data';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'status_singleselect';
    const updateNodeFieldDisplayName = '公司状态(下拉单选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    // 定义随机4位数小数的数值
    // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
    const updateNodeCollectionRecordOne = '1';
    const updateNodeCollectionRecordTwo = '2';
    const updateNodeCollectionRecordThree = '3';
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ status_singleselect: updateNodeCollectionRecordOne }, { status_singleselect: updateNodeCollectionRecordTwo }, { status_singleselect: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updayteRecordNodefieldData = '注销';
    await page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: '注销' }).click();
    await updateRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByText('存续')).toBeVisible();
    await expect(page.getByText('在业')).toBeVisible();
    await expect(page.getByText('吊销')).toBeVisible();
    await expect(page.getByText('注销')).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = '注销';
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: '注销' }).click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '注销' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('存续')).not.toBeVisible();
    await expect(page.getByText('在业')).not.toBeVisible();
    await expect(page.getByText('吊销')).not.toBeVisible();
    await expect(page.getByText('注销').first()).toBeVisible();
    await expect(page.getByText('注销').nth(1)).toBeVisible();
    await expect(page.getByText('注销').nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter dropdown radio field not empty, common table dropdown radio field data, set trigger node dropdown radio field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter dropdown radio field not empty, common table dropdown radio field data, set trigger node dropdown radio field variable';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'status_singleselect';
    const updateNodeFieldDisplayName = '公司状态(下拉单选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = '1';
    const updateNodeCollectionRecordTwo = '2';
    const updateNodeCollectionRecordThree = '3';
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ status_singleselect: updateNodeCollectionRecordOne }, { status_singleselect: updateNodeCollectionRecordTwo }, { status_singleselect: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    // const updayteRecordNodefieldData = '注销';
    await expect(page.getByText('存续')).toBeVisible();
    await expect(page.getByText('在业')).toBeVisible();
    await expect(page.getByText('吊销')).toBeVisible();
    await expect(page.getByText('注销')).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = '注销';
    await page.getByTestId('select-single').getByLabel('Search').click();
    await page.getByRole('option', { name: '注销' }).click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '注销' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('存续')).not.toBeVisible();
    await expect(page.getByText('在业')).not.toBeVisible();
    await expect(page.getByText('吊销')).not.toBeVisible();
    await expect(page.getByText('注销').first()).toBeVisible();
    await expect(page.getByText('注销').nth(1)).toBeVisible();
    await expect(page.getByText('注销').nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'range_multipleselect';
    const updateNodeFieldDisplayName = '经营范围(下拉多选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    // 定义随机4位数小数的数值
    // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
    const updateNodeCollectionRecordOne = ['F3134','I3006'];
    const updateNodeCollectionRecordTwo = ['F3134','I3007'];
    const updateNodeCollectionRecordThree = ['I3006','I3007'];
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ range_multipleselect: updateNodeCollectionRecordOne }, { range_multipleselect: updateNodeCollectionRecordTwo }, { range_multipleselect: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    // const createRecordNodefieldData = faker.number.int();
    await page.getByTestId('select-multiple').getByLabel('Search').click();
    await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
    await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
    await updateRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    // const addDataTriggerWorkflowPagefieldData = '注销';
    await page.getByTestId('select-multiple').click();
    await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
    await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
    await page.getByTestId('select-multiple').click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(1)).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'range_multipleselect';
    const updateNodeFieldDisplayName = '经营范围(下拉多选)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = ['F3134','I3006'];
    const updateNodeCollectionRecordTwo = ['F3134','I3007'];
    const updateNodeCollectionRecordThree = ['I3006','I3007'];
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ range_multipleselect: updateNodeCollectionRecordOne }, { range_multipleselect: updateNodeCollectionRecordTwo }, { range_multipleselect: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    // const updayteRecordNodefieldData = '注销';
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

        // 2、测试步骤：录入数据触发工作流
    // const addDataTriggerWorkflowPagefieldData = '注销';
    await page.getByTestId('select-multiple').click();
    await page.getByRole('option', { name: '数据处理服务', exact: true }).click();
    await page.getByRole('option', { name: '计算机系统服务', exact: true }).click();
    await page.getByTestId('select-multiple').click();
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：数据添加成功，工作流成功触发,查询数据节点获取到多条记录
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' })).toBeVisible();
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '软件销售 软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '软件销售 人工智能基础软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '软件开发 人工智能基础软件开发' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(1)).toBeVisible();
    await expect(page.getByRole('button', { name: '数据处理服务 计算机系统服务' }).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter date field not null, common table date field data, set date field constant data', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter dropdown radio fields not null, common table dropdown radio fields data, set dropdown radio fields constant data';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'establishdate';
    const updateNodeFieldDisplayName = '成立日期(日期)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    // 定义随机4位数小数的数值
    // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
    const updateNodeCollectionRecordOne = dayjs().add(-3,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecordTwo = dayjs().add(-2,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecordThree = dayjs().add(-1,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ establishdate: updateNodeCollectionRecordOne }, { establishdate: updateNodeCollectionRecordTwo }, { establishdate: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    const updateRecordNodefieldData = dayjs().format('YYYY-MM-DD');
    await page.getByLabel('block-item-CollectionFieldset').getByPlaceholder('Select date').click();
    await page.getByLabel('block-item-CollectionFieldset').getByPlaceholder('Select date').fill(updateRecordNodefieldData);
    await page.getByTitle(updateRecordNodefieldData.toString()).locator('div').click();
    await updateRecordNode.submitButton.click();

    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = dayjs().format('YYYY-MM-DD');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

    // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = dayjs().format('YYYY-MM-DD');
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
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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

  test('Collection event add data trigger, update item by item, filter date field not empty, common table date field data, set trigger node date field variable', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const updateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, update item by item, filter dropdown radio fields not empty, common table dropdown radio fields data, set trigger node dropdown radio fields variable';

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

    // 创建更新节点数据表
    const updateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + updateNodeAppendText;
    const updateNodeCollectionName = e2eJsonCollectionName + updateNodeAppendText;
    const updateNodeFieldName = 'establishdate';
    const updateNodeFieldDisplayName = '成立日期(日期)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), updateNodeAppendText).collections);
    const updateNodeCollectionRecordOne = dayjs().add(-3,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecordTwo = dayjs().add(-2,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecordThree = dayjs().add(-1,'day').format('YYYY-MM-DD');
    const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [{ establishdate: updateNodeCollectionRecordOne }, { establishdate: updateNodeCollectionRecordTwo }, { establishdate: updateNodeCollectionRecordThree }]);

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

    //配置更新数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'update', exact: true }).click();
    const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Update record-Update record', { exact: true })
      .getByLabel('textarea')
      .fill(updateRecordNodeName);
    const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
    await updateRecordNode.nodeConfigure.click();
    await updateRecordNode.collectionDropDown.click();
    await page.getByText(updateNodeCollectionDisplayName).click();
    await updateRecordNode.articleByArticleUpdateModeRadio.click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('filter-select-field').click();
    await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('filter-select-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();

    // 设置字段
    await updateRecordNode.addFieldsButton.click();
    await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-CollectionFieldset-workflows-Fields values').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await updateRecordNode.submitButton.click();
    await page.getByRole('link', { name: 'Workflow' }).click();
    await workflowListRecords.editAction.click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    await editWorkFlow.statusIsOn.check();
    await editWorkFlow.submitButton.click();

    // 配置更新数据节点的数据表页面，查看更新前数据
    const updateNodeCollectionPage = mockPage();
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${updateNodeCollectionDisplayName}`).click();
    await page.mouse.move(300, 0);
    await page.getByText('Configure columns').hover();
    await page.getByText(updateNodeFieldDisplayName).click();
    await page.mouse.move(300, 0);
    const updayteRecordNodefieldData = dayjs().format('YYYY-MM-DD');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString())).not.toBeVisible();

    //配置新增数据触发工作流页面
    const addDataTriggerWorkflowPage = mockPage();
    await addDataTriggerWorkflowPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

    await page.mouse.move(300, 0);

        // 2、测试步骤：录入数据触发工作流
    const addDataTriggerWorkflowPagefieldData = updayteRecordNodefieldData;
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
    // 配置更新数据节点的数据表页面，查看更新后数据
    await updateNodeCollectionPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(updateNodeCollectionRecordOne.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordTwo.toString())).not.toBeVisible();
    await expect(page.getByText(updateNodeCollectionRecordThree.toString())).not.toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).first()).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(1)).toBeVisible();
    await expect(page.getByText(updayteRecordNodefieldData.toString()).nth(2)).toBeVisible();

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Update record-${updateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
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
});
test.describe('delete data node', () => { 
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
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
      .getByLabel('textarea')
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
});
test.describe('aggregate node,Datasheet data', () => { 
  test('Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised COUNT', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const aggregateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised COUNT';

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
    const aggregateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + aggregateNodeAppendText;
    const aggregateNodeCollectionName = e2eJsonCollectionName + aggregateNodeAppendText;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), aggregateNodeAppendText).collections);

    const aggregateNodeCollectionData = [{staffnum:3,regcapital:3.12},{staffnum:3,regcapital:3.6},{staffnum:4,regcapital:4.6},{staffnum:4,regcapital:4.6},{staffnum:5,regcapital:5.6}];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Aggregate-Aggregate', { exact: true })
      .getByLabel('textarea')
      .fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByText(aggregateNodeCollectionDisplayName).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.submitButton.click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Aggregate-${aggregateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // 判断字符串包含createRecordNodefieldData
    expect(nodeResultString).toContain(aggregateNodeCollectionData.length.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised SUM', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const aggregateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised SUM';

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
    const aggregateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + aggregateNodeAppendText;
    const aggregateNodeCollectionName = e2eJsonCollectionName + aggregateNodeAppendText;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), aggregateNodeAppendText).collections);

    const aggregateNodeCollectionData = [{staffnum:3,regcapital:3.12},{staffnum:3,regcapital:3.6},{staffnum:4,regcapital:4.6},{staffnum:4,regcapital:4.6},{staffnum:5,regcapital:5.6}];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Aggregate-Aggregate', { exact: true })
      .getByLabel('textarea')
      .fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.sumRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByText(aggregateNodeCollectionDisplayName).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.submitButton.click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Aggregate-${aggregateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // aggregateNodeCollectionData中staffnum字段值总和
    const aggregateNodeCollectionDataSum = aggregateNodeCollectionData.reduce((total, currentValue) => {
      return total + currentValue.staffnum;
    }, 0);
    expect(nodeResultString).toContain(aggregateNodeCollectionDataSum.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised AVG', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const aggregateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised AVG';

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
    const aggregateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + aggregateNodeAppendText;
    const aggregateNodeCollectionName = e2eJsonCollectionName + aggregateNodeAppendText;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), aggregateNodeAppendText).collections);

    const aggregateNodeCollectionData = [{staffnum:3,regcapital:3.12},{staffnum:3,regcapital:3.6},{staffnum:4,regcapital:4.6},{staffnum:4,regcapital:4.6},{staffnum:5,regcapital:5.6}];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Aggregate-Aggregate', { exact: true })
      .getByLabel('textarea')
      .fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.avgRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByText(aggregateNodeCollectionDisplayName).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.submitButton.click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Aggregate-${aggregateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // aggregateNodeCollectionData中staffnum字段值总和
    const aggregateNodeCollectionDataSum = aggregateNodeCollectionData.reduce((total, currentValue) => {
      return total + currentValue.staffnum;
    }, 0);
    const aggregateNodeCollectionDataAvg = aggregateNodeCollectionDataSum / aggregateNodeCollectionData.length;
    expect(nodeResultString).toContain(aggregateNodeCollectionDataAvg.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised MIN', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const aggregateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised MIN';

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
    const aggregateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + aggregateNodeAppendText;
    const aggregateNodeCollectionName = e2eJsonCollectionName + aggregateNodeAppendText;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), aggregateNodeAppendText).collections);

    const aggregateNodeCollectionData = [{staffnum:3,regcapital:3.12},{staffnum:3,regcapital:3.6},{staffnum:4,regcapital:4.6},{staffnum:4,regcapital:4.6},{staffnum:5,regcapital:5.6}];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Aggregate-Aggregate', { exact: true })
      .getByLabel('textarea')
      .fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.minRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByText(aggregateNodeCollectionDisplayName).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.submitButton.click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Aggregate-${aggregateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // aggregateNodeCollectionData中staffnum字段最小值
    const aggregateNodeCollectionDataMin = aggregateNodeCollectionData.reduce((min, currentValue) => {
      return currentValue.staffnum < min ? currentValue.staffnum : min;
    }, aggregateNodeCollectionData[0].staffnum);
    expect(nodeResultString).toContain(aggregateNodeCollectionDataMin.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised MAX', async ({
    page,
    mockCollections,
    mockRecords,
    mockPage,
  }) => {
    //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
    const triggerNodeAppendText = faker.lorem.word(4);
    const aggregateNodeAppendText = faker.lorem.word(4);
    //用例标题
    const caseTitle =
      'Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised MAX';

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
    const aggregateNodeCollectionDisplayName = e2eJsonCollectionDisplayName + aggregateNodeAppendText;
    const aggregateNodeCollectionName = e2eJsonCollectionName + aggregateNodeAppendText;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), aggregateNodeAppendText).collections);

    const aggregateNodeCollectionData = [{staffnum:3,regcapital:3.12},{staffnum:3,regcapital:3.6},{staffnum:4,regcapital:4.6},{staffnum:4,regcapital:4.6},{staffnum:5,regcapital:5.6}];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Aggregate-Aggregate', { exact: true })
      .getByLabel('textarea')
      .fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.maxRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByText(aggregateNodeCollectionDisplayName).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.submitButton.click();

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
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel(`dataBlocks-table-${triggerNodeCollectionDisplayName}`).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByLabel('Enable actions-Add new').click();
    await expect(page.getByLabel('Enable actions-Add new').getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByLabel('Data blocks-Form').click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByLabel('Enable actions-Submit').click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('button', { name: `Display collection fields-${triggerNodeFieldDisplayName}` }).click();

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
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`Aggregate-${aggregateRecordNodeName}`).getByRole('button', { name: 'check' }).click();
    await page.waitForLoadState('networkidle');
    //获取page.getByLabel('block-item-Input.JSON-executions-Node result')元素中字符串
    const nodeResult = await page.getByLabel('block-item-Input.JSON-executions-Node result').innerText();
    const nodeResultString = nodeResult.replace(/\s+/g, '').replace('Noderesult:', '');
    // aggregateNodeCollectionData中staffnum字段最大值
    const aggregateNodeCollectionDataMax = aggregateNodeCollectionData.reduce((max, currentValue) => {
      return currentValue.staffnum > max ? currentValue.staffnum : max;
    }, aggregateNodeCollectionData[0].staffnum);
    expect(nodeResultString).toContain(aggregateNodeCollectionDataMax.toString());
    await page.getByLabel('Close', { exact: true }).click();

    // 4、后置处理：删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await workflowListRecords.deleteAction.click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});
test.describe('aggregate node,Linked Data Table Data', () => { 
  
});
test.describe('SQL node', () => { });
