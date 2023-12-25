import { apiCreateWorkflow } from '@nocobase/plugin-workflow-test/client';
import { apiUpdateWorkflow } from '@nocobase/plugin-workflow-test/client';
import { apiDeleteWorkflow } from '@nocobase/plugin-workflow-test/client';
import { apiGetWorkflow } from '@nocobase/plugin-workflow-test/client';
import { apiUpdateWorkflowTrigger } from '@nocobase/plugin-workflow-test/client';
import { apiGetWorkflowNodeExecutions } from '@nocobase/plugin-workflow-test/client';
import { apiCreateWorkflowNode } from '@nocobase/plugin-workflow-test/client';
import { apiUpdateWorkflowNode } from '@nocobase/plugin-workflow-test/client';
import { apiGetWorkflowNode } from '@nocobase/plugin-workflow-test/client';
import { apiUpdateRecord } from '@nocobase/plugin-workflow-test/client';
import { apiGetRecord } from '@nocobase/plugin-workflow-test/client';
import { apiGetList } from '@nocobase/plugin-workflow-test/client';
import { CreateWorkFlow } from '@nocobase/plugin-workflow-test/client';
import { EditWorkFlow } from '@nocobase/plugin-workflow-test/client';
import { WorkflowManagement } from '@nocobase/plugin-workflow-test/client';
import { WorkflowListRecords } from '@nocobase/plugin-workflow-test/client';
import { ApprovalTriggerNode } from '@nocobase/plugin-workflow-test/client';
import { ApprovalNode } from '@nocobase/plugin-workflow-test/client';
import { ScheduleTriggerNode } from '@nocobase/plugin-workflow-test/client';
import { CollectionTriggerNode } from '@nocobase/plugin-workflow-test/client';
import { FormEventTriggerNode } from '@nocobase/plugin-workflow-test/client';
import { ClculationNode } from '@nocobase/plugin-workflow-test/client';
import { QueryRecordNode } from '@nocobase/plugin-workflow-test/client';
import { CreateRecordNode } from '@nocobase/plugin-workflow-test/client';
import { UpdateRecordNode } from '@nocobase/plugin-workflow-test/client';
import { DeleteRecordNode } from '@nocobase/plugin-workflow-test/client';
import { AggregateNode } from '@nocobase/plugin-workflow-test/client';
import { ManualNode } from '@nocobase/plugin-workflow-test/client';
import { ConditionYesNode } from '@nocobase/plugin-workflow-test/client';
import { ConditionBranchNode } from '@nocobase/plugin-workflow-test/client';
import { generalWithNoRelationalFields } from '@nocobase/plugin-workflow-test/client';
import { appendJsonCollectionName } from '@nocobase/plugin-workflow-test/client';
import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';

