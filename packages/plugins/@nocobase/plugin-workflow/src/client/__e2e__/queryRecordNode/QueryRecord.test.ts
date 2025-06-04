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
  QueryRecordNode,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiGetWorkflowNodeExecutions,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test('Collection event add data trigger, no filter no sort query common table 1 record', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

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

  //配置查询节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'query', exact: true }).click();
  const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Query record-Query record', { exact: true }).getByRole('textbox').fill(queryRecordNodeName);
  const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
  const queryRecordNodeId = await queryRecordNode.node.locator('.workflow-node-id').innerText();
  await queryRecordNode.nodeConfigure.click();
  await queryRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
  await queryRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据查询成功
  const getWorkflow = await apiGetWorkflow(workflowId);
  const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
  const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
  expect(getWorkflowExecuted).toBe(1);
  const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
  const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
  getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
    return b.id - a.id;
  });
  const jobs = getWorkflowNodeExecutionsObj[0].jobs;
  const queryRecordNodeJob = jobs.find((job) => job.nodeId.toString() === queryRecordNodeId);
  const queryRecordNodeJobResult = queryRecordNodeJob.result;
  expect(queryRecordNodeJobResult.orgname).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, no filtering and no sorting, query common table multiple records, set page 1 20 per page', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, triggerNodeCollectionRecordNumber);
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

  //配置查询节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'query', exact: true }).click();
  const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Query record-Query record', { exact: true }).getByRole('textbox').fill(queryRecordNodeName);
  const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
  const queryRecordNodeId = await queryRecordNode.node.locator('.workflow-node-id').innerText();
  await queryRecordNode.nodeConfigure.click();
  await queryRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
  await queryRecordNode.multipleRecordsRadioButton.check();
  await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
  await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
  await queryRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据查询成功
  const getWorkflow = await apiGetWorkflow(workflowId);
  const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
  const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
  expect(getWorkflowExecuted).toBe(1);
  const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
  const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
  getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
    return b.id - a.id;
  });
  const jobs = getWorkflowNodeExecutionsObj[0].jobs;
  const queryRecordNodeJob = jobs.find((job) => job.nodeId.toString() === queryRecordNodeId);
  const queryRecordNodeJobResult = queryRecordNodeJob.result;
  expect(queryRecordNodeJobResult.length).toBe(triggerNodeCollectionRecordNumber + 1);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, no filter ID ascending, query common table with multiple records, set page X to Y per page', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, triggerNodeCollectionRecordNumber);
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

  //配置查询节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'query', exact: true }).click();
  const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Query record-Query record', { exact: true }).getByRole('textbox').fill(queryRecordNodeName);
  const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
  const queryRecordNodeId = await queryRecordNode.node.locator('.workflow-node-id').innerText();
  await queryRecordNode.nodeConfigure.click();
  await queryRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
  await queryRecordNode.multipleRecordsRadioButton.check();
  // 设置排序条件
  await queryRecordNode.addSortFieldsButton.click();
  await page.getByTestId('select-single').click();
  await page.getByRole('option', { name: 'ID', exact: true }).click();
  await page.getByLabel('block-item-Radio.Group-workflows').getByText('ASC').click();
  await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
  await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
  const pageNumber = faker.number.int({ min: 1, max: 5 });
  const pageSize = faker.number.int({ min: 1, max: 4 });
  await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
  await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
  await queryRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据查询成功
  const getWorkflow = await apiGetWorkflow(workflowId);
  const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
  const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
  expect(getWorkflowExecuted).toBe(1);
  const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
  const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
  getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
    return b.id - a.id;
  });
  const jobs = getWorkflowNodeExecutionsObj[0].jobs;
  const queryRecordNodeJob = jobs.find((job) => job.nodeId.toString() === queryRecordNodeId);
  const queryRecordNodeJobResult = queryRecordNodeJob.result;
  let nodeResultRecords = 0;
  const recordCount = triggerNodeCollectionRecordNumber + 1;
  if (pageNumber > Math.ceil(recordCount / pageSize)) {
    nodeResultRecords = 0;
    expect(queryRecordNodeJobResult).toEqual([]);
  } else if (pageNumber * pageSize > recordCount) {
    nodeResultRecords = recordCount - (pageNumber - 1) * pageSize;
    expect(queryRecordNodeJobResult.length).toBe(nodeResultRecords);
    // 获取数组中对象下ID的值
    const nodeResultRecordsIDArray = queryRecordNodeJobResult.map((obj) => obj.id);
    // 断言数组的最小值等于（页码-1）*每页记录数+1
    expect(Math.min(...nodeResultRecordsIDArray)).toBe((pageNumber - 1) * pageSize + 1);
    // 断言数组的最大值等于总记录数
    expect(Math.max(...nodeResultRecordsIDArray)).toBe(recordCount);
  } else {
    nodeResultRecords = pageSize;
    expect(queryRecordNodeJobResult.length).toBe(nodeResultRecords);
    const nodeResultRecordsIDArray = queryRecordNodeJobResult.map((obj) => obj.id);
    // 断言数组的最小值等于（页码-1）*每页记录数+1
    expect(Math.min(...nodeResultRecordsIDArray)).toBe((pageNumber - 1) * pageSize + 1);
    // 断言数组的最大值等于pageNumber * pageSize
    expect(Math.max(...nodeResultRecordsIDArray)).toBe(pageNumber * pageSize);
  }
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, no filter ID descending, query common table with multiple records, set page X to Y per page', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, triggerNodeCollectionRecordNumber);
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
  //配置查询节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'query', exact: true }).click();
  const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Query record-Query record', { exact: true }).getByRole('textbox').fill(queryRecordNodeName);
  const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
  const queryRecordNodeId = await queryRecordNode.node.locator('.workflow-node-id').innerText();
  await queryRecordNode.nodeConfigure.click();
  await queryRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
  await queryRecordNode.multipleRecordsRadioButton.check();
  // 设置排序条件
  await queryRecordNode.addSortFieldsButton.click();
  await page.getByTestId('select-single').click();
  await page.getByRole('option', { name: 'ID', exact: true }).click();
  await page.getByLabel('block-item-Radio.Group-workflows').getByText('DESC').click();
  await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
  await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
  const pageNumber = faker.number.int({ min: 1, max: 5 });
  const pageSize = faker.number.int({ min: 1, max: 4 });
  await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
  await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
  await queryRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据查询成功
  const getWorkflow = await apiGetWorkflow(workflowId);
  const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
  const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
  expect(getWorkflowExecuted).toBe(1);
  const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
  const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
  getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
    return b.id - a.id;
  });
  const jobs = getWorkflowNodeExecutionsObj[0].jobs;
  const queryRecordNodeJob = jobs.find((job) => job.nodeId.toString() === queryRecordNodeId);
  const queryRecordNodeJobResult = queryRecordNodeJob.result;
  let nodeResultRecords = 0;
  const recordCount = triggerNodeCollectionRecordNumber + 1;
  if (pageNumber > Math.ceil(recordCount / pageSize)) {
    nodeResultRecords = 0;
    expect(queryRecordNodeJobResult).toEqual([]);
  } else if (pageNumber * pageSize > recordCount) {
    nodeResultRecords = recordCount - (pageNumber - 1) * pageSize;
    expect(queryRecordNodeJobResult.length).toBe(nodeResultRecords);
    // 获取数组中对象下ID的值
    const nodeResultRecordsIDArray = queryRecordNodeJobResult.map((obj) => obj.id);
    // 断言数组的最小值等于1
    expect(Math.min(...nodeResultRecordsIDArray)).toBe(1);
    // 断言数组的最大值等于总记录数
    expect(Math.max(...nodeResultRecordsIDArray)).toBe(nodeResultRecords);
  } else {
    nodeResultRecords = pageSize;
    expect(queryRecordNodeJobResult.length).toBe(nodeResultRecords);
    const nodeResultRecordsIDArray = queryRecordNodeJobResult.map((obj) => obj.id);
    // 断言数组的最小值等于（页码-1）*每页记录数+1
    expect(Math.min(...nodeResultRecordsIDArray)).toBe(recordCount - pageNumber * pageSize + 1);
    // 断言数组的最大值等于pageNumber * pageSize
    expect(Math.max(...nodeResultRecordsIDArray)).toBe(recordCount - (pageNumber - 1) * pageSize);
  }
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, no filtering and no sorting, query multiple records of a common table, set page X to Y per page', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, triggerNodeCollectionRecordNumber);
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

  //配置查询节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'query', exact: true }).click();
  const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Query record-Query record', { exact: true }).getByRole('textbox').fill(queryRecordNodeName);
  const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
  const queryRecordNodeId = await queryRecordNode.node.locator('.workflow-node-id').innerText();
  await queryRecordNode.nodeConfigure.click();
  await queryRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
  await queryRecordNode.multipleRecordsRadioButton.check();
  await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
  await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
  const pageNumber = faker.number.int({ min: 1, max: 5 });
  const pageSize = faker.number.int({ min: 1, max: 4 });
  await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
  await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
  await queryRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据查询成功
  const getWorkflow = await apiGetWorkflow(workflowId);
  const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
  const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
  expect(getWorkflowExecuted).toBe(1);
  const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
  const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
  getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
    return b.id - a.id;
  });
  const jobs = getWorkflowNodeExecutionsObj[0].jobs;
  const queryRecordNodeJob = jobs.find((job) => job.nodeId.toString() === queryRecordNodeId);
  const queryRecordNodeJobResult = queryRecordNodeJob.result;
  let nodeResultRecords = 0;
  const recordCount = triggerNodeCollectionRecordNumber + 1;
  if (pageNumber > Math.ceil(recordCount / pageSize)) {
    nodeResultRecords = 0;
    expect(queryRecordNodeJobResult).toEqual([]);
  } else if (pageNumber * pageSize > recordCount) {
    nodeResultRecords = recordCount - (pageNumber - 1) * pageSize;
    expect(queryRecordNodeJobResult.length).toBe(nodeResultRecords);
    // 获取数组中对象下ID的值
    const nodeResultRecordsIDArray = queryRecordNodeJobResult.map((obj) => obj.id);
    // 断言数组的最小值等于（页码-1）*每页记录数+1
    expect(Math.min(...nodeResultRecordsIDArray)).toBe((pageNumber - 1) * pageSize + 1);
    // 断言数组的最大值等于总记录数
    expect(Math.max(...nodeResultRecordsIDArray)).toBe(recordCount);
  } else {
    nodeResultRecords = pageSize;
    expect(queryRecordNodeJobResult.length).toBe(nodeResultRecords);
    const nodeResultRecordsIDArray = queryRecordNodeJobResult.map((obj) => obj.id);
    // 断言数组的最小值等于（页码-1）*每页记录数+1
    expect(Math.min(...nodeResultRecordsIDArray)).toBe((pageNumber - 1) * pageSize + 1);
    // 断言数组的最大值等于pageNumber * pageSize
    expect(Math.max(...nodeResultRecordsIDArray)).toBe(pageNumber * pageSize);
  }
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, no filtering and no sorting, query the ordinary table 1 record, set the X page Y per page, query the results of the empty, exit the process', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, triggerNodeCollectionRecordNumber);
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
  //配置查询节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'query', exact: true }).click();
  const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Query record-Query record', { exact: true }).getByRole('textbox').fill(queryRecordNodeName);
  const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
  const queryRecordNodeId = await queryRecordNode.node.locator('.workflow-node-id').innerText();
  await queryRecordNode.nodeConfigure.click();
  await queryRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
  // await queryRecordNode.multipleRecordsRadioButton.check();
  await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
  await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
  const pageNumber = faker.number.int({ min: 5, max: 5 });
  const pageSize = faker.number.int({ min: 5, max: 5 });
  await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
  await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
  await queryRecordNode.exitProcessOptionsBoxWithEmptyResult.check();
  await expect(queryRecordNode.exitProcessOptionsBoxWithEmptyResult).toBeChecked();
  await queryRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
  await page.waitForTimeout(1000);
  // 3、预期结果：工作流成功触发,数据查询成功
  const getWorkflow = await apiGetWorkflow(workflowId);
  const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
  const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
  expect(getWorkflowExecuted).toBe(1);
  const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
  const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
  getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
    return b.id - a.id;
  });
  const jobs = getWorkflowNodeExecutionsObj[0].jobs;
  const queryRecordNodeJob = jobs.find((job) => job.nodeId.toString() === queryRecordNodeId);
  const queryRecordNodeJobResult = queryRecordNodeJob.result;
  let nodeResultRecords = 0;
  const recordCount = triggerNodeCollectionRecordNumber + 1;
  if (pageNumber > Math.ceil(recordCount / pageSize)) {
    nodeResultRecords = 0;
    // expect(queryRecordNodeJobResult).toEqual([]);
    expect(queryRecordNodeJobResult).toBeNull();
  } else if (pageNumber * pageSize > recordCount) {
    nodeResultRecords = recordCount - (pageNumber - 1) * pageSize;
    expect(queryRecordNodeJobResult.length).toBe(nodeResultRecords);
    // 获取数组中对象下ID的值
    const nodeResultRecordsIDArray = queryRecordNodeJobResult.map((obj) => obj.id);
    // 断言数组的最小值等于（页码-1）*每页记录数+1
    expect(Math.min(...nodeResultRecordsIDArray)).toBe((pageNumber - 1) * pageSize + 1);
    // 断言数组的最大值等于总记录数
    expect(Math.max(...nodeResultRecordsIDArray)).toBe(recordCount);
  } else {
    nodeResultRecords = pageSize;
    expect(queryRecordNodeJobResult.length).toBe(nodeResultRecords);
    const nodeResultRecordsIDArray = queryRecordNodeJobResult.map((obj) => obj.id);
    // 断言数组的最小值等于（页码-1）*每页记录数+1
    expect(Math.min(...nodeResultRecordsIDArray)).toBe((pageNumber - 1) * pageSize + 1);
    // 断言数组的最大值等于pageNumber * pageSize
    expect(Math.max(...nodeResultRecordsIDArray)).toBe(pageNumber * pageSize);
  }
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, no filtering and no sorting, query the common table multiple records, set the X page Y per page, query results are empty, exit the process', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  const triggerNodeCollectionRecordNumber = faker.number.int({ min: 0, max: 19 });
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, triggerNodeCollectionRecordNumber);
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
  //配置查询节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'query', exact: true }).click();
  const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Query record-Query record', { exact: true }).getByRole('textbox').fill(queryRecordNodeName);
  const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
  const queryRecordNodeId = await queryRecordNode.node.locator('.workflow-node-id').innerText();
  await queryRecordNode.nodeConfigure.click();
  await queryRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
  await queryRecordNode.multipleRecordsRadioButton.check();
  await expect(queryRecordNode.pageNumberEditBox).toHaveValue('1');
  await expect(queryRecordNode.pageSizeEditBox).toHaveValue('20');
  const pageNumber = faker.number.int({ min: 5, max: 5 });
  const pageSize = faker.number.int({ min: 5, max: 5 });
  await queryRecordNode.pageNumberEditBox.fill(pageNumber.toString());
  await queryRecordNode.pageSizeEditBox.fill(pageSize.toString());
  await queryRecordNode.exitProcessOptionsBoxWithEmptyResult.check();
  await expect(queryRecordNode.exitProcessOptionsBoxWithEmptyResult).toBeChecked();
  await queryRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
  await page.waitForTimeout(1000);
  // 3、预期结果：工作流成功触发,数据查询成功
  const getWorkflow = await apiGetWorkflow(workflowId);
  const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
  const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
  expect(getWorkflowExecuted).toBe(1);
  const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
  const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
  getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
    return b.id - a.id;
  });
  const jobs = getWorkflowNodeExecutionsObj[0].jobs;
  const queryRecordNodeJob = jobs.find((job) => job.nodeId.toString() === queryRecordNodeId);
  const queryRecordNodeJobResult = queryRecordNodeJob.result;
  let nodeResultRecords = 0;
  const recordCount = triggerNodeCollectionRecordNumber + 1;
  if (pageNumber > Math.ceil(recordCount / pageSize)) {
    nodeResultRecords = 0;
    expect(queryRecordNodeJobResult).toEqual([]);
  } else if (pageNumber * pageSize > recordCount) {
    nodeResultRecords = recordCount - (pageNumber - 1) * pageSize;
    expect(queryRecordNodeJobResult.length).toBe(nodeResultRecords);
    // 获取数组中对象下ID的值
    const nodeResultRecordsIDArray = queryRecordNodeJobResult.map((obj) => obj.id);
    // 断言数组的最小值等于（页码-1）*每页记录数+1
    expect(Math.min(...nodeResultRecordsIDArray)).toBe((pageNumber - 1) * pageSize + 1);
    // 断言数组的最大值等于总记录数
    expect(Math.max(...nodeResultRecordsIDArray)).toBe(recordCount);
  } else {
    nodeResultRecords = pageSize;
    expect(queryRecordNodeJobResult.length).toBe(nodeResultRecords);
    const nodeResultRecordsIDArray = queryRecordNodeJobResult.map((obj) => obj.id);
    // 断言数组的最小值等于（页码-1）*每页记录数+1
    expect(Math.min(...nodeResultRecordsIDArray)).toBe((pageNumber - 1) * pageSize + 1);
    // 断言数组的最大值等于pageNumber * pageSize
    expect(Math.max(...nodeResultRecordsIDArray)).toBe(pageNumber * pageSize);
  }
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, filter to meet all conditions (status_singleselect=1 and staffnum>20) unsorted, query normal table 1 record', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
  const queryNodeAppendText = 'b' + faker.string.alphanumeric(4);
  // 创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  // 创建查询节点数据表
  const queryNodeCollectionDisplayName = `自动>组织[普通表]${queryNodeAppendText}`;
  const queryNodeCollectionName = `tt_amt_org${queryNodeAppendText}`;
  const queryNodeFieldName = 'orgname';
  const queryNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), queryNodeAppendText)
      .collections,
  );
  const queryNodeCollectioRecordOne = [{ status_singleselect: '1', staffnum: 10 }];
  const queryNodeCollectioRecordTwo = [{ status_singleselect: '1', staffnum: 20 }];
  const queryNodeCollectioRecordThree = [{ status_singleselect: '1', staffnum: 30 }];
  const queryNodeCollectioRecordFour = [{ status_singleselect: '1', staffnum: 40 }];
  const queryNodeCollectioRecordFive = [{ status_singleselect: '2', staffnum: 10 }];
  const queryNodeCollectioRecordSix = [{ status_singleselect: '2', staffnum: 20 }];
  const queryNodeCollectioRecordSeven = [{ status_singleselect: '2', staffnum: 30 }];
  const queryNodeCollectioRecordEight = [{ status_singleselect: '2', staffnum: 40 }];
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordOne);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordTwo);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordThree);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordFour);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordFive);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordSix);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordSeven);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordEight);
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
  //配置查询节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'query', exact: true }).click();
  const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Query record-Query record', { exact: true }).getByRole('textbox').fill(queryRecordNodeName);
  const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
  const queryRecordNodeId = await queryRecordNode.node.locator('.workflow-node-id').innerText();
  await queryRecordNode.nodeConfigure.click();
  await queryRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: queryNodeCollectionDisplayName }).click();
  // await queryRecordNode.multipleRecordsRadioButton.check();
  // 设置过滤条件
  await page.getByText('Add condition', { exact: true }).click();
  await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
  await page.getByRole('menuitemcheckbox', { name: '公司状态(下拉单选)' }).click();
  await page.getByTestId('select-single').click();
  await page.getByRole('option', { name: '存续' }).click();
  await page.getByText('Add condition', { exact: true }).click();
  await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
  await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
  await page.getByRole('button', { name: '=' }).click();
  await page.getByRole('option', { name: '>' }).click();
  await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('20');
  await queryRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);
  // 3、预期结果：工作流成功触发,数据查询成功
  const getWorkflow = await apiGetWorkflow(workflowId);
  const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
  const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
  expect(getWorkflowExecuted).toBe(1);
  const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
  const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
  getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
    return b.id - a.id;
  });
  const jobs = getWorkflowNodeExecutionsObj[0].jobs;
  const queryRecordNodeJob = jobs.find((job) => job.nodeId.toString() === queryRecordNodeId);
  const queryRecordNodeJobResult = queryRecordNodeJob.result;
  const nodeResultRecordID = queryRecordNodeJobResult.id;
  const expectRecordIDArray = [3, 4];
  // 断言nodeResultRecordID的值在expectRecordIDArray数组中
  expect(expectRecordIDArray).toContain(nodeResultRecordID);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, filter to satisfy any condition (status_singleselect=1 or staffnum>20) unsorted, query common table for multiple rows, set page X to Y per page', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
  const queryNodeAppendText = 'b' + faker.string.alphanumeric(4);
  // 创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  // 创建查询节点数据表
  const queryNodeCollectionDisplayName = `自动>组织[普通表]${queryNodeAppendText}`;
  const queryNodeCollectionName = `tt_amt_org${queryNodeAppendText}`;
  const queryNodeFieldName = 'orgname';
  const queryNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), queryNodeAppendText)
      .collections,
  );
  const queryNodeCollectioRecordOne = [{ status_singleselect: '1', staffnum: 10 }];
  const queryNodeCollectioRecordTwo = [{ status_singleselect: '1', staffnum: 20 }];
  const queryNodeCollectioRecordThree = [{ status_singleselect: '1', staffnum: 30 }];
  const queryNodeCollectioRecordFour = [{ status_singleselect: '1', staffnum: 40 }];
  const queryNodeCollectioRecordFive = [{ status_singleselect: '2', staffnum: 10 }];
  const queryNodeCollectioRecordSix = [{ status_singleselect: '2', staffnum: 20 }];
  const queryNodeCollectioRecordSeven = [{ status_singleselect: '2', staffnum: 30 }];
  const queryNodeCollectioRecordEight = [{ status_singleselect: '2', staffnum: 40 }];
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordOne);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordTwo);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordThree);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordFour);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordFive);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordSix);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordSeven);
  await mockRecords(queryNodeCollectionName, queryNodeCollectioRecordEight);
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
  //配置查询节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'query', exact: true }).click();
  const queryRecordNodeName = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Query record-Query record', { exact: true }).getByRole('textbox').fill(queryRecordNodeName);
  const queryRecordNode = new QueryRecordNode(page, queryRecordNodeName);
  const queryRecordNodeId = await queryRecordNode.node.locator('.workflow-node-id').innerText();
  await queryRecordNode.nodeConfigure.click();
  await queryRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: queryNodeCollectionDisplayName }).click();
  await queryRecordNode.multipleRecordsRadioButton.check();
  // 设置过滤条件
  await page.getByTestId('filter-select-all-or-any').click();
  await page.getByRole('option', { name: 'Any' }).click();
  await page.getByText('Add condition', { exact: true }).click();
  await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
  await page.getByRole('menuitemcheckbox', { name: '公司状态(下拉单选)' }).click();
  await page.getByTestId('select-single').click();
  await page.getByRole('option', { name: '存续' }).click();
  await page.getByText('Add condition', { exact: true }).click();
  await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
  await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
  await page.getByRole('button', { name: '=' }).click();
  await page.getByRole('option', { name: '>' }).click();
  await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('20');
  await queryRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据查询成功
  const getWorkflow = await apiGetWorkflow(workflowId);
  const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
  const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
  expect(getWorkflowExecuted).toBe(1);
  const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
  const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
  getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
    return b.id - a.id;
  });
  const jobs = getWorkflowNodeExecutionsObj[0].jobs;
  const queryRecordNodeJob = jobs.find((job) => job.nodeId.toString() === queryRecordNodeId);
  const queryRecordNodeJobResult = queryRecordNodeJob.result;
  expect(queryRecordNodeJobResult.length).toBe(6);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});
