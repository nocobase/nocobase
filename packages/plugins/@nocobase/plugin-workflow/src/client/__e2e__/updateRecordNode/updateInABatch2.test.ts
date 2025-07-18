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
  UpdateRecordNode,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetList,
  apiGetWorkflow,
  apiGetWorkflowNodeExecutions,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test('Collection event add data trigger, filter integer field not empty, common table integer field data, set trigger node integer field variable', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const updateNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'staffnum';
  const triggerNodeFieldDisplayName = '员工人数(整数)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建更新节点数据表
  const updateNodeCollectionDisplayName = `自动>组织[普通表]${updateNodeAppendText}`;
  const updateNodeCollectionName = `tt_amt_org${updateNodeAppendText}`;
  const updateNodeFieldName = 'staffnum';
  const updateNodeFieldDisplayName = '员工人数(整数)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), updateNodeAppendText)
      .collections,
  );
  const updateNodeCollectionRecordOne = faker.number.int();
  const updateNodeCollectionRecordTwo = faker.number.int();
  const updateNodeCollectionRecordThree = faker.number.int();
  const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [
    { staffnum: updateNodeCollectionRecordOne },
    { staffnum: updateNodeCollectionRecordTwo },
    { staffnum: updateNodeCollectionRecordThree },
  ]);

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

  //配置更新数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'update', exact: true }).click();
  const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Update record-Update record', { exact: true }).getByRole('textbox').fill(updateRecordNodeName);
  const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
  const updateRecordNodeId = await updateRecordNode.node.locator('.workflow-node-id').innerText();
  await updateRecordNode.nodeConfigure.click();
  await updateRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: updateNodeCollectionDisplayName }).click();
  // 设置过滤条件
  await page.getByText('Add condition', { exact: true }).click();
  await page
    .getByLabel('block-item-Filter-workflows-Only update records matching conditions')
    .getByRole('button', { name: 'Select field' })
    .click();
  await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
  await page.getByTestId('select-filter-operator').click();
  await page.getByRole('option', { name: 'is not empty' }).click();

  // 设置字段
  await updateRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(
    page
      .getByLabel(
        `block-item-AssignedField-${updateNodeCollectionName}-${updateNodeCollectionName}.${updateNodeFieldName}-${updateNodeFieldDisplayName}`,
      )
      .getByLabel('variable-tag'),
  ).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
  await updateRecordNode.submitButton.click();
  const updateRecordNodefieldData = faker.number.int();
  // 查看更新前数据
  let updateNodeCollectionData = await apiGetList(updateNodeCollectionName);
  let updateNodeCollectionDataObj = JSON.parse(JSON.stringify(updateNodeCollectionData));
  let updateNodeCollectionDataArr = updateNodeCollectionDataObj.data;
  let recordOnebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.staffnum === updateNodeCollectionRecordOne,
  );
  expect(recordOnebeforeUpdateExpect).toBeTruthy();
  let recordTwobeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.staffnum === updateNodeCollectionRecordTwo,
  );
  expect(recordTwobeforeUpdateExpect).toBeTruthy();
  let recordThreebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.staffnum === updateNodeCollectionRecordThree,
  );
  expect(recordThreebeforeUpdateExpect).toBeTruthy();
  let afterUpdateExpect = updateNodeCollectionDataArr.find((arr) => arr.staffnum === updateRecordNodefieldData);
  expect(afterUpdateExpect).toBeFalsy();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = updateRecordNodefieldData;
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { staffnum: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据更新成功
  updateNodeCollectionData = await apiGetList(updateNodeCollectionName);
  updateNodeCollectionDataObj = JSON.parse(JSON.stringify(updateNodeCollectionData));
  updateNodeCollectionDataArr = updateNodeCollectionDataObj.data;
  recordOnebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.staffnum === updateNodeCollectionRecordOne,
  );
  expect(recordOnebeforeUpdateExpect).toBeFalsy();
  recordTwobeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.staffnum === updateNodeCollectionRecordTwo,
  );
  expect(recordTwobeforeUpdateExpect).toBeFalsy();
  recordThreebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.staffnum === updateNodeCollectionRecordThree,
  );
  expect(recordThreebeforeUpdateExpect).toBeFalsy();
  afterUpdateExpect = updateNodeCollectionDataArr.find((arr) => arr.staffnum === updateRecordNodefieldData);
  expect(afterUpdateExpect).toBeTruthy();

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
  const updateRecordNodeJob = jobs.find((job) => job.nodeId.toString() === updateRecordNodeId);
  const updateRecordNodeJobResult = updateRecordNodeJob.result;
  expect(updateRecordNodeJobResult).toBe(3);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});
