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
  AggregateNode,
  CalculationNode,
  CollectionTriggerNode,
  CreateRecordNode,
  QueryRecordNode,
  apiCreateWorkflow,
  apiCreateWorkflowNode,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiGetWorkflowNode,
  apiGetWorkflowNodeExecutions,
  apiUpdateWorkflowNode,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test('Collection event add data trigger, get trigger node single line text variable', async ({
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

  //配置计算节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'calculation', exact: true }).click();
  const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
  const calculationNode = new CalculationNode(page, calculationNodeName);
  await calculationNode.nodeConfigure.click();
  await page.getByLabel('variable-button').click();
  await page.getByText('Trigger variables').click();
  await page.getByText('Trigger data').click();
  await page.getByText('公司名称(单行文本)').click();
  await expect(page.getByLabel('textbox')).toHaveText('Trigger variables / Trigger data / 公司名称(单行文本)');
  await calculationNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,判断节点true通过
  const getWorkflow = await apiGetWorkflow(workflowId);
  const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
  const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
  expect(getWorkflowExecuted).toBe(1);
  const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
  const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
  getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
    return b.id - a.id;
  });
  const getWorkflowNodeExecutionsObjResult = getWorkflowNodeExecutionsObj[0].jobs[0].result;
  expect(getWorkflowNodeExecutionsObjResult).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data triggers, get predecessor Math engine arithmetic node data', async ({
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

  //配置前置计算节点
  const preCalculationNodeTitle = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const preCalculationNodeData = {
    type: 'calculation',
    upstreamId: null,
    branchIndex: null,
    title: preCalculationNodeTitle,
    config: { engine: 'math.js', expression: '{{$context.data.orgname}}' },
  };
  const preCalculationNode = await apiCreateWorkflowNode(workflowId, preCalculationNodeData);
  const preCalculationNodeObj = JSON.parse(JSON.stringify(preCalculationNode));
  const preCalculationNodeId = preCalculationNodeObj.id;
  const getPreCalculationNode = await apiGetWorkflowNode(preCalculationNodeId);
  const preCalculationNodeKey = getPreCalculationNode.key;

  //配置计算节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const preCalculationNodePom = new CalculationNode(page, preCalculationNodeTitle);
  await preCalculationNodePom.addNodeButton.click();
  await page.getByRole('button', { name: 'calculation', exact: true }).click();
  const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
  const calculationNode = new CalculationNode(page, calculationNodeName);
  const conditionNodeId = await calculationNode.node.locator('.workflow-node-id').innerText();
  await calculationNode.nodeConfigure.click();
  await page.getByLabel('variable-button').click();
  await page.getByText('Node result').click();
  await page.getByRole('menuitemcheckbox', { name: preCalculationNodeTitle }).click();
  await expect(page.getByLabel('textbox')).toHaveText(`Node result / ${preCalculationNodeTitle}`);
  await calculationNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,判断节点true通过
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
  const job = jobs.find((job) => job.nodeId.toString() === conditionNodeId);
  expect(job.result).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection events add data triggers, get single line of text data for front query data nodes', async ({
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

  //配置前置查询节点
  const preQueryRecordNodeTitle = 'Query record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const preQueryRecordNodeData = {
    type: 'query',
    upstreamId: null,
    branchIndex: null,
    title: preQueryRecordNodeTitle,
    config: {
      collection: triggerNodeCollectionName,
      params: {
        filter: { $and: [{ id: { $eq: '{{$context.data.id}}' } }] },
        sort: [],
        page: 1,
        pageSize: 20,
        appends: [],
      },
    },
  };
  const preQueryRecordNode = await apiCreateWorkflowNode(workflowId, preQueryRecordNodeData);
  const preQueryRecordNodeObj = JSON.parse(JSON.stringify(preQueryRecordNode));
  const preQueryRecordNodeId = preQueryRecordNodeObj.id;
  const getPreQueryRecordNode = await apiGetWorkflowNode(preQueryRecordNodeId);
  const preQueryRecordNodeKey = getPreQueryRecordNode.key;

  //配置计算节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const preQueryRecordNodePom = new QueryRecordNode(page, preQueryRecordNodeTitle);
  await preQueryRecordNodePom.addNodeButton.click();
  await page.getByRole('button', { name: 'calculation', exact: true }).click();
  const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
  const calculationNode = new CalculationNode(page, calculationNodeName);
  const conditionNodeId = await calculationNode.node.locator('.workflow-node-id').innerText();
  await calculationNode.nodeConfigure.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
  await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeTitle }).click();
  await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
  await expect(page.getByLabel('textbox')).toHaveText(`Node result / ${preQueryRecordNodeTitle} / 公司名称(单行文本)`);
  await calculationNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,判断节点true通过
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
  const job = jobs.find((job) => job.nodeId.toString() === conditionNodeId);
  expect(job.result).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, get front added data node single line text data', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //创建触发器节点数据表
  const triggerNodeAppendText = faker.string.alphanumeric(5);
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  // 创建新增数据节点数据表
  const createRecordNodeAppendText = faker.string.alphanumeric(6);
  const createRecordNodeCollectionDisplayName = `自动>组织[普通表]${createRecordNodeAppendText}`;
  const createRecordNodeCollectionName = `tt_amt_org${createRecordNodeAppendText}`;
  const createRecordNodeFieldName = 'orgname';
  const createRecordNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createRecordNodeAppendText)
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

  //配置前置添加数据节点
  const preCreateRecordNodeTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const preCreateRecordNodeData = {
    type: 'create',
    upstreamId: null,
    branchIndex: null,
    title: preCreateRecordNodeTitle,
    config: {
      params: { values: { orgname: '{{$context.data.orgname}}' }, appends: [] },
      collection: createRecordNodeCollectionName,
    },
  };
  const preCreateRecordNode = await apiCreateWorkflowNode(workflowId, preCreateRecordNodeData);
  const preCreateRecordNodeObj = JSON.parse(JSON.stringify(preCreateRecordNode));
  const preCreateRecordNodeId = preCreateRecordNodeObj.id;
  const getPreCreateRecordNode = await apiGetWorkflowNode(preCreateRecordNodeId);
  const preCreateRecordNodeKey = getPreCreateRecordNode.key;

  //配置计算节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const preCreateRecordNodePom = new CreateRecordNode(page, preCreateRecordNodeTitle);
  await preCreateRecordNodePom.addNodeButton.click();
  await page.getByRole('button', { name: 'calculation', exact: true }).click();
  const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
  const calculationNode = new CalculationNode(page, calculationNodeName);
  const conditionNodeId = await calculationNode.node.locator('.workflow-node-id').innerText();
  await calculationNode.nodeConfigure.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
  await page.getByRole('menuitemcheckbox', { name: preCreateRecordNodeTitle }).click();
  await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
  await expect(page.getByLabel('textbox')).toHaveText(`Node result / ${preCreateRecordNodeTitle} / 公司名称(单行文本)`);
  await calculationNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,判断节点true通过
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
  const job = jobs.find((job) => job.nodeId.toString() === conditionNodeId);
  expect(job.result).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event adds data triggers, fetches data from front-end aggregation query nodes', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //创建触发器节点数据表
  const triggerNodeAppendText = faker.string.alphanumeric(5);
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

  //配置前置聚合查询节点
  const preAggregateNodeTitle = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const preAggregateNodeData = {
    type: 'aggregate',
    upstreamId: null,
    branchIndex: null,
    title: preAggregateNodeTitle,
    config: {
      aggregator: 'count',
      associated: false,
      params: { field: 'id', filter: { $and: [] } },
      collection: triggerNodeCollectionName,
    },
  };
  const preAggregateNode = await apiCreateWorkflowNode(workflowId, preAggregateNodeData);
  const preAggregateNodeObj = JSON.parse(JSON.stringify(preAggregateNode));
  const preAggregateNodeId = preAggregateNodeObj.id;
  const getPreAggregateNode = await apiGetWorkflowNode(preAggregateNodeId);
  const preAggregateNodeKey = getPreAggregateNode.key;

  //配置计算节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const preAggregateNodePom = new AggregateNode(page, preAggregateNodeTitle);
  await preAggregateNodePom.addNodeButton.click();
  await page.getByRole('button', { name: 'calculation', exact: true }).click();
  const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
  const calculationNode = new CalculationNode(page, calculationNodeName);
  const conditionNodeId = await calculationNode.node.locator('.workflow-node-id').innerText();
  await calculationNode.nodeConfigure.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
  await page.getByRole('menuitemcheckbox', { name: preAggregateNodeTitle }).click();
  await expect(page.getByLabel('textbox')).toHaveText(`Node result / ${preAggregateNodeTitle}`);
  await calculationNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,判断节点true通过
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
  const job = jobs.find((job) => job.nodeId.toString() === conditionNodeId);
  expect(job.result).toBe(1);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test.skip('Collection event add data trigger, get front manual node add form single line text data', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  // 创建触发器节点数据表
  const triggerNodeAppendText = faker.string.alphanumeric(5);
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  // 创建人工节点数据表
  const manualNodeAppendText = faker.string.alphanumeric(5);
  const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
  const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
  const manualNodeFieldName = 'orgname';
  const manualNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
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

  //配置前置人工节点新增数据表单
  const preManualNodeNodeTitle = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const preManualNodeNodeCustomFormTitle = 'Custom form' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const preManualNodeNodeData = { type: 'manual', upstreamId: null, branchIndex: null, title: 'Manual', config: {} };
  const preManualNodeNode = await apiCreateWorkflowNode(workflowId, preManualNodeNodeData);
  const preManualNodeNodeObj = JSON.parse(JSON.stringify(preManualNodeNode));
  const preManualNodeNodeId = preManualNodeNodeObj.id;
  const getPreManualNodeNode = await apiGetWorkflowNode(preManualNodeNodeId);
  const preAggregateNodeKey = getPreManualNodeNode.key;
  const preManualNodeNodeConfig = {
    config: {
      assignees: [1],
      schema: {
        tab1: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          title: '{{t("Manual", { ns: "workflow-manual" })}}',
          'x-component': 'Tabs.TabPane',
          'x-designer': 'Tabs.Designer',
          properties: {
            grid: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'workflowManual:popup:configureUserInterface:addBlock',
              name: 'grid',
              properties: {
                '59t231zx5vx': {
                  _isJSONSchemaObject: true,
                  version: '2.0',
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    '13do6fj5t73': {
                      _isJSONSchemaObject: true,
                      version: '2.0',
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        krb1bo0p486: {
                          _isJSONSchemaObject: true,
                          version: '2.0',
                          type: 'void',
                          'x-decorator': 'FormBlockProvider',
                          'x-decorator-props': {
                            formType: 'create',
                            resource: 'tt_mnt_org',
                            collection: 'tt_mnt_org',
                          },
                          'x-designer': 'CreateFormDesigner',
                          'x-component': 'CardItem',
                          'x-component-props': {
                            title: 'Create record4567',
                          },
                          properties: {
                            kzqri0ib7ji: {
                              _isJSONSchemaObject: true,
                              version: '2.0',
                              type: 'void',
                              'x-component': 'FormV2',
                              'x-component-props': {
                                useProps: '{{ useFormBlockProps }}',
                              },
                              properties: {
                                grid: {
                                  _isJSONSchemaObject: true,
                                  version: '2.0',
                                  type: 'void',
                                  'x-component': 'Grid',
                                  'x-initializer': 'form:configureFields',
                                  name: 'grid',
                                  properties: {
                                    yt2rbpepdsl: {
                                      _isJSONSchemaObject: true,
                                      version: '2.0',
                                      type: 'void',
                                      'x-component': 'Grid.Row',
                                      properties: {
                                        eptw1hy20lm: {
                                          _isJSONSchemaObject: true,
                                          version: '2.0',
                                          type: 'void',
                                          'x-component': 'Grid.Col',
                                          properties: {
                                            orgname: {
                                              _isJSONSchemaObject: true,
                                              version: '2.0',
                                              type: 'string',
                                              name: 'orgname',
                                              'x-designer': 'FormItem.Designer',
                                              'x-component': 'CollectionField',
                                              'x-decorator': 'FormItem',
                                              'x-collection-field': `${manualNodeCollectionName}.${manualNodeFieldName}`,
                                              'x-component-props': {},
                                            },
                                          },
                                          name: 'eptw1hy20lm',
                                        },
                                      },
                                      name: 'yt2rbpepdsl',
                                    },
                                  },
                                },
                                actions: {
                                  _isJSONSchemaObject: true,
                                  version: '2.0',
                                  type: 'void',
                                  'x-initializer': 'workflowManual:form:configureActions',
                                  'x-component': 'ActionBar',
                                  'x-component-props': {
                                    layout: 'one-column',
                                    style: {
                                      marginTop: '1.5em',
                                      flexWrap: 'wrap',
                                    },
                                  },
                                  properties: {
                                    resolve: {
                                      _isJSONSchemaObject: true,
                                      version: '2.0',
                                      type: 'void',
                                      title: '{{t("Continue the process", { ns: "workflow-manual" })}}',
                                      'x-decorator': 'ManualActionStatusProvider',
                                      'x-decorator-props': {
                                        value: 1,
                                      },
                                      'x-component': 'Action',
                                      'x-component-props': {
                                        type: 'primary',
                                        useAction: '{{ useSubmit }}',
                                      },
                                      'x-designer': 'ManualActionDesigner',
                                      'x-designer-props': {},
                                      name: 'resolve',
                                    },
                                  },
                                  'x-decorator': 'ActionBarProvider',
                                  name: 'actions',
                                },
                              },
                              name: 'kzqri0ib7ji',
                            },
                          },
                          name: 'krb1bo0p486',
                        },
                      },
                      name: '13do6fj5t73',
                    },
                  },
                  name: '59t231zx5vx',
                },
              },
            },
          },
          name: 'tab1',
        },
      },
      forms: {
        kzqri0ib7ji: {
          type: 'create',
          title: preManualNodeNodeCustomFormTitle,
          actions: [
            {
              status: 1,
              key: 'resolve',
            },
          ],
          collection: manualNodeCollectionName,
        },
      },
    },
  };
  await apiUpdateWorkflowNode(preManualNodeNodeId, preManualNodeNodeConfig);

  //配置计算节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const preManualNodeNodePom = new AggregateNode(page, preManualNodeNodeTitle);
  await preManualNodeNodePom.addNodeButton.click();
  await page.getByRole('button', { name: 'calculation', exact: true }).click();
  const calculationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Calculation-Calculation', { exact: true }).getByRole('textbox').fill(calculationNodeName);
  const calculationNode = new CalculationNode(page, calculationNodeName);
  const conditionNodeId = await calculationNode.node.locator('.workflow-node-id').innerText();
  await calculationNode.nodeConfigure.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
  await page.getByRole('menuitemcheckbox', { name: preManualNodeNodeTitle }).click();
  await page.getByRole('menuitemcheckbox', { name: preManualNodeNodeCustomFormTitle }).click();
  await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)' }).click();
  await expect(page.getByLabel('textbox')).toHaveText(
    `Node result / ${preManualNodeNodeTitle} / ${preManualNodeNodeCustomFormTitle} / 公司名称(单行文本)`,
  );
  await calculationNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);
  // api请求办理人工节点

  // 3、预期结果：工作流成功触发,判断节点true通过
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
  const job = jobs.find((job) => job.nodeId.toString() === conditionNodeId);
  expect(job.result).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});
