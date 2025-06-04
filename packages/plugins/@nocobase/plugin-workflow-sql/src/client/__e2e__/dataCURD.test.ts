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
  CreateWorkFlow,
  EditWorkFlow,
  WorkflowListRecords,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiUpdateRecord,
  apiGetWorkflowNodeExecutions,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
  QueryRecordNode,
  SQLNode,
  apiGetRecord,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test.describe('select data', () => {
  test('No variable SQL, select 1 record', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建SQL节点数据表
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
        .collections,
    );
    const SQLNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const SQLNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 }];
    const SQLNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 }];
    const SQLNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 }];
    const SQLNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 }];
    const SQLNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 }];
    const SQLNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 }];
    const SQLNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 }];
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordOne);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordTwo);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordThree);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFour);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFive);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSix);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSeven);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordEight);
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(`select * from ${SQLNodeCollectionName} where id = 1`);
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordOrgname = sqlNodeJobResult[0].orgname;
    expect(nodeResultRecordOrgname).toBe('公司名称(单行文本)1');
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('No variable SQL, select Multiple Records', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
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
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
        .collections,
    );
    const SQLNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const SQLNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 }];
    const SQLNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 }];
    const SQLNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 }];
    const SQLNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 }];
    const SQLNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 }];
    const SQLNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 }];
    const SQLNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 }];
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordOne);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordTwo);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordThree);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFour);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFive);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSix);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSeven);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordEight);
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(`select * from ${SQLNodeCollectionName}`);
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordLength = sqlNodeJobResult.length;
    expect(nodeResultRecordLength).toBe(8);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Variables as where condition, select 1 record', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建SQL节点数据表
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
        .collections,
    );
    const SQLNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const SQLNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 }];
    const SQLNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 }];
    const SQLNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 }];
    const SQLNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 }];
    const SQLNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 }];
    const SQLNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 }];
    const SQLNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 }];
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordOne);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordTwo);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordThree);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFour);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFive);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSix);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSeven);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordEight);
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(`select * from ${SQLNodeCollectionName} where id = `);
    await sqlNode.sqlEditBox.focus();
    await page.keyboard.type(``);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordOrgname = sqlNodeJobResult[0].orgname;
    expect(nodeResultRecordOrgname).toBe('公司名称(单行文本)1');
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Variables as where condition, select Multiple Records', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建SQL节点数据表
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
        .collections,
    );
    const SQLNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const SQLNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 }];
    const SQLNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 }];
    const SQLNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 }];
    const SQLNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 }];
    const SQLNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 }];
    const SQLNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 }];
    const SQLNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 }];
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordOne);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordTwo);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordThree);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFour);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFive);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSix);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSeven);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordEight);
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(`select * from ${SQLNodeCollectionName} where id <> `);
    await sqlNode.sqlEditBox.focus();
    await page.keyboard.type(``);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordLength = sqlNodeJobResult.length;
    expect(nodeResultRecordLength).toBe(7);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Variables as field data, select 1 record', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建SQL节点数据表
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
        .collections,
    );
    const SQLNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const SQLNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 }];
    const SQLNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 }];
    const SQLNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 }];
    const SQLNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 }];
    const SQLNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 }];
    const SQLNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 }];
    const SQLNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 }];
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordOne);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordTwo);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordThree);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFour);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFive);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSix);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSeven);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordEight);
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(`select '`);
    await sqlNode.sqlEditBox.focus();
    await page.keyboard.type(``);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)', exact: true }).click();
    await sqlNode.sqlEditBox.click();
    await sqlNode.sqlEditBox.focus();
    await page.keyboard.type(`' as orgname from ${SQLNodeCollectionName} where id =1`);
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordOrgname = sqlNodeJobResult[0].orgname;
    expect(nodeResultRecordOrgname).toBe(triggerNodeCollectionRecordOne);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Variables as field data, select Multiple Records', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建SQL节点数据表
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
        .collections,
    );
    const SQLNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const SQLNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 }];
    const SQLNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 }];
    const SQLNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 }];
    const SQLNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 }];
    const SQLNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 }];
    const SQLNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 }];
    const SQLNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 }];
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordOne);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordTwo);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordThree);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFour);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFive);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSix);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSeven);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordEight);
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(`select '`);
    await sqlNode.sqlEditBox.focus();
    await page.keyboard.type(``);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)', exact: true }).click();
    await sqlNode.sqlEditBox.click();
    await sqlNode.sqlEditBox.focus();
    await page.keyboard.type(`' as orgname from ${SQLNodeCollectionName}`);
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordLength = sqlNodeJobResult.length;
    expect(nodeResultRecordLength).toBe(8);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('insert data', () => {
  test('No variable SQL, insert values,insert 1 record', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
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
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(
      `insert into ${SQLNodeCollectionName}(orgname,status_singleselect,staffnum) values('公司名称(单行文本)1','1',10) returning *`,
    );
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordOrgname = sqlNodeJobResult[0].orgname;
    expect(nodeResultRecordOrgname).toBe('公司名称(单行文本)1');

    const insertRecordId = sqlNodeJobResult[0].id;
    const getRecords = await apiGetRecord(SQLNodeCollectionName, insertRecordId);
    const getRecordsObj = JSON.parse(JSON.stringify(getRecords));
    expect(getRecordsObj.orgname).toBe('公司名称(单行文本)1');

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('No variable SQL, insert values, insert Multiple Records', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
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
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(
      `insert into ${SQLNodeCollectionName}(orgname,status_singleselect,staffnum) values('公司名称(单行文本)1','1',10),('公司名称(单行文本)2','1',20),('公司名称(单行文本)3','1',30) returning *`,
    );
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordLength = sqlNodeJobResult.length;
    expect(nodeResultRecordLength).toBe(3);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('The variable is the values value, insert 1 record', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建SQL节点数据表
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(
      `insert into ${SQLNodeCollectionName}(orgname,status_singleselect,staffnum) values('`,
    );
    await sqlNode.sqlEditBox.click({ clickCount: 3 });
    await page.keyboard.press('ArrowRight');
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司名称(单行文本)', exact: true }).click();
    await sqlNode.sqlEditBox.click({ clickCount: 3 });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type(`','`);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: '公司状态(下拉单选)', exact: true }).click();
    await sqlNode.sqlEditBox.click({ clickCount: 3 });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type(`',`);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: '员工人数(整数)', exact: true }).click();
    await sqlNode.sqlEditBox.click({ clickCount: 3 });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type(`) returning *`);
    await sqlNode.submitButton.click();
    // 2、测试步骤：添加数据触发工作流
    await mockRecords(triggerNodeCollectionName, [
      { orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 },
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
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordOrgname = sqlNodeJobResult[0].orgname;
    expect(nodeResultRecordOrgname).toBe('公司名称(单行文本)1');
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('update data', () => {
  test('No variable SQL', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
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
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
        .collections,
    );
    const SQLNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const SQLNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 }];
    const SQLNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 }];
    const SQLNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 }];
    const SQLNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 }];
    const SQLNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 }];
    const SQLNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 }];
    const SQLNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 }];
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordOne);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordTwo);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordThree);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFour);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFive);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSix);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSeven);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordEight);
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(`update ${SQLNodeCollectionName} set orgname='orgname' returning *`);
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordLength = sqlNodeJobResult.length;
    expect(nodeResultRecordLength).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Variables as where condition', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
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
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
        .collections,
    );
    const SQLNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const SQLNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 }];
    const SQLNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 }];
    const SQLNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 }];
    const SQLNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 }];
    const SQLNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 }];
    const SQLNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 }];
    const SQLNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 }];
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordOne);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordTwo);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordThree);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFour);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFive);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSix);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSeven);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordEight);
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(`update ${SQLNodeCollectionName} set orgname='orgname' where id=`);
    await sqlNode.sqlEditBox.click({ clickCount: 3 });
    await page.keyboard.press('ArrowRight');
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await sqlNode.sqlEditBox.click({ clickCount: 3 });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type(` returning *`);
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordOrgname = sqlNodeJobResult[0].orgname;
    expect(nodeResultRecordOrgname).toBe('orgname');

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('delete data', () => {
  test('No variable SQL', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
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
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
        .collections,
    );
    const SQLNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const SQLNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 }];
    const SQLNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 }];
    const SQLNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 }];
    const SQLNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 }];
    const SQLNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 }];
    const SQLNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 }];
    const SQLNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 }];
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordOne);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordTwo);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordThree);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFour);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFive);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSix);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSeven);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordEight);
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(`delete from ${SQLNodeCollectionName} where id=1  returning *`);
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordOrgname = sqlNodeJobResult[0].orgname;
    expect(nodeResultRecordOrgname).toBe('公司名称(单行文本)1');

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Variables as where condition', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const SQLNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
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
    const SQLNodeCollectionDisplayName = `自动>组织[普通表]${SQLNodeAppendText}`;
    const SQLNodeCollectionName = `tt_amt_org${SQLNodeAppendText}`;
    const SQLNodeFieldName = 'orgname';
    const SQLNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), SQLNodeAppendText)
        .collections,
    );
    const SQLNodeCollectioRecordOne = [{ orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 }];
    const SQLNodeCollectioRecordTwo = [{ orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 }];
    const SQLNodeCollectioRecordThree = [{ orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 }];
    const SQLNodeCollectioRecordFour = [{ orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 }];
    const SQLNodeCollectioRecordFive = [{ orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 }];
    const SQLNodeCollectioRecordSix = [{ orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 }];
    const SQLNodeCollectioRecordSeven = [{ orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 }];
    const SQLNodeCollectioRecordEight = [{ orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 }];
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordOne);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordTwo);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordThree);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFour);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordFive);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSix);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordSeven);
    await mockRecords(SQLNodeCollectionName, SQLNodeCollectioRecordEight);
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
    //配置SQL节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'sql', exact: true }).click();
    const sqlNodeName = 'SQL action' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('SQL action-SQL action', { exact: true }).getByRole('textbox').fill(sqlNodeName);
    const sqlNode = new SQLNode(page, sqlNodeName);
    const sqlNodeId = await sqlNode.node.locator('.workflow-node-id').innerText();
    await sqlNode.nodeConfigure.click();
    await sqlNode.sqlEditBox.fill(`delete from ${SQLNodeCollectionName} where id=`);
    await sqlNode.sqlEditBox.click({ clickCount: 3 });
    await page.keyboard.press('ArrowRight');
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await sqlNode.sqlEditBox.click({ clickCount: 3 });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type(` returning *`);
    await sqlNode.submitButton.click();

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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const sqlNodeJob = jobs.find((job) => job.nodeId.toString() === sqlNodeId);
    const sqlNodeJobResult = sqlNodeJob.result;
    const nodeResultRecordOrgname = sqlNodeJobResult[0].orgname;
    expect(nodeResultRecordOrgname).toBe('公司名称(单行文本)1');

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});