test('Collection event add data trigger, filter numeric field not null, common table numeric field data, set numeric field constant data', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const updateNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'regcapital';
  const triggerNodeFieldDisplayName = '注册资本(数字)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建更新节点数据表
  const updateNodeCollectionDisplayName = `自动>组织[普通表]${updateNodeAppendText}`;
  const updateNodeCollectionName = `tt_amt_org${updateNodeAppendText}`;
  const updateNodeFieldName = 'regcapital';
  const updateNodeFieldDisplayName = '注册资本(数字)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), updateNodeAppendText)
      .collections,
  );
  // 定义随机4位数小数的数值
  // const updateNodeCollectionRecordOne = faker.datatype.float({ min: 0, max: 10000, precision: 4 });
  const updateNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  const updateNodeCollectionRecordTwo = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  const updateNodeCollectionRecordThree = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [
    { regcapital: updateNodeCollectionRecordOne },
    { regcapital: updateNodeCollectionRecordTwo },
    { regcapital: updateNodeCollectionRecordThree },
  ]);

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

  //配置更新数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'update', exact: true }).click();
  const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Update record-Update record', { exact: true }).getByRole('textbox').fill(updateRecordNodeName);
  const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
  const updateRecordNodeId = await updateRecordNode.node.locator('.workflow-node-id').innerText();
  await updateRecordNode.nodeConfigure.click();
  await updateRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: updateNodeCollectionDisplayName }).click();
  // 设置过滤条件
  await page.getByText('Add condition', { exact: true }).click();
  await page
    .getByLabel('block-item-Filter-workflows-Only update records matching conditions')
    .getByRole('button', { name: 'Select field' })
    .click();
  await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
  await page.getByTestId('select-filter-operator').click();
  await page.getByRole('option', { name: 'is not empty' }).click();

  // 设置字段
  await updateRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
  const updateRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  await page
    .getByLabel(
      `block-item-AssignedField-${updateNodeCollectionName}-${updateNodeCollectionName}.${updateNodeFieldName}-${updateNodeFieldDisplayName}`,
    )
    .getByRole('spinbutton')
    .fill(updateRecordNodefieldData.toString());
  await updateRecordNode.submitButton.click();

  // 查看更新前数据
  let updateNodeCollectionData = await apiGetList(updateNodeCollectionName);
  let updateNodeCollectionDataObj = JSON.parse(JSON.stringify(updateNodeCollectionData));
  let updateNodeCollectionDataArr = updateNodeCollectionDataObj.data;
  let recordOnebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordOne,
  );
  expect(recordOnebeforeUpdateExpect).toBeTruthy();
  let recordTwobeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordTwo,
  );
  expect(recordTwobeforeUpdateExpect).toBeTruthy();
  let recordThreebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordThree,
  );
  expect(recordThreebeforeUpdateExpect).toBeTruthy();
  let afterUpdateExpect = updateNodeCollectionDataArr.find((arr) => arr.regcapital === updateRecordNodefieldData);
  expect(afterUpdateExpect).toBeFalsy();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { regcapital: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);
  // 3、预期结果：工作流成功触发,数据更新成功
  updateNodeCollectionData = await apiGetList(updateNodeCollectionName);
  updateNodeCollectionDataObj = JSON.parse(JSON.stringify(updateNodeCollectionData));
  updateNodeCollectionDataArr = updateNodeCollectionDataObj.data;
  recordOnebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordOne,
  );
  expect(recordOnebeforeUpdateExpect).toBeFalsy();
  recordTwobeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordTwo,
  );
  expect(recordTwobeforeUpdateExpect).toBeFalsy();
  recordThreebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordThree,
  );
  expect(recordThreebeforeUpdateExpect).toBeFalsy();
  afterUpdateExpect = updateNodeCollectionDataArr.find((arr) => arr.regcapital === updateRecordNodefieldData);
  expect(afterUpdateExpect).toBeTruthy();

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
  const updateRecordNodeJob = jobs.find((job) => job.nodeId.toString() === updateRecordNodeId);
  const updateRecordNodeJobResult = updateRecordNodeJob.result;
  expect(updateRecordNodeJobResult).toBe(3);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});
