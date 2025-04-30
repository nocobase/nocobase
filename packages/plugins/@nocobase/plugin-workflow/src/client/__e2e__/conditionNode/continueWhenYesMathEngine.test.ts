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

test('Collection event add data trigger, Math engine, determine trigger node integer field variable is equal to an equal constant, pass.', async ({
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
  const conditionNodeId = await conditionNode.node.locator('.workflow-node-id').innerText();
  await conditionNode.nodeConfigure.click();
  await conditionNode.mathRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  const conditionalRightConstant = faker.number.int({ max: 1000 });
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`==${conditionalRightConstant}`, { delay: 50 });
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==${conditionalRightConstant}`,
  );
  await conditionNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = conditionalRightConstant;
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { staffnum: triggerNodeCollectionRecordOne },
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

test('Collection event Add Data Trigger, Math engine, determines that the trigger node integer field variable is equal to an unequal constant, fails.', async ({
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
  const conditionNodeId = await conditionNode.node.locator('.workflow-node-id').innerText();
  await conditionNode.nodeConfigure.click();
  await conditionNode.mathRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  const conditionalRightConstant = faker.number.int({ max: 1000 });
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`==${conditionalRightConstant}`, { delay: 50 });
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}==${conditionalRightConstant}`,
  );
  await conditionNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = faker.number.int();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { staffnum: triggerNodeCollectionRecordOne },
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

test('Collection event Add Data Trigger, Math engine, determines that the trigger node integer field variable is not equal to an equal constant, fails.', async ({
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
  await conditionNode.mathRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  const conditionalRightConstant = faker.number.int({ max: 1000 });
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`!=${conditionalRightConstant}`, { delay: 50 });
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!=${conditionalRightConstant}`,
  );
  await conditionNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = conditionalRightConstant;
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { staffnum: triggerNodeCollectionRecordOne },
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

test('Collection event add data trigger, Math engine, determines that the trigger node integer field variable is not equal to an unequal constant, passes.', async ({
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
  await conditionNode.mathRadio.click();
  await page.getByLabel('variable-button').click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
  await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
  const conditionalRightConstant = faker.number.int({ max: 1000 });
  await page.waitForTimeout(500);
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .press('ArrowRight');
  await page
    .getByLabel('block-item-WorkflowVariableTextArea-workflows-Condition expression')
    .getByLabel('textbox')
    .pressSequentially(`!=${conditionalRightConstant}`, { delay: 50 });
  await expect(conditionNode.conditionExpressionEditBox).toHaveText(
    `Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}!=${conditionalRightConstant}`,
  );
  await conditionNode.submitButton.click();

  // 2、测试步骤：添加数据触发工作流
  const triggerNodeCollectionRecordOne = faker.number.int();
  const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
    { staffnum: triggerNodeCollectionRecordOne },
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
