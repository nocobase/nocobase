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
  CalculationNode,
  CollectionTriggerNode,
  ConditionYesNode,
  ParallelBranchNode,
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

test.describe('Any succeeded', () => {
  test('All 3 branches were successful', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);

    // 创建触发器节点数据表
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
    //配置分支节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'parallel', exact: true }).click();
    const parallelBranchNodeTitle = 'Parallel branch' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Parallel branch-Parallel branch', { exact: true })
      .getByRole('textbox')
      .fill(parallelBranchNodeTitle);
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    // 添加一个分支
    const parallelBranchNode = new ParallelBranchNode(page, parallelBranchNodeTitle);
    const parallelBranchNodeId = await parallelBranchNode.node.locator('.workflow-node-id').innerText();
    await parallelBranchNode.nodeConfigure.click();
    await parallelBranchNode.anySucceededRadio.click();
    await parallelBranchNode.submitButton.click();
    await parallelBranchNode.addBranchButton.click();
    // 分支1添加判断节点
    await page.getByLabel(`add-button-parallel-${parallelBranchNodeTitle}-1`).click();
    await page.getByRole('button', { name: 'condition', exact: true }).click();
    await page.getByText('Continue when "Yes"').click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    const oneConditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(oneConditionNodeName);
    const oneConditionNode = new ConditionYesNode(page, oneConditionNodeName);
    const oneConditionNodeId = await oneConditionNode.node.locator('.workflow-node-id').innerText();
    await oneConditionNode.nodeConfigure.click();
    await oneConditionNode.formulaRadio.click();
    await oneConditionNode.conditionExpressionEditBox.fill('1==1');
    await oneConditionNode.submitButton.click();
    // 分支2添加判断节点
    await page.getByLabel(`add-button-parallel-${parallelBranchNodeTitle}-2`).click();
    await page.getByRole('button', { name: 'condition', exact: true }).click();
    await page.getByText('Continue when "Yes"').click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    const twoConditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(twoConditionNodeName);
    const twoConditionNode = new ConditionYesNode(page, twoConditionNodeName);
    const twoConditionNodeId = await twoConditionNode.node.locator('.workflow-node-id').innerText();
    await twoConditionNode.nodeConfigure.click();
    await twoConditionNode.formulaRadio.click();
    await twoConditionNode.conditionExpressionEditBox.fill('1==1');
    await twoConditionNode.submitButton.click();
    // 分支3添加判断节点
    await page.getByLabel(`add-button-parallel-${parallelBranchNodeTitle}-3`).click();
    await page.getByRole('button', { name: 'condition', exact: true }).click();
    await page.getByText('Continue when "Yes"').click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    const threeConditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(threeConditionNodeName);
    const threeConditionNode = new ConditionYesNode(page, threeConditionNodeName);
    const threeConditionNodeId = await threeConditionNode.node.locator('.workflow-node-id').innerText();
    await threeConditionNode.nodeConfigure.click();
    await threeConditionNode.formulaRadio.click();
    await threeConditionNode.conditionExpressionEditBox.fill('1==1');
    await threeConditionNode.submitButton.click();
    // 添加后置计算节点
    await parallelBranchNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const afterCalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Calculation-Calculation', { exact: true })
      .getByRole('textbox')
      .fill(afterCalCulationNodeName);
    const afterCalCulationNode = new CalculationNode(page, afterCalCulationNodeName);
    const afterCalCulationNodeId = await afterCalCulationNode.node.locator('.workflow-node-id').innerText();
    await afterCalCulationNode.nodeConfigure.click();
    await afterCalCulationNode.formulaCalculationEngine.click();
    await page.getByLabel('textbox').fill('4');
    await afterCalCulationNode.submitButton.click();
    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,判断节点全部通过，后置计算节点执行成功
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
    const parallelBranchNodeJob = jobs.find((job) => job.nodeId.toString() === parallelBranchNodeId);
    expect(parallelBranchNodeJob.status).toBe(1);
    const oneConditionNodeJob = jobs.find((job) => job.nodeId.toString() === oneConditionNodeId);
    expect(oneConditionNodeJob.status).toBe(1);
    expect(oneConditionNodeJob.result).toBe(true);
    const twoConditionNodeJob = jobs.find((job) => job.nodeId.toString() === twoConditionNodeId);
    expect(twoConditionNodeJob).toBe(undefined);
    const threeConditionNodeJob = jobs.find((job) => job.nodeId.toString() === threeConditionNodeId);
    expect(threeConditionNodeJob).toBe(undefined);
    const afterCalCulationNodeJob = jobs.find((job) => job.nodeId.toString() === afterCalCulationNodeId);
    expect(afterCalCulationNodeJob.status).toBe(1);
    expect(afterCalCulationNodeJob.result).toBe(4);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Branch 1 failed, 2 and 3 succeeded', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);

    // 创建触发器节点数据表
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
    //配置分支节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'parallel', exact: true }).click();
    const parallelBranchNodeTitle = 'Parallel branch' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Parallel branch-Parallel branch', { exact: true })
      .getByRole('textbox')
      .fill(parallelBranchNodeTitle);
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    // 添加一个分支
    const parallelBranchNode = new ParallelBranchNode(page, parallelBranchNodeTitle);
    const parallelBranchNodeId = await parallelBranchNode.node.locator('.workflow-node-id').innerText();
    await parallelBranchNode.nodeConfigure.click();
    await parallelBranchNode.anySucceededRadio.click();
    await parallelBranchNode.submitButton.click();
    await parallelBranchNode.addBranchButton.click();
    // 分支1添加判断节点
    await page.getByLabel(`add-button-parallel-${parallelBranchNodeTitle}-1`).click();
    await page.getByRole('button', { name: 'condition', exact: true }).click();
    await page.getByText('Continue when "Yes"').click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    const oneConditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(oneConditionNodeName);
    const oneConditionNode = new ConditionYesNode(page, oneConditionNodeName);
    const oneConditionNodeId = await oneConditionNode.node.locator('.workflow-node-id').innerText();
    await oneConditionNode.nodeConfigure.click();
    await oneConditionNode.formulaRadio.click();
    await oneConditionNode.conditionExpressionEditBox.fill('1==2');
    await oneConditionNode.submitButton.click();
    // 分支2添加判断节点
    await page.getByLabel(`add-button-parallel-${parallelBranchNodeTitle}-2`).click();
    await page.getByRole('button', { name: 'condition', exact: true }).click();
    await page.getByText('Continue when "Yes"').click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    const twoConditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(twoConditionNodeName);
    const twoConditionNode = new ConditionYesNode(page, twoConditionNodeName);
    const twoConditionNodeId = await twoConditionNode.node.locator('.workflow-node-id').innerText();
    await twoConditionNode.nodeConfigure.click();
    await twoConditionNode.formulaRadio.click();
    await twoConditionNode.conditionExpressionEditBox.fill('1==1');
    await twoConditionNode.submitButton.click();
    // 分支3添加判断节点
    await page.getByLabel(`add-button-parallel-${parallelBranchNodeTitle}-3`).click();
    await page.getByRole('button', { name: 'condition', exact: true }).click();
    await page.getByText('Continue when "Yes"').click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    const threeConditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(threeConditionNodeName);
    const threeConditionNode = new ConditionYesNode(page, threeConditionNodeName);
    const threeConditionNodeId = await threeConditionNode.node.locator('.workflow-node-id').innerText();
    await threeConditionNode.nodeConfigure.click();
    await threeConditionNode.formulaRadio.click();
    await threeConditionNode.conditionExpressionEditBox.fill('1==1');
    await threeConditionNode.submitButton.click();
    // 添加后置计算节点
    await parallelBranchNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const afterCalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Calculation-Calculation', { exact: true })
      .getByRole('textbox')
      .fill(afterCalCulationNodeName);
    const afterCalCulationNode = new CalculationNode(page, afterCalCulationNodeName);
    const afterCalCulationNodeId = await afterCalCulationNode.node.locator('.workflow-node-id').innerText();
    await afterCalCulationNode.nodeConfigure.click();
    await afterCalCulationNode.formulaCalculationEngine.click();
    await page.getByLabel('textbox').fill('4');
    await afterCalCulationNode.submitButton.click();
    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,判断节点全部通过，后置计算节点执行成功
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
    const parallelBranchNodeJob = jobs.find((job) => job.nodeId.toString() === parallelBranchNodeId);
    expect(parallelBranchNodeJob.status).toBe(1);
    const oneConditionNodeJob = jobs.find((job) => job.nodeId.toString() === oneConditionNodeId);
    expect(oneConditionNodeJob.status).toBe(-1);
    expect(oneConditionNodeJob.result).toBe(false);
    const twoConditionNodeJob = jobs.find((job) => job.nodeId.toString() === twoConditionNodeId);
    expect(twoConditionNodeJob.status).toBe(1);
    expect(twoConditionNodeJob.result).toBe(true);
    const threeConditionNodeJob = jobs.find((job) => job.nodeId.toString() === threeConditionNodeId);
    expect(threeConditionNodeJob).toBe(undefined);
    const afterCalCulationNodeJob = jobs.find((job) => job.nodeId.toString() === afterCalCulationNodeId);
    expect(afterCalCulationNodeJob.status).toBe(1);
    expect(afterCalCulationNodeJob.result).toBe(4);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Branches all failed', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);

    // 创建触发器节点数据表
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
    //配置分支节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'parallel', exact: true }).click();
    const parallelBranchNodeTitle = 'Parallel branch' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Parallel branch-Parallel branch', { exact: true })
      .getByRole('textbox')
      .fill(parallelBranchNodeTitle);
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    // 添加一个分支
    const parallelBranchNode = new ParallelBranchNode(page, parallelBranchNodeTitle);
    const parallelBranchNodeId = await parallelBranchNode.node.locator('.workflow-node-id').innerText();
    await parallelBranchNode.nodeConfigure.click();
    await parallelBranchNode.anySucceededRadio.click();
    await parallelBranchNode.submitButton.click();
    await parallelBranchNode.addBranchButton.click();
    // 分支1添加判断节点
    await page.getByLabel(`add-button-parallel-${parallelBranchNodeTitle}-1`).click();
    await page.getByRole('button', { name: 'condition', exact: true }).click();
    await page.getByText('Continue when "Yes"').click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    const oneConditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(oneConditionNodeName);
    const oneConditionNode = new ConditionYesNode(page, oneConditionNodeName);
    const oneConditionNodeId = await oneConditionNode.node.locator('.workflow-node-id').innerText();
    await oneConditionNode.nodeConfigure.click();
    await oneConditionNode.formulaRadio.click();
    await oneConditionNode.conditionExpressionEditBox.fill('1==2');
    await oneConditionNode.submitButton.click();
    // 分支2添加判断节点
    await page.getByLabel(`add-button-parallel-${parallelBranchNodeTitle}-2`).click();
    await page.getByRole('button', { name: 'condition', exact: true }).click();
    await page.getByText('Continue when "Yes"').click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    const twoConditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(twoConditionNodeName);
    const twoConditionNode = new ConditionYesNode(page, twoConditionNodeName);
    const twoConditionNodeId = await twoConditionNode.node.locator('.workflow-node-id').innerText();
    await twoConditionNode.nodeConfigure.click();
    await twoConditionNode.formulaRadio.click();
    await twoConditionNode.conditionExpressionEditBox.fill('1==2');
    await twoConditionNode.submitButton.click();
    // 分支3添加判断节点
    await page.getByLabel(`add-button-parallel-${parallelBranchNodeTitle}-3`).click();
    await page.getByRole('button', { name: 'condition', exact: true }).click();
    await page.getByText('Continue when "Yes"').click();
    await page.getByLabel('action-Action-Submit-workflows').click();
    const threeConditionNodeName = 'condition' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Condition-Condition', { exact: true }).getByRole('textbox').fill(threeConditionNodeName);
    const threeConditionNode = new ConditionYesNode(page, threeConditionNodeName);
    const threeConditionNodeId = await threeConditionNode.node.locator('.workflow-node-id').innerText();
    await threeConditionNode.nodeConfigure.click();
    await threeConditionNode.formulaRadio.click();
    await threeConditionNode.conditionExpressionEditBox.fill('1==2');
    await threeConditionNode.submitButton.click();
    // 添加后置计算节点
    await parallelBranchNode.addNodeButton.click();
    await page.getByRole('button', { name: 'calculation', exact: true }).click();
    const afterCalCulationNodeName = 'calculation' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page
      .getByLabel('Calculation-Calculation', { exact: true })
      .getByRole('textbox')
      .fill(afterCalCulationNodeName);
    const afterCalCulationNode = new CalculationNode(page, afterCalCulationNodeName);
    const afterCalCulationNodeId = await afterCalCulationNode.node.locator('.workflow-node-id').innerText();
    await afterCalCulationNode.nodeConfigure.click();
    await afterCalCulationNode.formulaCalculationEngine.click();
    await page.getByLabel('textbox').fill('4');
    await afterCalCulationNode.submitButton.click();
    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,判断节点全部通过，后置计算节点执行成功
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
    const parallelBranchNodeJob = jobs.find((job) => job.nodeId.toString() === parallelBranchNodeId);
    expect(parallelBranchNodeJob.status).toBe(-1);
    const oneConditionNodeJob = jobs.find((job) => job.nodeId.toString() === oneConditionNodeId);
    expect(oneConditionNodeJob.status).toBe(-1);
    expect(oneConditionNodeJob.result).toBe(false);
    const twoConditionNodeJob = jobs.find((job) => job.nodeId.toString() === twoConditionNodeId);
    expect(twoConditionNodeJob.status).toBe(-1);
    expect(twoConditionNodeJob.result).toBe(false);
    const threeConditionNodeJob = jobs.find((job) => job.nodeId.toString() === threeConditionNodeId);
    expect(threeConditionNodeJob.status).toBe(-1);
    expect(threeConditionNodeJob.result).toBe(false);
    const afterCalCulationNodeJob = jobs.find((job) => job.nodeId.toString() === afterCalCulationNodeId);
    expect(afterCalCulationNodeJob).toBe(undefined);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});
