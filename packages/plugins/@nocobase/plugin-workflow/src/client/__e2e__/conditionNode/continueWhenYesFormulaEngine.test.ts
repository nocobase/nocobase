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
  ConditionYesNode,
  QueryRecordNode,
  apiCreateWorkflow,
  apiCreateWorkflowNode,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiGetWorkflowNode,
  apiGetWorkflowNodeExecutions,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is equal to an equal constant, passes.', async ({
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

  //配置判断节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'condition', exact: true }).click();
  await page.getByLabel('action-Action-Submit-workflows').click();
  const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
  const conditionNode = new ConditionYesNode(page, conditionNodeName);
  await conditionNode.nodeConfigure.click();
  await conditionNode.formulaRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  const conditionalRightConstant = faker.string.alphanumeric(10);
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`=='${conditionalRightConstant}'`, { delay: 50 });
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}=='${conditionalRightConstant}'`,
  );
  await conditionNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = conditionalRightConstant;
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
  expect(getWorkflowNodeExecutionsObjResult).toBe(true);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is equal to an unequal constant, fails.', async ({
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

  //配置判断节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'condition', exact: true }).click();
  await page.getByLabel('action-Action-Submit-workflows').click();
  const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
  const conditionNode = new ConditionYesNode(page, conditionNodeName);
  await conditionNode.nodeConfigure.click();
  await conditionNode.formulaRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  const conditionalRightConstant = faker.string.alphanumeric(10);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ControlOrMeta+ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`=='${conditionalRightConstant}'`, { delay: 50 });
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}=='${conditionalRightConstant}'`,
  );
  await conditionNode.submitButton.click();

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
  expect(getWorkflowNodeExecutionsObjResult).toBe(false);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is not equal to an equal constant, fails.', async ({
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

  //配置判断节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'condition', exact: true }).click();
  await page.getByLabel('action-Action-Submit-workflows').click();
  const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
  const conditionNode = new ConditionYesNode(page, conditionNodeName);
  await conditionNode.nodeConfigure.click();
  await conditionNode.formulaRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  const conditionalRightConstant = faker.string.alphanumeric(10);
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`!='${conditionalRightConstant}'`, { delay: 50 });
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!='${conditionalRightConstant}'`,
  );
  await conditionNode.submitButton.click();
  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = conditionalRightConstant;
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
  expect(getWorkflowNodeExecutionsObjResult).toBe(false);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event Add Data Trigger, Formula engine, determines that the trigger node single line text field variable is not equal to an unequal constant, passes.', async ({
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

  //配置判断节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
  await collectionTriggerNode.addNodeButton.click();
  await page.getByRole('button', { name: 'condition', exact: true }).click();
  await page.getByLabel('action-Action-Submit-workflows').click();
  const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
  const conditionNode = new ConditionYesNode(page, conditionNodeName);
  await conditionNode.nodeConfigure.click();
  await conditionNode.formulaRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  const conditionalRightConstant = faker.string.alphanumeric(10);
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`!='${conditionalRightConstant}'`, { delay: 50 });
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!='${conditionalRightConstant}'`,
  );
  await conditionNode.submitButton.click();

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
  expect(getWorkflowNodeExecutionsObjResult).toBe(true);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, Formula engine, determine the trigger node integer variable is equal to the query node equal integer variable, pass.', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);

  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'staffnum';
  const triggerNodeFieldDisplayName = '员工人数(整数)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  const triggerNodeCollectionRecordOne = faker.number.int();
  await mockRecords(triggerNodeCollectionName, [{ staffnum: triggerNodeCollectionRecordOne }]);
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

  //配置判断节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const preQueryRecordNodePom = new QueryRecordNode(page, preQueryRecordNodeTitle);
  await preQueryRecordNodePom.addNodeButton.click();
  await page.getByRole('button', { name: 'condition', exact: true }).click();
  await page.getByLabel('action-Action-Submit-workflows').click();
  const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
  const conditionNode = new ConditionYesNode(page, conditionNodeName);
  const conditionNodeId = await conditionNode.node.locator('.workflow-node-id').innerText();
  await conditionNode.nodeConfigure.click();
  await conditionNode.formulaRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`==`, { delay: 50 });
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
  await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeTitle }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==Node result / ${preQueryRecordNodeTitle} / ${triggerNodeFieldDisplayName}`,
  );
  await conditionNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordTwo = faker.number.int();
  await mockRecords(triggerNodeCollectionName, [{ staffnum: triggerNodeCollectionRecordTwo }]);
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
  expect(job.result).toBe(true);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, Formula engine, determine trigger node integer variable is equal to query node not equal integer variable, not pass.', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);

  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'staffnum';
  const triggerNodeFieldDisplayName = '员工人数(整数)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  const triggerNodeCollectionRecordOne = faker.number.int();
  await mockRecords(triggerNodeCollectionName, [{ staffnum: triggerNodeCollectionRecordOne }]);
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
        filter: { $and: [{ id: { $ne: '{{$context.data.id}}' } }] },
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

  //配置判断节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const preQueryRecordNodePom = new QueryRecordNode(page, preQueryRecordNodeTitle);
  await preQueryRecordNodePom.addNodeButton.click();
  await page.getByRole('button', { name: 'condition', exact: true }).click();
  await page.getByLabel('action-Action-Submit-workflows').click();
  const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
  const conditionNode = new ConditionYesNode(page, conditionNodeName);
  const conditionNodeId = await conditionNode.node.locator('.workflow-node-id').innerText();
  await conditionNode.nodeConfigure.click();
  await conditionNode.formulaRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`==`, { delay: 50 });
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
  await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeTitle }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==Node result / ${preQueryRecordNodeTitle} / ${triggerNodeFieldDisplayName}`,
  );
  await conditionNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordTwo = faker.number.int();
  await mockRecords(triggerNodeCollectionName, [{ staffnum: triggerNodeCollectionRecordTwo }]);
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
  expect(job.result).toBe(false);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, Formula engine, determine trigger node integer variable is not equal to query node equal integer variable, not pass.', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);

  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'staffnum';
  const triggerNodeFieldDisplayName = '员工人数(整数)';
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

  //配置判断节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const preQueryRecordNodePom = new QueryRecordNode(page, preQueryRecordNodeTitle);
  await preQueryRecordNodePom.addNodeButton.click();
  await page.getByRole('button', { name: 'condition', exact: true }).click();
  await page.getByLabel('action-Action-Submit-workflows').click();
  const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
  const conditionNode = new ConditionYesNode(page, conditionNodeName);
  const conditionNodeId = await conditionNode.node.locator('.workflow-node-id').innerText();
  await conditionNode.nodeConfigure.click();
  await conditionNode.formulaRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`!=`, { delay: 50 });
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
  await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeTitle }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!=Node result / ${preQueryRecordNodeTitle} / ${triggerNodeFieldDisplayName}`,
  );
  await conditionNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordTwo = faker.number.int();
  await mockRecords(triggerNodeCollectionName, [{ staffnum: triggerNodeCollectionRecordTwo }]);
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
  expect(job.result).toBe(false);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, Formula engine, determine the trigger node integer variable is not equal to the query node not equal integer variable, pass.', async ({
  page,
  mockCollections,
  mockRecords,
}) => {
  //数据表后缀标识
  const triggerNodeAppendText = faker.string.alphanumeric(5);

  //创建触发器节点数据表
  const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
  const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
  const triggerNodeFieldName = 'staffnum';
  const triggerNodeFieldDisplayName = '员工人数(整数)';
  await mockCollections(
    appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
      .collections,
  );
  const triggerNodeCollectionRecordOne = faker.number.int();
  await mockRecords(triggerNodeCollectionName, [{ staffnum: triggerNodeCollectionRecordOne }]);
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
        filter: { $and: [{ id: { $ne: '{{$context.data.id}}' } }] },
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

  //配置判断节点
  await page.goto(`admin/workflow/workflows/${workflowId}`);
  await page.waitForLoadState('load');
  const preQueryRecordNodePom = new QueryRecordNode(page, preQueryRecordNodeTitle);
  await preQueryRecordNodePom.addNodeButton.click();
  await page.getByRole('button', { name: 'condition', exact: true }).click();
  await page.getByLabel('action-Action-Submit-workflows').click();
  const conditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
  await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(conditionNodeName);
  const conditionNode = new ConditionYesNode(page, conditionNodeName);
  const conditionNodeId = await conditionNode.node.locator('.workflow-node-id').innerText();
  await conditionNode.nodeConfigure.click();
  await conditionNode.formulaRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`!=`, { delay: 50 });
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Node result' }).click();
  await page.getByRole('menuitemcheckbox', { name: preQueryRecordNodeTitle }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!=Node result / ${preQueryRecordNodeTitle} / ${triggerNodeFieldDisplayName}`,
  );
  await conditionNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordTwo = faker.number.int();
  await mockRecords(triggerNodeCollectionName, [{ staffnum: triggerNodeCollectionRecordTwo }]);
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
  expect(job.result).toBe(true);
  // 4、后置处理：删除工作流
  await apiDeleteWorkflow(workflowId);
});
