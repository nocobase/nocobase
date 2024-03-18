import { faker } from '@faker-js/faker';
import {
  CollectionTriggerNode,
  ManualNode,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiFilterList,
  apiGetWorkflow,
  apiGetWorkflowNodeExecutions,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
  apiGetDataSourceCount,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test.describe('block configuration', () => {});

test.describe('field configuration', () => {});

test.describe('field data update', () => {
  test('Collection event to add a data trigger, update single-line text data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'orgname';
    const manualNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const manualNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '2', staffnum: 20 }];
    const manualNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '3', staffnum: 30 }];
    const manualNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '4', staffnum: 40 }];
    const manualNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '5', staffnum: 10 }];
    const manualNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '6', staffnum: 20 }];
    const manualNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '7', staffnum: 30 }];
    const manualNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '8', staffnum: 40 }];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    const manualNodeRecord = manualNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(manualNodeRecord);
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasOrgname = Object.values(manualNodeJobResult).some(
      (value) => (value as { orgname: string }).orgname === manualNodeRecord,
    );
    expect(hasOrgname).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"orgname":{"$eq":"${manualNodeRecord}"}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update multi-line text data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'address';
    const manualNodeFieldDisplayName = '公司地址(多行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [{ address: '公司地址(多行文本)1', status_singleselect: '1', staffnum: 10 }];
    const manualNodeCollectioRecordTwo = [{ address: '公司地址(多行文本)2', status_singleselect: '2', staffnum: 20 }];
    const manualNodeCollectioRecordThree = [{ address: '公司地址(多行文本)3', status_singleselect: '3', staffnum: 30 }];
    const manualNodeCollectioRecordFour = [{ address: '公司地址(多行文本)4', status_singleselect: '4', staffnum: 40 }];
    const manualNodeCollectioRecordFive = [{ address: '公司地址(多行文本)5', status_singleselect: '5', staffnum: 10 }];
    const manualNodeCollectioRecordSix = [{ address: '公司地址(多行文本)6', status_singleselect: '6', staffnum: 20 }];
    const manualNodeCollectioRecordSeven = [{ address: '公司地址(多行文本)7', status_singleselect: '7', staffnum: 30 }];
    const manualNodeCollectioRecordEight = [{ address: '公司地址(多行文本)8', status_singleselect: '8', staffnum: 40 }];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    const manualNodeRecord = manualNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(manualNodeRecord);
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasAddress = Object.values(manualNodeJobResult).some(
      (value) => (value as { address: string }).address === manualNodeRecord,
    );
    expect(hasAddress).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"address":{"$eq":"${manualNodeRecord}"}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update mobile phone number data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'phone';
    const manualNodeFieldDisplayName = '负责人电话(手机号码)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [{ phone: '负责人电话(手机号码)1', status_singleselect: '1', staffnum: 10 }];
    const manualNodeCollectioRecordTwo = [{ phone: '负责人电话(手机号码)2', status_singleselect: '2', staffnum: 20 }];
    const manualNodeCollectioRecordThree = [{ phone: '负责人电话(手机号码)3', status_singleselect: '3', staffnum: 30 }];
    const manualNodeCollectioRecordFour = [{ phone: '负责人电话(手机号码)4', status_singleselect: '4', staffnum: 40 }];
    const manualNodeCollectioRecordFive = [{ phone: '负责人电话(手机号码)5', status_singleselect: '5', staffnum: 10 }];
    const manualNodeCollectioRecordSix = [{ phone: '负责人电话(手机号码)6', status_singleselect: '6', staffnum: 20 }];
    const manualNodeCollectioRecordSeven = [{ phone: '负责人电话(手机号码)7', status_singleselect: '7', staffnum: 30 }];
    const manualNodeCollectioRecordEight = [{ phone: '负责人电话(手机号码)8', status_singleselect: '8', staffnum: 40 }];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    const manualNodeRecord = manualNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(manualNodeRecord);
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasPhone = Object.values(manualNodeJobResult).some(
      (value) => (value as { phone: string }).phone === manualNodeRecord,
    );
    expect(hasPhone).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"phone":{"$eq":"${manualNodeRecord}"}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update Email Data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'email';
    const manualNodeFieldDisplayName = '电子邮箱(电子邮箱)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [{ email: '1@1.com', status_singleselect: '1', staffnum: 10 }];
    const manualNodeCollectioRecordTwo = [{ email: '2@2.com', status_singleselect: '2', staffnum: 20 }];
    const manualNodeCollectioRecordThree = [{ email: '3@3.com', status_singleselect: '3', staffnum: 30 }];
    const manualNodeCollectioRecordFour = [{ email: '4@4.com', status_singleselect: '4', staffnum: 40 }];
    const manualNodeCollectioRecordFive = [{ email: '5@5.com', status_singleselect: '5', staffnum: 10 }];
    const manualNodeCollectioRecordSix = [{ email: '6@6.com', status_singleselect: '6', staffnum: 20 }];
    const manualNodeCollectioRecordSeven = [{ email: '7@7.com', status_singleselect: '7', staffnum: 30 }];
    const manualNodeCollectioRecordEight = [{ email: '8@8.com', status_singleselect: '8', staffnum: 40 }];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    const manualNodeRecord = faker.internet.email();
    await page.getByRole('textbox').fill(manualNodeRecord);
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasEmail = Object.values(manualNodeJobResult).some(
      (value) => (value as { email: string }).email === manualNodeRecord,
    );
    expect(hasEmail).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"email":{"$eq":"${manualNodeRecord}"}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update integer data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'staffnum';
    const manualNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const manualNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '2', staffnum: 20 }];
    const manualNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '3', staffnum: 30 }];
    const manualNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '4', staffnum: 40 }];
    const manualNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '5', staffnum: 10 }];
    const manualNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '6', staffnum: 20 }];
    const manualNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '7', staffnum: 30 }];
    const manualNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '8', staffnum: 40 }];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    const manualNodeRecord = faker.number.int();
    await page.getByRole('spinbutton').fill(manualNodeRecord.toString());
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasStaffnum = Object.values(manualNodeJobResult).some(
      (value) => (value as { staffnum: number }).staffnum === manualNodeRecord,
    );
    expect(hasStaffnum).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"staffnum":{"$eq":"${manualNodeRecord}"}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update number data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'regcapital';
    const manualNodeFieldDisplayName = '注册资本(数字)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const manualNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '2', staffnum: 20 }];
    const manualNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '3', staffnum: 30 }];
    const manualNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '4', staffnum: 40 }];
    const manualNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '5', staffnum: 10 }];
    const manualNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '6', staffnum: 20 }];
    const manualNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '7', staffnum: 30 }];
    const manualNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '8', staffnum: 40 }];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    const manualNodeRecord = faker.number.float();
    await page.getByRole('spinbutton').fill(manualNodeRecord.toString());
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasRegcapital = Object.values(manualNodeJobResult).some(
      (value) => (value as { regcapital: number }).regcapital === manualNodeRecord,
    );
    expect(hasRegcapital).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"regcapital":{"$eq":"${manualNodeRecord}"}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update percentage data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'insuranceratio';
    const manualNodeFieldDisplayName = '参保占比(百分比)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [
      { orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10, insuranceratio: 1.11 },
    ];
    const manualNodeCollectioRecordTwo = [
      { orgname: '公司名称(单行文本)2', status_singleselect: '2', staffnum: 20, insuranceratio: 2.22 },
    ];
    const manualNodeCollectioRecordThree = [
      { orgname: '公司名称(单行文本)3', status_singleselect: '3', staffnum: 30, insuranceratio: 3.33 },
    ];
    const manualNodeCollectioRecordFour = [
      { orgname: '公司名称(单行文本)4', status_singleselect: '4', staffnum: 40, insuranceratio: 4.44 },
    ];
    const manualNodeCollectioRecordFive = [
      { orgname: '公司名称(单行文本)5', status_singleselect: '5', staffnum: 10, insuranceratio: 1.11 },
    ];
    const manualNodeCollectioRecordSix = [
      { orgname: '公司名称(单行文本)6', status_singleselect: '6', staffnum: 20, insuranceratio: 2.22 },
    ];
    const manualNodeCollectioRecordSeven = [
      { orgname: '公司名称(单行文本)7', status_singleselect: '7', staffnum: 30, insuranceratio: 3.33 },
    ];
    const manualNodeCollectioRecordEight = [
      { orgname: '公司名称(单行文本)8', status_singleselect: '8', staffnum: 40, insuranceratio: 4.44 },
    ];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    const manualNodeRecord = faker.number.float({ min: 0, max: 100, precision: 2 });
    await page.getByRole('spinbutton').fill(manualNodeRecord.toString());
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasRegcapital = Object.values(manualNodeJobResult).some(
      (value) => (value as { insuranceratio: number }).insuranceratio === manualNodeRecord / 100,
    );
    expect(hasRegcapital).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"insuranceratio":{"$eq":"${manualNodeRecord / 100}"}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update checkbox data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'isenable';
    const manualNodeFieldDisplayName = '是否启用(勾选)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [
      { orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordTwo = [
      { orgname: '公司名称(单行文本)2', status_singleselect: '2', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordThree = [
      { orgname: '公司名称(单行文本)3', status_singleselect: '3', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordFour = [
      { orgname: '公司名称(单行文本)4', status_singleselect: '4', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    const manualNodeCollectioRecordFive = [
      { orgname: '公司名称(单行文本)5', status_singleselect: '5', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordSix = [
      { orgname: '公司名称(单行文本)6', status_singleselect: '6', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordSeven = [
      { orgname: '公司名称(单行文本)7', status_singleselect: '7', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordEight = [
      { orgname: '公司名称(单行文本)8', status_singleselect: '8', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    // const manualNodeRecord = faker.number.float({ min: 0, max: 100, precision: 2 });
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasIsenable = Object.values(manualNodeJobResult).some(
      (value) => (value as { isenable: boolean }).isenable === true,
    );
    expect(hasIsenable).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"isenable":{"$eq":true}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update single select data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'status_singleselect';
    const manualNodeFieldDisplayName = '公司状态(下拉单选)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [
      { orgname: '公司名称(单行文本)1', status_singleselect: '2', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordTwo = [
      { orgname: '公司名称(单行文本)2', status_singleselect: '2', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordThree = [
      { orgname: '公司名称(单行文本)3', status_singleselect: '3', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordFour = [
      { orgname: '公司名称(单行文本)4', status_singleselect: '4', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    const manualNodeCollectioRecordFive = [
      { orgname: '公司名称(单行文本)5', status_singleselect: '5', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordSix = [
      { orgname: '公司名称(单行文本)6', status_singleselect: '6', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordSeven = [
      { orgname: '公司名称(单行文本)7', status_singleselect: '7', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordEight = [
      { orgname: '公司名称(单行文本)8', status_singleselect: '8', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    // const manualNodeRecord = faker.number.float({ min: 0, max: 100, precision: 2 });
    await page.getByTestId('select-single').click();
    await page.getByRole('option', { name: '存续' }).click();
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasIsenable = Object.values(manualNodeJobResult).some(
      (value) => (value as { status_singleselect: string }).status_singleselect === '1',
    );
    expect(hasIsenable).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"status_singleselect":{"$eq":"1"}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update multiple select data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'range_multipleselect';
    const manualNodeFieldDisplayName = '经营范围(下拉多选)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [
      { orgname: '公司名称(单行文本)1', status_singleselect: '2', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordTwo = [
      { orgname: '公司名称(单行文本)2', status_singleselect: '2', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordThree = [
      { orgname: '公司名称(单行文本)3', status_singleselect: '3', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordFour = [
      { orgname: '公司名称(单行文本)4', status_singleselect: '4', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    const manualNodeCollectioRecordFive = [
      { orgname: '公司名称(单行文本)5', status_singleselect: '5', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordSix = [
      { orgname: '公司名称(单行文本)6', status_singleselect: '6', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordSeven = [
      { orgname: '公司名称(单行文本)7', status_singleselect: '7', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordEight = [
      { orgname: '公司名称(单行文本)8', status_singleselect: '8', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    // const manualNodeRecord = faker.number.float({ min: 0, max: 100, precision: 2 });
    await page.getByTestId('select-multiple').click();
    await page.getByRole('option', { name: '软件销售', exact: true }).click();
    await page.getByRole('option', { name: '软件开发', exact: true }).click();
    await page.getByTestId('select-multiple').click();
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    let resultFieldValue = '';
    const expectFieldValue = ['F3134', 'I3006'];
    for (const key in manualNodeJobResult) {
      if (Object.prototype.hasOwnProperty.call(manualNodeJobResult[key], 'range_multipleselect')) {
        resultFieldValue = manualNodeJobResult[key]['range_multipleselect'];
        break;
      }
    }
    const isEqual = JSON.stringify(resultFieldValue) === JSON.stringify(expectFieldValue);
    expect(isEqual).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"range_multipleselect":{"$match":["F3134","I3006"]}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update radio group data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'status_radio';
    const manualNodeFieldDisplayName = '公司状态(单选)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [
      { orgname: '公司名称(单行文本)1', status_singleselect: '2', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordTwo = [
      { orgname: '公司名称(单行文本)2', status_singleselect: '2', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordThree = [
      { orgname: '公司名称(单行文本)3', status_singleselect: '3', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordFour = [
      { orgname: '公司名称(单行文本)4', status_singleselect: '4', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    const manualNodeCollectioRecordFive = [
      { orgname: '公司名称(单行文本)5', status_singleselect: '5', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordSix = [
      { orgname: '公司名称(单行文本)6', status_singleselect: '6', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordSeven = [
      { orgname: '公司名称(单行文本)7', status_singleselect: '7', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordEight = [
      { orgname: '公司名称(单行文本)8', status_singleselect: '8', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    // const manualNodeRecord = faker.number.float({ min: 0, max: 100, precision: 2 });
    await page.getByLabel('存续').check();
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasIsenable = Object.values(manualNodeJobResult).some(
      (value) => (value as { status_radio: string }).status_radio === '1',
    );
    expect(hasIsenable).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"status_radio":{"$eq":"1"}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update checkbox group data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'range_check';
    const manualNodeFieldDisplayName = '经营范围(复选)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [
      { orgname: '公司名称(单行文本)1', status_singleselect: '2', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordTwo = [
      { orgname: '公司名称(单行文本)2', status_singleselect: '2', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordThree = [
      { orgname: '公司名称(单行文本)3', status_singleselect: '3', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordFour = [
      { orgname: '公司名称(单行文本)4', status_singleselect: '4', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    const manualNodeCollectioRecordFive = [
      { orgname: '公司名称(单行文本)5', status_singleselect: '5', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordSix = [
      { orgname: '公司名称(单行文本)6', status_singleselect: '6', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordSeven = [
      { orgname: '公司名称(单行文本)7', status_singleselect: '7', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordEight = [
      { orgname: '公司名称(单行文本)8', status_singleselect: '8', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    await page.getByLabel('软件销售', { exact: true }).check();
    await page.getByLabel('软件开发', { exact: true }).check();
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    let resultFieldValue = '';
    const expectFieldValue = ['F3134', 'I3006'];
    for (const key in manualNodeJobResult) {
      if (Object.prototype.hasOwnProperty.call(manualNodeJobResult[key], 'range_check')) {
        resultFieldValue = manualNodeJobResult[key]['range_check'];
        break;
      }
    }
    const isEqual = JSON.stringify(resultFieldValue) === JSON.stringify(expectFieldValue);
    expect(isEqual).toBe(true);

    const filter = `pageSize=20&page=1&filter={"$and":[{"range_check":{"$match":["F3134","I3006"]}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, update datetime data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'establishdate';
    const manualNodeFieldDisplayName = '成立日期(日期)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
        .collections,
    );
    const manualNodeCollectioRecordOne = [
      { orgname: '公司名称(单行文本)1', status_singleselect: '2', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordTwo = [
      { orgname: '公司名称(单行文本)2', status_singleselect: '2', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordThree = [
      { orgname: '公司名称(单行文本)3', status_singleselect: '3', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordFour = [
      { orgname: '公司名称(单行文本)4', status_singleselect: '4', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    const manualNodeCollectioRecordFive = [
      { orgname: '公司名称(单行文本)5', status_singleselect: '5', staffnum: 10, insuranceratio: 1.11, isenable: false },
    ];
    const manualNodeCollectioRecordSix = [
      { orgname: '公司名称(单行文本)6', status_singleselect: '6', staffnum: 20, insuranceratio: 2.22, isenable: false },
    ];
    const manualNodeCollectioRecordSeven = [
      { orgname: '公司名称(单行文本)7', status_singleselect: '7', staffnum: 30, insuranceratio: 3.33, isenable: false },
    ];
    const manualNodeCollectioRecordEight = [
      { orgname: '公司名称(单行文本)8', status_singleselect: '8', staffnum: 40, insuranceratio: 4.44, isenable: false },
    ];
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordOne);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordTwo);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordThree);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFour);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordFive);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSix);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordSeven);
    await mockRecords(manualNodeCollectionName, manualNodeCollectioRecordEight);
    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = {
      config: { appends: [], collection: triggerNodeCollectionName, changed: [], condition: { $and: [] }, mode: 1 },
    };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.updateRecordFormMenu.hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: manualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Edit block title').getByRole('textbox').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('networkidle');

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page
      .locator(`//td[span[text()="${manualNodeName}"]]`)
      .locator('xpath=preceding-sibling::td[1]')
      .locator('text=View')
      .click();
    const manualNodeRecord = dayjs().format('YYYY-MM-DD');
    await page.getByPlaceholder('Select date').click();
    await page.getByTitle(manualNodeRecord.toString()).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    let resultFieldValue = '';
    for (const key in manualNodeJobResult) {
      if (Object.prototype.hasOwnProperty.call(manualNodeJobResult[key], 'establishdate')) {
        resultFieldValue = manualNodeJobResult[key]['establishdate'];
        break;
      }
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeWithTimeZone = now.toLocaleString('en-US', { timeZone: timeZone });
    // 转换为0时区的时间
    const timeInUTC = new Date(timeWithTimeZone).toISOString();

    const filter = `pageSize=20&page=1&filter={"$and":[{"establishdate":{"$eq":"${timeInUTC}"}}]}`;
    const createNodeCollectionData = await apiFilterList(manualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('relation field data update', () => {});

test.describe('action button', () => {});
