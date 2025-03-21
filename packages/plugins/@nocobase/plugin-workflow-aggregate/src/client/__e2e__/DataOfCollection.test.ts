/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { round } from 'mathjs';
import { faker } from '@faker-js/faker';
import {
  AggregateNode,
  CollectionTriggerNode,
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
test.describe('filter', () => {
  test('Collection event add data trigger, normal table integer fields not de-emphasised COUNT', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectionData = [
      { staffnum: 3, regcapital: 3.12 },
      { staffnum: 3, regcapital: 3.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 5, regcapital: 5.6 },
    ];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: aggregateNodeCollectionDisplayName }).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    // 过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('3');
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const aggregateNodeJob = jobs.find((job) => job.nodeId.toString() === aggregateRecordNodeId);
    const aggregateNodeJobResult = aggregateNodeJob.result;
    expect(aggregateNodeJobResult).toBe(3);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event add data trigger, normal table integer fields not de-emphasised SUM', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectionData = [
      { staffnum: 3, regcapital: 3.12 },
      { staffnum: 3, regcapital: 3.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 5, regcapital: 5.6 },
    ];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.sumRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: aggregateNodeCollectionDisplayName }).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    // 过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('3');
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const aggregateNodeJob = jobs.find((job) => job.nodeId.toString() === aggregateRecordNodeId);
    const aggregateNodeJobResult = aggregateNodeJob.result;
    const aggregateNodeCollectionDataFilter = aggregateNodeCollectionData.filter((item) => item.staffnum > 3);
    // aggregateNodeCollectionDataFilter中staffnum字段值的总和
    const aggregateNodeCollectionDataFilterSum = aggregateNodeCollectionDataFilter.reduce((total, currentValue) => {
      return total + currentValue.staffnum;
    }, 0);
    expect(aggregateNodeJobResult).toBe(aggregateNodeCollectionDataFilterSum);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event add data trigger, normal table integer fields not de-emphasised AVG', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectionData = [
      { staffnum: 3, regcapital: 3.12 },
      { staffnum: 3, regcapital: 3.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 5, regcapital: 5.6 },
    ];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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
    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.avgRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: aggregateNodeCollectionDisplayName }).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    // 过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('3');
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const aggregateNodeJob = jobs.find((job) => job.nodeId.toString() === aggregateRecordNodeId);
    const aggregateNodeJobResult = aggregateNodeJob.result;
    // aggregateNodeCollectionData中staffnum字段值大于3的元素个数
    const aggregateNodeCollectionDataCount = aggregateNodeCollectionData.reduce((total, currentValue) => {
      return currentValue.staffnum > 3 ? total + 1 : total;
    }, 0);
    // aggregateNodeCollectionData中staffnum字段值大于3的平均值
    const aggregateNodeCollectionDataAvg =
      aggregateNodeCollectionData.reduce((total, currentValue) => {
        return currentValue.staffnum > 3 ? total + currentValue.staffnum : total;
      }, 0) / aggregateNodeCollectionDataCount;
    expect(aggregateNodeJobResult).toBe(round(aggregateNodeCollectionDataAvg, 2));
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event add data trigger, normal table integer fields not de-emphasised MIN', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectionData = [
      { staffnum: 3, regcapital: 3.12 },
      { staffnum: 3, regcapital: 3.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 5, regcapital: 5.6 },
    ];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.minRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: aggregateNodeCollectionDisplayName }).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    // 过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('3');
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const aggregateNodeJob = jobs.find((job) => job.nodeId.toString() === aggregateRecordNodeId);
    const aggregateNodeJobResult = aggregateNodeJob.result;
    const aggregateNodeCollectionDataFilter = aggregateNodeCollectionData.filter((item) => item.staffnum > 3);
    // aggregateNodeCollectionDataFilter中staffnum字段值的最小值
    const aggregateNodeCollectionDataMin = aggregateNodeCollectionDataFilter.reduce((min, currentValue) => {
      return currentValue.staffnum < min ? currentValue.staffnum : min;
    }, aggregateNodeCollectionDataFilter[0].staffnum);
    expect(aggregateNodeJobResult).toBe(aggregateNodeCollectionDataMin);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event add data trigger, normal table integer fields not de-emphasised MAX', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectionData = [
      { staffnum: 3, regcapital: 3.12 },
      { staffnum: 3, regcapital: 3.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 5, regcapital: 5.6 },
    ];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.maxRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: aggregateNodeCollectionDisplayName }).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    // 过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('3');
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const aggregateNodeJob = jobs.find((job) => job.nodeId.toString() === aggregateRecordNodeId);
    const aggregateNodeJobResult = aggregateNodeJob.result;
    const aggregateNodeCollectionDataFilter = aggregateNodeCollectionData.filter((item) => item.staffnum > 3);
    // aggregateNodeCollectionDataFilter中staffnum最大值
    const aggregateNodeCollectionDataMax = aggregateNodeCollectionDataFilter.reduce((max, currentValue) => {
      return currentValue.staffnum > max ? currentValue.staffnum : max;
    }, aggregateNodeCollectionDataFilter[0].staffnum);
    expect(aggregateNodeJobResult).toBe(aggregateNodeCollectionDataMax);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event add data trigger, normal table integer fields de-weighting COUNT', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectionData = [
      { staffnum: 3, regcapital: 3.12 },
      { staffnum: 3, regcapital: 3.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 5, regcapital: 5.6 },
    ];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: aggregateNodeCollectionDisplayName }).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.distinctCheckBox.click();
    // 过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('3');
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const aggregateNodeJob = jobs.find((job) => job.nodeId.toString() === aggregateRecordNodeId);
    const aggregateNodeJobResult = aggregateNodeJob.result;
    expect(aggregateNodeJobResult).toBe(2);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test.skip('Collection event add data trigger, normal table integer fields de-weighting SUM', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectionData = [
      { staffnum: 3, regcapital: 3.12 },
      { staffnum: 3, regcapital: 3.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 5, regcapital: 5.6 },
    ];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.sumRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: aggregateNodeCollectionDisplayName }).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.distinctCheckBox.click();
    // 过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('3');
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const aggregateNodeJob = jobs.find((job) => job.nodeId.toString() === aggregateRecordNodeId);
    const aggregateNodeJobResult = aggregateNodeJob.result;
    const aggregateNodeCollectionDataFilter = aggregateNodeCollectionData.filter((item) => item.staffnum > 3);
    // aggregateNodeCollectionData中staffnum字段值去重
    const aggregateNodeCollectionDataDistinct = [
      ...new Set(aggregateNodeCollectionDataFilter.map((item) => item.staffnum)),
    ];
    // aggregateNodeCollectionDataDistinct中staffnum字段值大于3的总和
    const aggregateNodeCollectionDataDistinctSum = aggregateNodeCollectionDataDistinct.reduce((total, currentValue) => {
      return currentValue > 3 ? total + currentValue : total;
    }, 0);
    expect(aggregateNodeJobResult).toBe(aggregateNodeCollectionDataDistinctSum);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test.skip('Collection event add data trigger, normal table integer fields de-weighting AVG', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectionData = [
      { staffnum: 3, regcapital: 3.12 },
      { staffnum: 3, regcapital: 3.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 5, regcapital: 5.6 },
    ];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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
    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.avgRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: aggregateNodeCollectionDisplayName }).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.distinctCheckBox.click();
    // 过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('3');
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const aggregateNodeJob = jobs.find((job) => job.nodeId.toString() === aggregateRecordNodeId);
    const aggregateNodeJobResult = aggregateNodeJob.result;
    const aggregateNodeCollectionDataFilter = aggregateNodeCollectionData.filter((item) => item.staffnum > 3);
    // aggregateNodeCollectionData中staffnum字段值去重
    const aggregateNodeCollectionDataDistinct = [
      ...new Set(aggregateNodeCollectionDataFilter.map((item) => item.staffnum)),
    ];
    // aggregateNodeCollectionDataDistinct中staffnum字段值大于3的元素个数
    const aggregateNodeCollectionDataDistinctCount = aggregateNodeCollectionDataDistinct.reduce(
      (count, currentValue) => {
        return currentValue > 3 ? count + 1 : count;
      },
      0,
    );
    // aggregateNodeCollectionDataDistinct中staffnum字段值大于3的平均值
    const aggregateNodeCollectionDataDistinctAvg =
      aggregateNodeCollectionDataDistinct.reduce((total, currentValue) => {
        return currentValue > 3 ? total + currentValue : total;
      }, 0) / aggregateNodeCollectionDataDistinctCount;
    expect(aggregateNodeJobResult).toBe(aggregateNodeCollectionDataDistinctAvg);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test.skip('Collection event add data trigger, normal table integer fields de-weighting MIN', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectionData = [
      { staffnum: 3, regcapital: 3.12 },
      { staffnum: 3, regcapital: 3.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 5, regcapital: 5.6 },
    ];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.minRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: aggregateNodeCollectionDisplayName }).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.distinctCheckBox.click();
    // 过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('3');
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const aggregateNodeJob = jobs.find((job) => job.nodeId.toString() === aggregateRecordNodeId);
    const aggregateNodeJobResult = aggregateNodeJob.result;
    const aggregateNodeCollectionDataFilter = aggregateNodeCollectionData.filter((item) => item.staffnum > 3);
    // aggregateNodeCollectionDataFilter中staffnum最小值
    const aggregateNodeCollectionDataMin = aggregateNodeCollectionDataFilter.reduce((min, currentValue) => {
      return currentValue.staffnum < min ? currentValue.staffnum : min;
    }, aggregateNodeCollectionDataFilter[0].staffnum);
    expect(aggregateNodeJobResult).toBe(aggregateNodeCollectionDataMin);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test.skip('Collection event add data trigger, normal table integer fields de-weighting MAX', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText)
        .collections,
    );
    const aggregateNodeCollectionData = [
      { staffnum: 3, regcapital: 3.12 },
      { staffnum: 3, regcapital: 3.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 4, regcapital: 4.6 },
      { staffnum: 5, regcapital: 5.6 },
    ];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

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

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.maxRadio.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: aggregateNodeCollectionDisplayName }).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    await page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.distinctCheckBox.click();
    // 过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.getByRole('option', { name: '>' }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('spinbutton').fill('3');
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const aggregateNodeJob = jobs.find((job) => job.nodeId.toString() === aggregateRecordNodeId);
    const aggregateNodeJobResult = aggregateNodeJob.result;
    const aggregateNodeCollectionDataFilter = aggregateNodeCollectionData.filter((item) => item.staffnum > 3);
    // aggregateNodeCollectionDataFilter中staffnum最大值
    const aggregateNodeCollectionDataMax = aggregateNodeCollectionDataFilter.reduce((max, currentValue) => {
      return currentValue.staffnum > max ? currentValue.staffnum : max;
    }, aggregateNodeCollectionDataFilter[0].staffnum);
    expect(aggregateNodeJobResult).toBe(aggregateNodeCollectionDataMax);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});
