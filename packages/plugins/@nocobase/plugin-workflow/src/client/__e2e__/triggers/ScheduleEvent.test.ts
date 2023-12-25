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

test.describe('Filter', () => {
    test('filter workflow name', async ({ page }) => {
        //添加工作流
        const triggerNodeAppendText = faker.string.alphanumeric(5);
        const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "schedule", "enabled": true };
        const workflow = await apiCreateWorkflow(workflowData);
        const workflowObj = JSON.parse(JSON.stringify(workflow));
        const workflowId = workflowObj.id;

        // 2、筛选工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
        await page.getByRole('textbox').fill(workFlowName);
        await page.getByRole('button', { name: 'Submit', exact: true }).click();

        // 3、预期结果：列表中出现筛选的工作流
        await expect(page.getByText(workFlowName)).toBeAttached();

        // 4、后置处理：删除工作流
        await apiDeleteWorkflow(workflowId);
    });
});

test.describe('Add new', () => {
    test('add new Schedule event', async ({ page }) => {
        // 添加工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await page.getByLabel('action-Action-Add new-workflows').click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = faker.string.alphanumeric(5);
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await page.getByLabel('action-Action-Submit-workflows').click();

        // 3、预期结果：列表中出现新建的工作流
        await expect(page.getByText(workFlowName)).toBeVisible();

        // 4、后置处理：删除工作流
        await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
        await page.getByRole('textbox').fill(workFlowName);
        await page.getByRole('button', { name: 'Submit', exact: true }).click();
        await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(workFlowName)).toBeHidden();
    });
});

test.describe('Sync', () => { });

test.describe('Delete', () => {
    test('delete Schedule event', async ({ page }) => {
        //添加工作流
        const triggerNodeAppendText = faker.string.alphanumeric(5);
        const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "schedule", "enabled": true };
        const workflow = await apiCreateWorkflow(workflowData);
        const workflowObj = JSON.parse(JSON.stringify(workflow));
        const workflowId = workflowObj.id;

        // 删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
        await page.getByRole('textbox').fill(workFlowName);
        await page.getByRole('button', { name: 'Submit', exact: true }).click();
        await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();

        // 3、预期结果：列表中出现筛选的工作流
        await expect(page.getByText(workFlowName)).toBeHidden();

        // 4、后置处理：删除工作流
    });
});

test.describe('Edit', () => {
    test('edit Schedule event name', async ({ page }) => {
        //添加工作流
        const triggerNodeAppendText = faker.string.alphanumeric(5);
        let workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "schedule", "enabled": true };
        const workflow = await apiCreateWorkflow(workflowData);
        const workflowObj = JSON.parse(JSON.stringify(workflow));
        const workflowId = workflowObj.id;

        // 编辑工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await page.getByLabel(`action-Action.Link-Edit-workflows-${workFlowName}`).click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        await editWorkFlow.name.fill(workFlowName);
        await page.getByLabel('action-Action-Submit-workflows').click();
        await page.waitForLoadState('networkidle');
        // 3、预期结果：编辑成功，列表中出现编辑后的工作流
        await expect(page.getByText(workFlowName)).toBeAttached();

        // 4、后置处理：删除工作流
        await apiDeleteWorkflow(workflowId);
    });
});

