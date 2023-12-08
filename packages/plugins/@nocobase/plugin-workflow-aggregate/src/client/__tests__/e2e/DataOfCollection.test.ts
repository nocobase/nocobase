import { CreateWorkFlow, EditWorkFlow, WorkflowManagement, WorkflowListRecords } from '@nocobase/plugin-workflow-test';
import { e2e_GeneralFormsTable, appendJsonCollectionName } from '@nocobase/plugin-workflow-test';
import { CollectionTriggerNode,AggregateNode } from '@nocobase/plugin-workflow-test';
import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';

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
      .getByRole('textbox')
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
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

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
      .getByRole('textbox')
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
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

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
      .getByRole('textbox')
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
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

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
      .getByRole('textbox')
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
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

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
      .getByRole('textbox')
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
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}`}).click();

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