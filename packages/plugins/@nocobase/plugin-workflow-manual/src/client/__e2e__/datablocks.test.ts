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
  CreateRecordNode,
  ManualNode,
  apiCreateWorkflow,
  apiCreateWorkflowNode,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiGetWorkflowNode,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test.describe('relation field data', () => {});

test.describe('field data', () => {
  test('Collection event to add a data trigger, get create record node data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    const createRecordNodeAppendText = 'c' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建create record节点数据表
    const createRecordNodeCollectionDisplayName = `自动>组织[普通表]${createRecordNodeAppendText}`;
    const createRecordNodeCollectionName = `tt_amt_org${createRecordNodeAppendText}`;
    const createRecordNodeFieldName = 'orgname';
    const createRecordNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), createRecordNodeAppendText)
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

    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const preCreateRecordNodePom = new CreateRecordNode(page, preCreateRecordNodeTitle);
    await preCreateRecordNodePom.addNodeButton.click();
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
    await manualNode.nodeDataMenu.hover();
    await page.getByRole('menuitem', { name: preCreateRecordNodeTitle }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.getByText('Configure fields').hover();
    await page.getByRole('menuitem', { name: triggerNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();

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
    await expect(page.getByText(triggerNodeCollectionRecordOne)).toBeAttached();
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, get aggregate node data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    const aggregateNodeAppendText = 'c' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建aggregate节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'orgname';
    const aggregateNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectioRecordOne = [
      { orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 },
    ];
    const aggregateNodeCollectioRecordTwo = [
      { orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 },
    ];
    const aggregateNodeCollectioRecordThree = [
      { orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 },
    ];
    const aggregateNodeCollectioRecordFour = [
      { orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 },
    ];
    const aggregateNodeCollectioRecordFive = [
      { orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 },
    ];
    const aggregateNodeCollectioRecordSix = [
      { orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 },
    ];
    const aggregateNodeCollectioRecordSeven = [
      { orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 },
    ];
    const aggregateNodeCollectioRecordEight = [
      { orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 },
    ];
    await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectioRecordOne);
    await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectioRecordTwo);
    await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectioRecordThree);
    await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectioRecordFour);
    await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectioRecordFive);
    await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectioRecordSix);
    await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectioRecordSeven);
    await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectioRecordEight);
    // 创建Manual节点数据表
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
        collection: aggregateNodeCollectionName,
      },
    };
    const preAggregateNode = await apiCreateWorkflowNode(workflowId, preAggregateNodeData);
    const preAggregateNodeObj = JSON.parse(JSON.stringify(preAggregateNode));
    const preAggregateNodeId = preAggregateNodeObj.id;
    const getPreAggregateNode = await apiGetWorkflowNode(preAggregateNodeId);
    const preAggregateNodeKey = getPreAggregateNode.key;

    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const preAggregateNodePom = new AggregateNode(page, preAggregateNodeTitle);
    await preAggregateNodePom.addNodeButton.click();
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
    await manualNode.nodeDataMenu.hover();
    await page.getByRole('menuitem', { name: preAggregateNodeTitle }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();

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
    // await expect(page.getByText('8')).toBeAttached();
    await expect(
      page
        .getByLabel(`block-item-CardItem-workflowManualTasks-${preAggregateNodeTitle}`)
        .locator('.ant-card-body')
        .getByText('8'),
    ).toBeAttached();
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});