test('Collection event add data trigger, filter numeric field not empty, common table numeric field data, set trigger node numeric field variable', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const updateNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'regcapital';
  const triggerNodeFieldDisplayName = '注册资本(数字)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建更新节点数据表
  const updateNodeCollectionDisplayName = `自动>组织[普通表]${updateNodeAppendText}`;
  const updateNodeCollectionName = `tt_amt_org${updateNodeAppendText}`;
  const updateNodeFieldName = 'regcapital';
  const updateNodeFieldDisplayName = '注册资本(数字)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), updateNodeAppendText)
      .collections,
  );
  const updateNodeCollectionRecordOne = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  const updateNodeCollectionRecordTwo = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  const updateNodeCollectionRecordThree = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [
    { regcapital: updateNodeCollectionRecordOne },
    { regcapital: updateNodeCollectionRecordTwo },
    { regcapital: updateNodeCollectionRecordThree },
  ]);

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

  //配置更新数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'update', exact: true }).click();
  const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Update record-Update record', { exact: true }).getByRole('textbox').fill(updateRecordNodeName);
  const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
  const updateRecordNodeId = await updateRecordNode.node.locator('.workflow-node-id').innerText();
  await updateRecordNode.nodeConfigure.click();
  await updateRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: updateNodeCollectionDisplayName }).click();
  // 设置过滤条件
  await page.getByText('Add condition', { exact: true }).click();
  await page
    .getByLabel('block-item-Filter-workflows-Only update records matching conditions')
    .getByRole('button', { name: 'Select field' })
    .click();
  await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
  await page.getByTestId('select-filter-operator').click();
  await page.getByRole('option', { name: 'is not empty' }).click();

  // 设置字段
  await updateRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(
    page
      .getByLabel(
        `block-item-AssignedField-${updateNodeCollectionName}-${updateNodeCollectionName}.${updateNodeFieldName}-${updateNodeFieldDisplayName}`,
      )
      .getByLabel('variable-tag'),
  ).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
  await updateRecordNode.submitButton.click();

  const updateRecordNodefieldData = faker.number.float({ min: 0, max: 999999999, precision: 0.0001 });
  // 查看更新前数据
  let updateNodeCollectionData = await apiGetList(updateNodeCollectionName);
  let updateNodeCollectionDataObj = JSON.parse(JSON.stringify(updateNodeCollectionData));
  let updateNodeCollectionDataArr = updateNodeCollectionDataObj.data;
  let recordOnebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordOne,
  );
  expect(recordOnebeforeUpdateExpect).toBeTruthy();
  let recordTwobeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordTwo,
  );
  expect(recordTwobeforeUpdateExpect).toBeTruthy();
  let recordThreebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordThree,
  );
  expect(recordThreebeforeUpdateExpect).toBeTruthy();
  let afterUpdateExpect = updateNodeCollectionDataArr.find((arr) => arr.regcapital === updateRecordNodefieldData);
  expect(afterUpdateExpect).toBeFalsy();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = updateRecordNodefieldData;
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { regcapital: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据更新成功
  updateNodeCollectionData = await apiGetList(updateNodeCollectionName);
  updateNodeCollectionDataObj = JSON.parse(JSON.stringify(updateNodeCollectionData));
  updateNodeCollectionDataArr = updateNodeCollectionDataObj.data;
  recordOnebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordOne,
  );
  expect(recordOnebeforeUpdateExpect).toBeFalsy();
  recordTwobeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordTwo,
  );
  expect(recordTwobeforeUpdateExpect).toBeFalsy();
  recordThreebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.regcapital === updateNodeCollectionRecordThree,
  );
  expect(recordThreebeforeUpdateExpect).toBeFalsy();
  afterUpdateExpect = updateNodeCollectionDataArr.find((arr) => arr.regcapital === updateRecordNodefieldData);
  expect(afterUpdateExpect).toBeTruthy();

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
  const updateRecordNodeJob = jobs.find((job) => job.nodeId.toString() === updateRecordNodeId);
  const updateRecordNodeJobResult = updateRecordNodeJob.result;
  expect(updateRecordNodeJobResult).toBe(3);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});