test('Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised COUNT', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a'+faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b'+faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText).collections);
    const aggregateNodeCollectionData = [{staffnum:3,regcapital:3.12},{staffnum:3,regcapital:3.6},{staffnum:4,regcapital:4.6},{staffnum:4,regcapital:4.6},{staffnum:5,regcapital:5.6}];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "collection", "enabled": true };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = { "config": { "appends": [], "collection": triggerNodeCollectionName, "changed": [], "condition": { "$and": [] }, "mode": 1 } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'aggregate', exact: true }).click();
    const aggregateRecordNodeName = 'Aggregate' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Aggregate-Aggregate', { exact: true }).getByRole('textbox').fill(aggregateRecordNodeName);
    const aggregateRecordNode = new AggregateNode(page, aggregateRecordNodeName);
    const aggregateRecordNodeId = await aggregateRecordNode.node.locator('.workflow-node-id').innerText();
    await aggregateRecordNode.nodeConfigure.click();
    await aggregateRecordNode.collectionDropDown.click();
    await page.getByText(aggregateNodeCollectionDisplayName).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number; }, b: { id: number; }) {
        return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const queryRecordNodeJob = jobs.find(job => job.nodeId.toString() === aggregateRecordNodeId);
    const queryRecordNodeJobResult = queryRecordNodeJob.result;
    expect(queryRecordNodeJobResult).toBe(aggregateNodeCollectionData.length);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised SUM', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a'+faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b'+faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText).collections);
    const aggregateNodeCollectionData = [{staffnum:3,regcapital:3.12},{staffnum:3,regcapital:3.6},{staffnum:4,regcapital:4.6},{staffnum:4,regcapital:4.6},{staffnum:5,regcapital:5.6}];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "collection", "enabled": true };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = { "config": { "appends": [], "collection": triggerNodeCollectionName, "changed": [], "condition": { "$and": [] }, "mode": 1 } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
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
    await page.getByText(aggregateNodeCollectionDisplayName).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number; }, b: { id: number; }) {
        return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const queryRecordNodeJob = jobs.find(job => job.nodeId.toString() === aggregateRecordNodeId);
    const queryRecordNodeJobResult = queryRecordNodeJob.result;
    // aggregateNodeCollectionData中staffnum字段值总和
    const aggregateNodeCollectionDataSum = aggregateNodeCollectionData.reduce((total, currentValue) => {
        return total + currentValue.staffnum;
    }, 0);
    expect(queryRecordNodeJobResult).toBe(aggregateNodeCollectionDataSum);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised AVG', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a'+faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b'+faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText).collections);
    const aggregateNodeCollectionData = [{staffnum:3,regcapital:3.12},{staffnum:3,regcapital:3.6},{staffnum:4,regcapital:4.6},{staffnum:4,regcapital:4.6},{staffnum:5,regcapital:5.6}];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "collection", "enabled": true };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = { "config": { "appends": [], "collection": triggerNodeCollectionName, "changed": [], "condition": { "$and": [] }, "mode": 1 } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));
    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
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
    await page.getByText(aggregateNodeCollectionDisplayName).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number; }, b: { id: number; }) {
        return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const queryRecordNodeJob = jobs.find(job => job.nodeId.toString() === aggregateRecordNodeId);
    const queryRecordNodeJobResult = queryRecordNodeJob.result;
    // aggregateNodeCollectionData中staffnum字段值平均值
    const aggregateNodeCollectionDataAvg = aggregateNodeCollectionData.reduce((total, currentValue) => {
        return total + currentValue.staffnum;
    }, 0) / aggregateNodeCollectionData.length;
    expect(queryRecordNodeJobResult).toBe(aggregateNodeCollectionDataAvg);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised MIN', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a'+faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b'+faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText).collections);
    const aggregateNodeCollectionData = [{staffnum:3,regcapital:3.12},{staffnum:3,regcapital:3.6},{staffnum:4,regcapital:4.6},{staffnum:4,regcapital:4.6},{staffnum:5,regcapital:5.6}];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "collection", "enabled": true };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = { "config": { "appends": [], "collection": triggerNodeCollectionName, "changed": [], "condition": { "$and": [] }, "mode": 1 } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
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
    await page.getByText(aggregateNodeCollectionDisplayName).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number; }, b: { id: number; }) {
        return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const queryRecordNodeJob = jobs.find(job => job.nodeId.toString() === aggregateRecordNodeId);
    const queryRecordNodeJobResult = queryRecordNodeJob.result;
    // aggregateNodeCollectionData中staffnum字段值最小值
    const aggregateNodeCollectionDataMin = aggregateNodeCollectionData.reduce((min, currentValue) => {
        return currentValue.staffnum < min ? currentValue.staffnum : min;
    }, aggregateNodeCollectionData[0].staffnum);
    expect(queryRecordNodeJobResult).toBe(aggregateNodeCollectionDataMin);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event add data trigger, aggregated data table, no filtering, normal table integer fields not de-emphasised MAX', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a'+faker.string.alphanumeric(4);
    const aggregateNodeAppendText = 'b'+faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);

    // 创建聚合节点数据表
    const aggregateNodeCollectionDisplayName = `自动>组织[普通表]${aggregateNodeAppendText}`;
    const aggregateNodeCollectionName = `tt_amt_org${aggregateNodeAppendText}`;
    const aggregateNodeFieldName = 'staffnum';
    const aggregateNodeFieldDisplayName = '员工人数(整数)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), aggregateNodeAppendText).collections);
    const aggregateNodeCollectionData = [{staffnum:3,regcapital:3.12},{staffnum:3,regcapital:3.6},{staffnum:4,regcapital:4.6},{staffnum:4,regcapital:4.6},{staffnum:5,regcapital:5.6}];
    const aggregateNodeCollectionRecords = await mockRecords(aggregateNodeCollectionName, aggregateNodeCollectionData);

    //添加工作流
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "collection", "enabled": true };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    //配置工作流触发器
    const triggerNodeData = { "config": { "appends": [], "collection": triggerNodeCollectionName, "changed": [], "condition": { "$and": [] }, "mode": 1 } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    //配置聚合数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
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
    await page.getByText(aggregateNodeCollectionDisplayName).click();
    await aggregateRecordNode.aggregatedFieldDropDown.click();
    page.getByRole('option', { name: aggregateNodeFieldDisplayName }).click();
    await aggregateRecordNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据查询成功
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number; }, b: { id: number; }) {
        return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const queryRecordNodeJob = jobs.find(job => job.nodeId.toString() === aggregateRecordNodeId);
    const queryRecordNodeJobResult = queryRecordNodeJob.result;
    // aggregateNodeCollectionData中staffnum字段值最大值
    const aggregateNodeCollectionDataMax = aggregateNodeCollectionData.reduce((max, currentValue) => {
        return currentValue.staffnum > max ? currentValue.staffnum : max;
    }, aggregateNodeCollectionData[0].staffnum);
    expect(queryRecordNodeJobResult).toBe(aggregateNodeCollectionDataMax);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
