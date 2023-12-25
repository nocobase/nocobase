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
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';

test('Collection event add data trigger, filter single line text field not null, delete common table data', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const deleteNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);

    // 创建删除数据节点数据表
    const deleteNodeCollectionDisplayName = `自动>组织[普通表]${deleteNodeAppendText}`;
    const deleteNodeCollectionName = `tt_amt_org${deleteNodeAppendText}`;
    const deleteNodeFieldName = 'orgname';
    const deleteNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), deleteNodeAppendText).collections);
    const deleteNodeCollectionRecordOne ='a' + faker.string.alphanumeric(4);
    const deleteNodeCollectionRecordTwo = 'b' + faker.string.alphanumeric(4);
    const deleteNodeCollectionRecordThree = 'c' + faker.string.alphanumeric(4);
    const deleteNodeCollectionRecords = await mockRecords(deleteNodeCollectionName, [{ orgname: deleteNodeCollectionRecordOne }, { orgname: deleteNodeCollectionRecordTwo }, { orgname: deleteNodeCollectionRecordThree }]);

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

    //配置删除数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'destroy', exact: true }).click();
    const deleteRecordNodeName = 'Delete record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Delete record-Delete record', { exact: true }).getByRole('textbox').fill(deleteRecordNodeName);
    const deleteRecordNode = new DeleteRecordNode(page, deleteRecordNodeName);
    await deleteRecordNode.nodeConfigure.click();
    await deleteRecordNode.collectionDropDown.click();
    await page.getByText(deleteNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: deleteNodeFieldDisplayName.toString() }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'is not empty' }).click();
    await deleteRecordNode.submitButton.click();
    // 查看删除前数据
    let deleteNodeCollectionData = await apiGetList(deleteNodeCollectionName);
    let deleteNodeCollectionDataObj = JSON.parse(JSON.stringify(deleteNodeCollectionData));
    expect(deleteNodeCollectionDataObj.meta.count).toBe(3);
    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据删除成功
    deleteNodeCollectionData = await apiGetList(deleteNodeCollectionName);
    deleteNodeCollectionDataObj = JSON.parse(JSON.stringify(deleteNodeCollectionData));
    expect(deleteNodeCollectionDataObj.meta.count).toBe(0);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
});

test('Collection event add data trigger, filter single line text field is trigger node single line text field variable , delete common table data', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const deleteNodeAppendText = 'b' + faker.string.alphanumeric(4);
    //创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);

    // 创建删除数据节点数据表
    const deleteNodeCollectionDisplayName = `自动>组织[普通表]${deleteNodeAppendText}`;
    const deleteNodeCollectionName = `tt_amt_org${deleteNodeAppendText}`;
    const deleteNodeFieldName = 'orgname';
    const deleteNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), deleteNodeAppendText).collections);
    const deleteNodeCollectionRecordOne ='a' + faker.string.alphanumeric(4);
    const deleteNodeCollectionRecordTwo = 'b' + faker.string.alphanumeric(4);
    const deleteNodeCollectionRecordThree = 'c' + faker.string.alphanumeric(4);
    const deleteNodeCollectionRecords = await mockRecords(deleteNodeCollectionName, [{ orgname: deleteNodeCollectionRecordOne }, { orgname: deleteNodeCollectionRecordTwo }, { orgname: deleteNodeCollectionRecordThree }]);

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

    //配置删除数据节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
    await page.getByRole('button', { name: 'destroy', exact: true }).click();
    const deleteRecordNodeName = 'Delete record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Delete record-Delete record', { exact: true }).getByRole('textbox').fill(deleteRecordNodeName);
    const deleteRecordNode = new DeleteRecordNode(page, deleteRecordNodeName);
    await deleteRecordNode.nodeConfigure.click();
    await deleteRecordNode.collectionDropDown.click();
    await page.getByText(deleteNodeCollectionDisplayName).click();
    // 设置过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('block-item-Filter-workflows-Filter').getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: deleteNodeFieldDisplayName.toString() }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger variables' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Trigger data' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeFieldDisplayName }).click();
    await expect(page.getByLabel('block-item-Filter-workflows-Filter').getByLabel('variable-tag')).toHaveText(`Trigger variables / Trigger data / ${triggerNodeFieldDisplayName}`);
    await deleteRecordNode.submitButton.click();

    // 查看删除前数据
    let deleteNodeCollectionData = await apiGetList(deleteNodeCollectionName);
    let deleteNodeCollectionDataObj = JSON.parse(JSON.stringify(deleteNodeCollectionData));
    expect(deleteNodeCollectionDataObj.meta.count).toBe(3);
    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = deleteNodeCollectionRecordOne;
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne }]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,数据删除成功
    deleteNodeCollectionData = await apiGetList(deleteNodeCollectionName);
    deleteNodeCollectionDataObj = JSON.parse(JSON.stringify(deleteNodeCollectionData));
    expect(deleteNodeCollectionDataObj.meta.count).toBe(2);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
});