test('Collection event add data trigger, filter dropdown radio field not null, common table dropdown radio field data, set dropdown radio field constant data', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const updateNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'status_singleselect';
  const triggerNodeFieldDisplayName = '公司状态(下拉单选)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建更新节点数据表
  const updateNodeCollectionDisplayName = `自动>组织[普通表]${updateNodeAppendText}`;
  const updateNodeCollectionName = `tt_amt_org${updateNodeAppendText}`;
  const updateNodeFieldName = 'status_singleselect';
  const updateNodeFieldDisplayName = '公司状态(下拉单选)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), updateNodeAppendText)
      .collections,
  );
  const updateNodeCollectionRecordOne = '1';
  const updateNodeCollectionRecordTwo = '2';
  const updateNodeCollectionRecordThree = '3';
  const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [
    { status_singleselect: updateNodeCollectionRecordOne },
    { status_singleselect: updateNodeCollectionRecordTwo },
    { status_singleselect: updateNodeCollectionRecordThree },
  ]);

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
  //配置更新数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'update', exact: true }).click();
  const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Update record-Update record', { exact: true }).getByRole('textbox').fill(updateRecordNodeName);
  const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
  const updateRecordNodeId = await updateRecordNode.node.locator('.workflow-node-id').innerText();
  await updateRecordNode.nodeConfigure.click();
  await updateRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: updateNodeCollectionDisplayName }).click();
  // 设置过滤条件
  await page.getByText('Add condition', { exact: true }).click();
  await page
    .getByLabel('block-item-Filter-workflows-Only update records matching conditions')
    .getByRole('button', { name: 'Select field' })
    .click();
  await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
  await page.getByTestId('select-filter-operator').click();
  await page.getByRole('option', { name: 'is not empty' }).click();

  // 设置字段
  await updateRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
  const updateRecordNodefieldData = '4';
  await page
    .getByLabel(
      `block-item-AssignedField-${updateNodeCollectionName}-${updateNodeCollectionName}.${updateNodeFieldName}-${updateNodeFieldDisplayName}`,
    )
    .getByTestId('select-single')
    .click();
  await page.getByRole('option', { name: '注销' }).click();
  await updateRecordNode.submitButton.click();

  // 查看更新前数据
  let updateNodeCollectionData = await apiGetList(updateNodeCollectionName);
  let updateNodeCollectionDataObj = JSON.parse(JSON.stringify(updateNodeCollectionData));
  let updateNodeCollectionDataArr = updateNodeCollectionDataObj.data;
  let recordOnebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordOne,
  );
  expect(recordOnebeforeUpdateExpect).toBeTruthy();
  let recordTwobeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordTwo,
  );
  expect(recordTwobeforeUpdateExpect).toBeTruthy();
  let recordThreebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordThree,
  );
  expect(recordThreebeforeUpdateExpect).toBeTruthy();
  let afterUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateRecordNodefieldData,
  );
  expect(afterUpdateExpect).toBeFalsy();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = '4';
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { status_singleselect: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);
  // 3、预期结果：工作流成功触发,数据更新成功
  updateNodeCollectionData = await apiGetList(updateNodeCollectionName);
  updateNodeCollectionDataObj = JSON.parse(JSON.stringify(updateNodeCollectionData));
  updateNodeCollectionDataArr = updateNodeCollectionDataObj.data;
  recordOnebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordOne,
  );
  expect(recordOnebeforeUpdateExpect).toBeFalsy();
  recordTwobeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordTwo,
  );
  expect(recordTwobeforeUpdateExpect).toBeFalsy();
  recordThreebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordThree,
  );
  expect(recordThreebeforeUpdateExpect).toBeFalsy();
  afterUpdateExpect = updateNodeCollectionDataArr.find((arr) => arr.status_singleselect === updateRecordNodefieldData);
  expect(afterUpdateExpect).toBeTruthy();

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
  const updateRecordNodeJob = jobs.find((job) => job.nodeId.toString() === updateRecordNodeId);
  const updateRecordNodeJobResult = updateRecordNodeJob.result;
  expect(updateRecordNodeJobResult).toBe(3);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});
