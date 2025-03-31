/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { faker } from '@faker-js/faker';
import {
  CollectionTriggerNode,
  ManualNode,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiFilterList,
  apiGetDataSourceCount,
  apiGetWorkflow,
  apiGetWorkflowNodeExecutions,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test.describe('field data update', () => {
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
    await page.waitForLoadState('load');
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
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).click();
    await page.getByRole('menuitem', { name: 'Filter settings' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'exists', exact: true }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-title').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('load');

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page.locator('.itemCss', { hasText: manualNodeName }).getByLabel('action-Action.Link-View-view-').click();
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
    await page.waitForLoadState('load');
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
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).click();
    await page.getByRole('menuitem', { name: 'Filter settings' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'exists', exact: true }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-title').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('load');

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page.locator('.itemCss', { hasText: manualNodeName }).getByLabel('action-Action.Link-View-view-').click();
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
    await page.waitForLoadState('load');
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
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).click();
    await page.getByRole('menuitem', { name: 'Filter settings' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'exists', exact: true }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${manualNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-title').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${manualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: manualNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('load');

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page.locator('.itemCss', { hasText: manualNodeName }).getByLabel('action-Action.Link-View-view-').click();
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