test.describe('Duplicate', () => {
    test('Duplicate Schedule event triggers with only unconfigured trigger nodes', async ({ page }) => {
        //添加工作流
        const triggerNodeAppendText = faker.string.alphanumeric(5);
        const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "schedule", "enabled": true };
        const workflow = await apiCreateWorkflow(workflowData);
        const workflowObj = JSON.parse(JSON.stringify(workflow));
        const workflowId = workflowObj.id;

        // 2、复制工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await page.getByLabel(`action-Action.Link-Duplicate-workflows-${workFlowName}`).click();
        await page.getByLabel(`action-Action-Submit-workflows-${workFlowName}`).click();

        // 3、预期结果：列表中出现筛选的工作流
        await expect(page.getByText(`${workFlowName} copy`)).toBeAttached();

        // 4、后置处理：删除工作流
        await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}  copy`).click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(`${workFlowName} copy`)).toBeHidden();
        await apiDeleteWorkflow(workflowId);
    });
});

test.describe('Executed', () => { });

test.describe('Configuration page to configure the Trigger node', () => {
    test('Triggered one minute after the current time of the customized time', async ({ page, mockCollections, mockRecords }) => {
        test.setTimeout(120000);
        //数据表后缀标识
        const triggerNodeAppendText = faker.string.alphanumeric(5);

        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
        const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);
        //添加工作流
        const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "schedule", "enabled": true };
        const workflow = await apiCreateWorkflow(workflowData);
        const workflowObj = JSON.parse(JSON.stringify(workflow));
        const workflowId = workflowObj.id;

        //配置工作流触发器
        await page.goto(`admin/workflow/workflows/${workflowId}`);
        await page.waitForLoadState('networkidle');
        const scheduleTriggerNode = new ScheduleTriggerNode(page, workFlowName, triggerNodeCollectionName);
        await scheduleTriggerNode.nodeConfigure.click();
        await scheduleTriggerNode.startTimeEntryBox.click();
        await scheduleTriggerNode.startTimeEntryBox.fill(dayjs().add(60, 'second').format('YYYY-MM-DD HH:mm:ss'));
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await scheduleTriggerNode.submitButton.click();

        // 2、测试步骤：等待60秒
        await page.waitForTimeout(60000);

        // 3、预期结果：工作流成功触发
        const getWorkflow = await apiGetWorkflow(workflowId);
        const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
        const getWorkflowExecuted = getWorkflowObj.executed;
        expect(getWorkflowExecuted).toBe(1);

        // 4、后置处理：删除工作流
        await apiDeleteWorkflow(workflowId);
    });
});

test.describe('Configuration Page Path Jump Workflow Management Page', () => {
    test('Schedule event Workflow Configuration Page Path Jump Workflow Management Page', async ({ page }) => {
        //数据表后缀标识
        const triggerNodeAppendText = faker.string.alphanumeric(5);

        //创建触发器节点数据表
        // const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
        // const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
        // const triggerNodeFieldName = 'orgname';
        // const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        // await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);
        //添加工作流
        const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "schedule", "enabled": true };
        const workflow = await apiCreateWorkflow(workflowData);
        const workflowObj = JSON.parse(JSON.stringify(workflow));
        const workflowId = workflowObj.id;

        //配置工作流触发器
        await page.goto(`admin/workflow/workflows/${workflowId}`);
        await page.waitForLoadState('networkidle');

        // 2、测试步骤：跳转到工作流管理页面
        await page.getByRole('link', { name: 'Workflow' }).click();

        // 3、预期结果：跳转路径正确
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBe(`${process.env.APP_BASE_URL}/admin/settings/workflow`);

        // 4、后置处理：删除工作流
        await apiDeleteWorkflow(workflowId);
    });

    test('Schedule event Workflow History Version Configuration Page Path Jump Workflow Management Page', async ({ page, mockCollections, mockRecords }) => {
        //数据表后缀标识
        const triggerNodeAppendText = faker.string.alphanumeric(5);
        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
        const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);
        //添加工作流
        const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "schedule", "enabled": true };
        const workflow = await apiCreateWorkflow(workflowData);
        const workflowObj = JSON.parse(JSON.stringify(workflow));
        const workflowId = workflowObj.id;

        //配置工作流触发器
        let now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let timeWithTimeZone = now.toLocaleString("en-US", {timeZone: timeZone});
        const triggerNodeData = { "config": { "mode": 0, "startsOn": timeWithTimeZone } };
        const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
        const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

        // 2、测试步骤：等待60秒
        await page.waitForTimeout(60000);
        const getWorkflow = await apiGetWorkflow(workflowId);
        const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
        const getWorkflowExecuted = getWorkflowObj.executed;
        expect(getWorkflowExecuted).toBe(1);
        await page.goto(`admin/workflow/workflows/${workflowId}`);
        await page.waitForLoadState('networkidle');
        await page.getByLabel('more').click();
        await page.getByLabel('revision').click();
        await page.waitForLoadState('networkidle');
        //元素重复
        await page.getByLabel('version', { exact: true }).click();
        await page.getByLabel('version-1').click();
        await page.getByRole('link', { name: 'Workflow' }).click();

        // 3、预期结果：跳转路径正确
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBe(`${process.env.APP_BASE_URL}/admin/settings/workflow`);

        // 4、后置处理：删除工作流
        await apiDeleteWorkflow(workflowId);
    });

    test('Schedule event Workflow Execution Log Page Path Jump Workflow Management Page', async ({ page, mockCollections, mockRecords }) => {
        //数据表后缀标识
        const triggerNodeAppendText = faker.string.alphanumeric(5);

        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
        const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);
        //添加工作流
        const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "schedule", "enabled": true };
        const workflow = await apiCreateWorkflow(workflowData);
        const workflowObj = JSON.parse(JSON.stringify(workflow));
        const workflowId = workflowObj.id;

        //配置工作流触发器
        let now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let timeWithTimeZone = now.toLocaleString("en-US", {timeZone: timeZone});
        const triggerNodeData = { "config": { "mode": 0, "startsOn": timeWithTimeZone } };
        const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
        const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

        // 2、测试步骤：等待60秒
        await page.waitForTimeout(60000);
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        const workflowListRecords = new WorkflowListRecords(page, workFlowName);
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page.getByRole('link', { name: 'Workflow', exact: true }).click();

        // 3、预期结果：跳转路径正确
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBe(`${process.env.APP_BASE_URL}/admin/settings/workflow`);

        // 4、后置处理：删除工作流
        await apiDeleteWorkflow(workflowId);
    });

    test.skip('Schedule event Workflow Execution Log Page Path Jump Execution Log Screen',async ({ page, mockCollections, mockRecords }) => {
        //数据表后缀标识
        const triggerNodeAppendText = faker.string.alphanumeric(5);

        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
        const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);
        //添加工作流
        const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "schedule", "enabled": true };
        const workflow = await apiCreateWorkflow(workflowData);
        const workflowObj = JSON.parse(JSON.stringify(workflow));
        const workflowId = workflowObj.id;

        //配置工作流触发器
        let now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let timeWithTimeZone = now.toLocaleString("en-US", {timeZone: timeZone});
        const triggerNodeData = { "config": { "mode": 0, "startsOn": timeWithTimeZone } };
        const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
        const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

        // 2、测试步骤：等待60秒
        await page.waitForTimeout(60000);
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        const workflowListRecords = new WorkflowListRecords(page, workFlowName);
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        //跳转其他执行日志界面，元素无法定位

        // 3、预期结果：跳转路径正确
        await page.waitForLoadState('networkidle');
        // expect(page.url()).toBe(`${process.env.APP_BASE_URL}/admin/settings/workflow`);

        // 4、后置处理：删除工作流
        await apiDeleteWorkflow(workflowId);
    });
});

test.describe('Configuration page version switching', () => { });

test.describe('Configuration page disable enable', () => { });

test.describe('Configuration page execution history', () => { });

test.describe('Configuration page copy to new version', () => {
    test('Copy the Schedule event of the Configuration Trigger node', async ({ page, mockCollections, mockRecords }) => {
        //数据表后缀标识
        const triggerNodeAppendText = faker.string.alphanumeric(5);

        //创建触发器节点数据表
        const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
        const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
        const triggerNodeFieldName = 'orgname';
        const triggerNodeFieldDisplayName = '公司名称(单行文本)';
        await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);
        //添加工作流
        const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
        const workflowData = { "current": true, "options": { "deleteExecutionOnStatus": [] }, "title": workFlowName, "type": "schedule", "enabled": true };
        const workflow = await apiCreateWorkflow(workflowData);
        const workflowObj = JSON.parse(JSON.stringify(workflow));
        const workflowId = workflowObj.id;

        //配置工作流触发器
        let now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let timeWithTimeZone = now.toLocaleString("en-US", {timeZone: timeZone});
        const triggerNodeData = { "config": { "mode": 0, "startsOn": timeWithTimeZone } };
        const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
        const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

        // 2、测试步骤：等待60秒
        await page.waitForTimeout(60000);
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        const workflowListRecords = new WorkflowListRecords(page, workFlowName);

        await workflowListRecords.configureAction.click();
        await page.getByLabel('more').click();
        await page.getByLabel('revision').click();
        await page.waitForLoadState('networkidle');
        const scheduleTriggerNode = new ScheduleTriggerNode(page, workFlowName, triggerNodeCollectionName);
        await scheduleTriggerNode.nodeConfigure.click();
        // 3、预期结果：startTime时间为60秒后的时间
        let timeWithoutTimeZonea = now.toLocaleString("en-US", {timeZone: timeZone, hour12: false});
        // 将 MM/DD/YYYY, HH:mm:ss 格式的字符串转换为 YYYY-MM-DD HH:mm:ss 格式
        let parts = timeWithoutTimeZonea.split(/[\s,\/:]+/);
        let formattedTimeWithTimeZone = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')} ${parts[3]}:${parts[4]}:${parts[5]}`;

        await expect(scheduleTriggerNode.startTimeEntryBox).toHaveValue(formattedTimeWithTimeZone);

        // 4、后置处理：删除工作流
        await apiDeleteWorkflow(workflowId);
    });
});

test.describe('Configuration page  delete version', () => { });

test.describe('Node Add Modify Delete', () => { });