test('Collection event add data trigger, filter dropdown radio field not empty, common table dropdown radio field data, set trigger node dropdown radio field variable', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = 'a' + Math.random().toString(36).substring(2, 12);
  const updateNodeAppendText = 'b' + Math.random().toString(36).substring(2, 12);
  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'status_singleselect';
  const triggerNodeFieldDisplayName = '公司状态(下拉单选)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );

  // 创建更新节点数据表
  const updateNodeCollectionDisplayName = `自动>组织[普通表]${updateNodeAppendText}`;
  const updateNodeCollectionName = `tt_amt_org${updateNodeAppendText}`;
  const updateNodeFieldName = 'status_singleselect';
  const updateNodeFieldDisplayName = '公司状态(下拉单选)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), updateNodeAppendText)
      .collections,
  );
  const updateNodeCollectionRecordOne = '1';
  const updateNodeCollectionRecordTwo = '2';
  const updateNodeCollectionRecordThree = '3';
  const updateNodeCollectionRecords = await mockRecords(updateNodeCollectionName, [
    { status_singleselect: updateNodeCollectionRecordOne },
    { status_singleselect: updateNodeCollectionRecordTwo },
    { status_singleselect: updateNodeCollectionRecordThree },
  ]);

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

  //配置更新数据节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'update', exact: true }).click();
  const updateRecordNodeName = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Update record-Update record', { exact: true }).getByRole('textbox').fill(updateRecordNodeName);
  const updateRecordNode = new UpdateRecordNode(page, updateRecordNodeName);
  const updateRecordNodeId = await updateRecordNode.node.locator('.workflow-node-id').innerText();
  await updateRecordNode.nodeConfigure.click();
  await updateRecordNode.collectionDropDown.click();
  await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
  await page.getByRole('menuitemcheckbox', { name: updateNodeCollectionDisplayName }).click();
  // 设置过滤条件
  await page.getByText('Add condition', { exact: true }).click();
  await page
    .getByLabel('block-item-Filter-workflows-Only update records matching conditions')
    .getByRole('button', { name: 'Select field' })
    .click();
  await page.getByRole('menuitemcheckbox', { name: updateNodeFieldDisplayName.toString() }).click();
  await page.getByTestId('select-filter-operator').click();
  await page.getByRole('option', { name: 'is not empty' }).click();

  // 设置字段
  await updateRecordNode.addFieldsButton.hover();
  await page.getByRole('menuitem', { name: updateNodeFieldDisplayName }).click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(
    page
      .getByLabel(
        `block-item-AssignedField-${updateNodeCollectionName}-${updateNodeCollectionName}.${updateNodeFieldName}-${updateNodeFieldDisplayName}`,
      )
      .getByLabel('variable-tag'),
  ).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
  await updateRecordNode.submitButton.click();

  const updateRecordNodefieldData = '4';
  // 查看更新前数据
  let updateNodeCollectionData = await apiGetList(updateNodeCollectionName);
  let updateNodeCollectionDataObj = JSON.parse(JSON.stringify(updateNodeCollectionData));
  let updateNodeCollectionDataArr = updateNodeCollectionDataObj.data;
  let recordOnebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordOne,
  );
  expect(recordOnebeforeUpdateExpect).toBeTruthy();
  let recordTwobeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordTwo,
  );
  expect(recordTwobeforeUpdateExpect).toBeTruthy();
  let recordThreebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordThree,
  );
  expect(recordThreebeforeUpdateExpect).toBeTruthy();
  let afterUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateRecordNodefieldData,
  );
  expect(afterUpdateExpect).toBeFalsy();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = updateRecordNodefieldData;
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { status_singleselect: triggerNodeCollectionRecordOne },
  ]);
  await page.waitForTimeout(1000);

  // 3、预期结果：工作流成功触发,数据更新成功
  updateNodeCollectionData = await apiGetList(updateNodeCollectionName);
  updateNodeCollectionDataObj = JSON.parse(JSON.stringify(updateNodeCollectionData));
  updateNodeCollectionDataArr = updateNodeCollectionDataObj.data;
  recordOnebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordOne,
  );
  expect(recordOnebeforeUpdateExpect).toBeFalsy();
  recordTwobeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordTwo,
  );
  expect(recordTwobeforeUpdateExpect).toBeFalsy();
  recordThreebeforeUpdateExpect = updateNodeCollectionDataArr.find(
    (arr) => arr.status_singleselect === updateNodeCollectionRecordThree,
  );
  expect(recordThreebeforeUpdateExpect).toBeFalsy();
  afterUpdateExpect = updateNodeCollectionDataArr.find((arr) => arr.status_singleselect === updateRecordNodefieldData);
  expect(afterUpdateExpect).toBeTruthy();

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
  const updateRecordNodeJob = jobs.find((job) => job.nodeId.toString() === updateRecordNodeId);
  const updateRecordNodeJobResult = updateRecordNodeJob.result;
  expect(updateRecordNodeJobResult).toBe(3);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});
