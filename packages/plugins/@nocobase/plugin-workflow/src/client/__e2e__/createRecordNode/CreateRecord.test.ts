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
  CreateRecordNode,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetRecord,
  apiGetWorkflow,
  apiGetWorkflowNodeExecutions,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test('Collection event add data trigger, single row text fields for common tables, set constant data', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'orgname';
  const createNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  const createRecordNodefieldData = createNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByRole('textbox')
    .fill(createRecordNodefieldData);
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(createRecordNodeJobResult.orgname).toBe(createRecordNodefieldData);
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(getRecordsObj.orgname).toBe(createRecordNodefieldData);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table single line text field, set trigger node single line text field variable', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'orgname';
  const createNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByLabel('variable-button')
    .click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(
    page
      .getByLabel(
        `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
      )
      .getByLabel('variable-tag'),
  ).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(createRecordNodeJobResult.orgname).toBe(triggerNodeCollectionRecordOne);
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(getRecordsObj.orgname).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table integer field, set constant data', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'staffnum';
  const createNodeFieldDisplayName = '员工人数(整数)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  const createRecordNodefieldData = faker.number.int();
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByRole('spinbutton')
    .fill(createRecordNodefieldData.toString());
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(createRecordNodeJobResult.staffnum).toBe(createRecordNodefieldData);
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(getRecordsObj.staffnum).toBe(createRecordNodefieldData);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table integer field, set trigger node integer field variable', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'staffnum';
  const triggerNodeFieldDisplayName = '员工人数(整数)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'staffnum';
  const createNodeFieldDisplayName = '员工人数(整数)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByLabel('variable-button')
    .click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(
    page
      .getByLabel(
        `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
      )
      .getByLabel('variable-tag'),
  ).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = faker.number.int();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { staffnum: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(createRecordNodeJobResult.staffnum).toBe(triggerNodeCollectionRecordOne);
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(getRecordsObj.staffnum).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table numeric field, set constant data', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'regcapital';
  const createNodeFieldDisplayName = '注册资本(数字)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  const createRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByRole('spinbutton')
    .fill(createRecordNodefieldData.toString());
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(createRecordNodeJobResult.regcapital).toBe(createRecordNodefieldData);
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(getRecordsObj.regcapital).toBe(createRecordNodefieldData);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table numeric field, set trigger node numeric field variable', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'regcapital';
  const triggerNodeFieldDisplayName = '注册资本(数字)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'regcapital';
  const createNodeFieldDisplayName = '注册资本(数字)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByLabel('variable-button')
    .click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(
    page
      .getByLabel(
        `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
      )
      .getByLabel('variable-tag'),
  ).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
  await createRecordNode.submitButton.click();

  // 2、测试步骤：录入数据触发工作流
  const triggerNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { regcapital: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(createRecordNodeJobResult.regcapital).toBe(triggerNodeCollectionRecordOne);
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(getRecordsObj.regcapital).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table dropdown radio field, set constant data', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'status_singleselect';
  const createNodeFieldDisplayName = '公司状态(下拉单选)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByTestId('select-single')
    .click();
  await page.getByRole('option', { name: '存续' }).click();
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(createRecordNodeJobResult.status_singleselect).toBe('1');
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(getRecordsObj.status_singleselect).toBe('1');
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table dropdown radio field, set trigger node dropdown radio field variable', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'status_singleselect';
  const triggerNodeFieldDisplayName = '公司状态(下拉单选)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'status_singleselect';
  const createNodeFieldDisplayName = '公司状态(下拉单选)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByLabel('variable-button')
    .click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(
    page
      .getByLabel(
        `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
      )
      .getByLabel('variable-tag'),
  ).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = '1';
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { status_singleselect: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(createRecordNodeJobResult.status_singleselect).toBe(triggerNodeCollectionRecordOne);
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(getRecordsObj.status_singleselect).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table dropdown radio fields, set constant data', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'range_multipleselect';
  const createNodeFieldDisplayName = '经营范围(下拉多选)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  await page.getByTestId('select-multiple').click();
  await page.getByRole('option', { name: '软件销售', exact: true }).click();
  await page.getByRole('option', { name: '软件开发', exact: true }).click();
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(createRecordNodeJobResult.range_multipleselect.toString()).toBe('F3134,I3006');
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(getRecordsObj.range_multipleselect.toString()).toBe('F3134,I3006');
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table dropdown radio fields, set trigger node dropdown radio field variable', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'range_multipleselect';
  const triggerNodeFieldDisplayName = '经营范围(下拉多选)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'range_multipleselect';
  const createNodeFieldDisplayName = '经营范围(下拉多选)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByLabel('variable-button')
    .click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(
    page
      .getByLabel(
        `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
      )
      .getByLabel('variable-tag'),
  ).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = ['F3134', 'I3006'];
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { range_multipleselect: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(createRecordNodeJobResult.range_multipleselect.toString()).toBe(triggerNodeCollectionRecordOne.toString());
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(getRecordsObj.range_multipleselect.toString()).toBe(triggerNodeCollectionRecordOne.toString());
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table date field, set constant data', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'orgname';
  const triggerNodeFieldDisplayName = '公司名称(单行文本)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'establishdate';
  const createNodeFieldDisplayName = '成立日期(日期)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByPlaceholder('Select date')
    .click();
  const createRecordNodefieldData = dayjs().format('YYYY-MM-DD');
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByPlaceholder('Select date')
    .fill(createRecordNodefieldData);
  await page.getByTitle(createRecordNodefieldData.toString()).locator('div').click();
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { orgname: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(dayjs(createRecordNodeJobResult.establishdate).format('YYYY-MM-DD')).toBe(createRecordNodefieldData);
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(dayjs(getRecordsObj.establishdate).format('YYYY-MM-DD')).toBe(createRecordNodefieldData);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, normal table date field, set trigger node date field variable', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const createNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'establishdate';
  const triggerNodeFieldDisplayName = '成立日期(日期)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建新增数据节点数据表
  const createNodeCollectionDisplayName = `自动>组织[普通表]${createNodeAppendText}`;
  const createNodeCollectionName = `tt_amt_org${createNodeAppendText}`;
  const createNodeFieldName = 'establishdate';
  const createNodeFieldDisplayName = '成立日期(日期)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createNodeAppendText)
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

  //配置新增数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'create', exact: true }).click();
  const createRecordNodeName = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Create record-Create record', { exact: true }).getByRole('textbox').fill(createRecordNodeName);
  const createRecordNode = new CreateRecordNode(page, createRecordNodeName);
  const createRecordNodeId = await createRecordNode.node.locator('.workflow-node-id').innerText();
  await createRecordNode.nodeConfigure.click();
  await createRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: createNodeCollectionDisplayName }).click();
  // 设置字段
  await createRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: createNodeFieldDisplayName }).click();
  await page.mouse.move(300, 0, { steps: 100 });
  await page
    .getByLabel(
      `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
    )
    .getByLabel('variable-button')
    .click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(
    page
      .getByLabel(
        `block-item-AssignedField-${createNodeCollectionName}-${createNodeCollectionName}.${createNodeFieldName}-${createNodeFieldDisplayName}`,
      )
      .getByLabel('variable-tag'),
  ).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
  await createRecordNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { establishdate: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据表成功新增记录
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
  const createRecordNodeJob = jobs.find((job) => job.nodeId.toString() === createRecordNodeId);
  const createRecordNodeJobResult = createRecordNodeJob.result;
  const createRecordId = createRecordNodeJobResult.id;
  expect(dayjs(createRecordNodeJobResult.establishdate).format('YYYY-MM-DD')).toBe(triggerNodeCollectionRecordOne);
  const getRecords = await apiGetRecord(createNodeCollectionName, createRecordId);
  const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
  expect(dayjs(getRecordsObj.establishdate).format('YYYY-MM-DD')).toBe(triggerNodeCollectionRecordOne);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});
