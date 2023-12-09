import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { faker } from '@faker-js/faker';
import { e2e_GeneralFormsTable, appendJsonCollectionName } from '@nocobase/plugin-workflow-test/client';
import { CreateWorkFlow, EditWorkFlow, ScheduleTriggerNode } from '@nocobase/plugin-workflow-test/client';
import { WorkflowManagement, WorkflowListRecords } from '@nocobase/plugin-workflow-test/client';

test.describe('Filter', () => {
    test('filter workflow name', async ({ page }) => {
        //用例标题
        const caseTitle = 'filter workflow name';

        // 1、前置条件：1.1、已登录,1.2、存在一个工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await page.getByLabel('action-Action-Add new-workflows').click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await page.getByLabel('action-Action-Submit-workflows').click();

        await expect(page.getByText(workFlowName)).toBeAttached();

        // 2、测试步骤：进入“工作流管理”-“筛选”按钮，筛选工作流名称
        await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
        await page.getByRole('textbox').fill(workFlowName);
        await page.getByRole('button', { name: 'Submit', exact: true }).click();

        // 3、预期结果：列表中出现筛选的工作流
        await expect(page.getByText(workFlowName)).toBeAttached();

        // 4、后置处理：删除工作流
        await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(workFlowName)).toBeHidden();
    });
});

test.describe('Add new', () => {
    test('add new Schedule event', async ({ page }) => {
        //用例标题
        const caseTitle = 'add new Schedule event';

        // 1、前置条件：已登录

        // 2、测试步骤：进入“工作流管理”,新建工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await page.getByLabel('action-Action-Add new-workflows').click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
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
        //用例标题
        const caseTitle = 'delete Schedule event';

        // 1、前置条件：已登录，存在一个工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await page.getByLabel('action-Action-Add new-workflows').click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await page.getByLabel('action-Action-Submit-workflows').click();

        await expect(page.getByText(workFlowName)).toBeAttached();

        // 2、测试步骤：进入“工作流管理”-“删除”操作，删除工作流名称
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
        //用例标题
        const caseTitle = 'edit Schedule event name';

        // 1、前置条件：1.1、已登录,1.2、存在一个工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await page.getByLabel('action-Action-Add new-workflows').click();
        const createWorkFlow = new CreateWorkFlow(page);
        let workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await page.getByLabel('action-Action-Submit-workflows').click();

        await expect(page.getByText(workFlowName)).toBeAttached();

        // 2、测试步骤：进入“工作流管理”-“编辑”按钮，编辑名称，点击“确定”按钮
        await page.getByLabel(`action-Action.Link-Edit-workflows-${workFlowName}`).click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await createWorkFlow.name.fill(workFlowName);
        await page.getByLabel('action-Action-Submit-workflows').click();

        // 3、预期结果：编辑成功，列表中出现编辑后的工作流
        await expect(page.getByText(workFlowName)).toBeAttached();

        // 4、后置处理：删除工作流
        await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
        await page.getByRole('textbox').fill(workFlowName);
        await page.getByRole('button', { name: 'Submit', exact: true }).click();
        await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(workFlowName)).toBeHidden();
    });
});

test.describe('Duplicate', () => {
    test('Duplicate Schedule event triggers with only unconfigured trigger nodes', async ({ page }) => {
        //用例标题
        const caseTitle = 'Duplicate Schedule event triggers with only unconfigured trigger nodes';

        // 1、前置条件：1.1、已登录,1.2、存在一个工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await page.getByLabel('action-Action-Add new-workflows').click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await page.getByLabel('action-Action-Submit-workflows').click();

        await expect(page.getByText(workFlowName)).toBeAttached();

        // 2、测试步骤：进入“工作流管理”-“复制”操作
        await page.getByLabel(`action-Action.Link-Duplicate-workflows-${workFlowName}`).click();
        await page.getByLabel(`action-Action-Submit-workflows-${workFlowName}`).click();

        // 3、预期结果：列表中出现筛选的工作流
        await expect(page.getByText(`${workFlowName} copy`)).toBeAttached();

        // 4、后置处理：删除工作流
        await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}  copy`).click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(`${workFlowName} copy`)).toBeHidden();

        await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(workFlowName)).toBeHidden();
    });
});

test.describe('Executed', () => { });

test.describe('Configuration page to configure the Trigger node', () => {
    test('Triggered one minute after the current time of the customized time', async ({ page, mockPage }) => {
        test.setTimeout(120000);
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const appendText = faker.lorem.word(4);
        //用例标题
        const caseTitle = 'Triggered one minute after the current time of the customized time';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的数据表事件工作流
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';

        const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
        const collectionName = e2eJsonCollectionName + appendText;
        const fieldName = 'orgname';
        const fieldDisplayName = '公司名称(单行文本)';

        //创建数据表
        // const newPage = mockPage(appendJsonCollectionName(e2e_GeneralFormsTable, appendText));
        //配置工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        const workflowManagement = new WorkflowManagement(page);
        await workflowManagement.addNewButton.click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = caseTitle + appendText;
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await createWorkFlow.submitButton.click();
        await expect(page.getByText(workFlowName)).toBeVisible();

        //配置工作流触发器
        const workflowListRecords = new WorkflowListRecords(page, workFlowName);
        await workflowListRecords.configureAction.click();
        const scheduleTriggerNode = new ScheduleTriggerNode(page, workFlowName, collectionName);
        await scheduleTriggerNode.nodeConfigure.click();
        await scheduleTriggerNode.startTimeEntryBox.click();
        await scheduleTriggerNode.startTimeEntryBox.fill(dayjs().add(60, 'second').format('YYYY-MM-DD HH:mm:ss'));
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await scheduleTriggerNode.submitButton.click();
        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        // 2、测试步骤：等待60秒
        await page.waitForTimeout(60000);

        // 3、预期结果：工作流成功触发
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');

        // 4、后置处理：删除工作流
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(workFlowName)).toBeHidden();
    });
});

test.describe('Configuration Page Path Jump Workflow Management Page', () => {
    test('Schedule event Workflow Configuration Page Path Jump Workflow Management Page', async ({ page, mockPage }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const appendText = faker.lorem.word(4);
        //用例标题
        const caseTitle = 'Schedule event Workflow Configuration Page Path Jump Workflow Management Page';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的表单事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';

        const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
        const collectionName = e2eJsonCollectionName + appendText;
        const fieldName = 'orgname';
        const fieldDisplayName = '公司名称(单行文本)';

        //创建数据表
        // const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
        //配置工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        const workflowManagement = new WorkflowManagement(page);
        await workflowManagement.addNewButton.click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = caseTitle + appendText;
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await createWorkFlow.submitButton.click();
        await expect(page.getByText(workFlowName)).toBeVisible();

        //配置工作流触发器
        const workflowListRecords = new WorkflowListRecords(page, workFlowName);
        await workflowListRecords.configureAction.click();

        // 2、测试步骤：跳转到工作流管理页面
        await page.getByRole('link', { name: 'Workflow' }).click();

        // 3、预期结果：跳转路径正确
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBe(`${process.env.APP_BASE_URL}/admin/settings/workflow`);

        // 4、后置处理：删除工作流
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Schedule event Workflow History Version Configuration Page Path Jump Workflow Management Page', async ({
        page,
        mockPage,
    }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const appendText = faker.lorem.word(4);
        //用例标题
        const caseTitle = 'Schedule event Workflow History Version Configuration Page Path Jump Workflow Management Page';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的表单事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';

        const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
        const collectionName = e2eJsonCollectionName + appendText;
        const fieldName = 'orgname';
        const fieldDisplayName = '公司名称(单行文本)';

        //创建数据表
        const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
        //配置工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        const workflowManagement = new WorkflowManagement(page);
        await workflowManagement.addNewButton.click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = caseTitle + appendText;
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await createWorkFlow.submitButton.click();
        await expect(page.getByText(workFlowName)).toBeVisible();

        //配置工作流触发器
        const workflowListRecords = new WorkflowListRecords(page, workFlowName);
        await workflowListRecords.configureAction.click();
        const scheduleTriggerNode = new ScheduleTriggerNode(page, workFlowName, collectionName);
        await scheduleTriggerNode.nodeConfigure.click();
        await scheduleTriggerNode.startTimeEntryBox.click();
        await scheduleTriggerNode.startTimeEntryBox.fill(dayjs().add(60, 'second').format('YYYY-MM-DD HH:mm:ss'));
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await scheduleTriggerNode.submitButton.click();
        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        // 2、测试步骤：等待60秒
        await page.waitForTimeout(60000);
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');

        await workflowListRecords.configureAction.click();
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
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test('Schedule event Workflow Execution Log Page Path Jump Workflow Management Page', async ({ page, mockPage }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const appendText = faker.lorem.word(4);
        //用例标题
        const caseTitle = 'Schedule event Workflow Execution Log Page Path Jump Workflow Management Page';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的表单事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';

        const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
        const collectionName = e2eJsonCollectionName + appendText;
        const fieldName = 'orgname';
        const fieldDisplayName = '公司名称(单行文本)';

        //创建数据表
        const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
        //配置工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        const workflowManagement = new WorkflowManagement(page);
        await workflowManagement.addNewButton.click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = caseTitle + appendText;
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await createWorkFlow.submitButton.click();
        await expect(page.getByText(workFlowName)).toBeVisible();

        //配置工作流触发器
        const workflowListRecords = new WorkflowListRecords(page, workFlowName);
        await workflowListRecords.configureAction.click();
        const scheduleTriggerNode = new ScheduleTriggerNode(page, workFlowName, collectionName);
        await scheduleTriggerNode.nodeConfigure.click();
        await scheduleTriggerNode.startTimeEntryBox.click();
        await scheduleTriggerNode.startTimeEntryBox.fill(dayjs().add(60, 'second').format('YYYY-MM-DD HH:mm:ss'));
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await scheduleTriggerNode.submitButton.click();
        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        // 2、测试步骤：等待60秒
        await page.waitForTimeout(60000);
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        await page.getByRole('link', { name: 'Workflow', exact: true }).click();

        // 3、预期结果：跳转路径正确
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBe(`${process.env.APP_BASE_URL}/admin/settings/workflow`);

        // 4、后置处理：删除工作流
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(workFlowName)).toBeHidden();
    });

    test.skip('Schedule event Workflow Execution Log Page Path Jump Execution Log Screen', async ({ page, mockPage }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const appendText = faker.lorem.word(4);
        //用例标题
        const caseTitle = 'Schedule event Workflow Execution Log Page Path Jump Execution Log Screen';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的表单事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';

        const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
        const collectionName = e2eJsonCollectionName + appendText;
        const fieldName = 'orgname';
        const fieldDisplayName = '公司名称(单行文本)';

        //创建数据表
        const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
        //配置工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        const workflowManagement = new WorkflowManagement(page);
        await workflowManagement.addNewButton.click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = caseTitle + appendText;
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await createWorkFlow.submitButton.click();
        await expect(page.getByText(workFlowName)).toBeVisible();

        //配置工作流触发器
        const workflowListRecords = new WorkflowListRecords(page, workFlowName);
        await workflowListRecords.configureAction.click();
        const scheduleTriggerNode = new ScheduleTriggerNode(page, workFlowName, collectionName);
        await scheduleTriggerNode.nodeConfigure.click();
        await scheduleTriggerNode.startTimeEntryBox.click();
        await scheduleTriggerNode.startTimeEntryBox.fill(dayjs().add(60, 'second').format('YYYY-MM-DD HH:mm:ss'));
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await scheduleTriggerNode.submitButton.click();
        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        // 2、测试步骤：等待60秒
        await page.waitForTimeout(60000);
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');
        await workflowListRecords.executionCountPopup.click();
        await page.getByText('View').click();
        await page.waitForLoadState('networkidle');
        //跳转其他执行日志界面，元素无法定位

        // 3、预期结果：跳转路径正确
        await page.waitForLoadState('networkidle');
        // expect(page.url()).toBe(`${process.env.APP_BASE_URL}/admin/settings/workflow`);

        // 4、后置处理：删除工作流
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(workFlowName)).toBeHidden();
    });
});

test.describe('Configuration page version switching', () => { });

test.describe('Configuration page disable enable', () => { });

test.describe('Configuration page execution history', () => { });

test.describe('Configuration page copy to new version', () => {
    test('Copy the Schedule event of the Configuration Trigger node', async ({ page, mockPage }) => {
        //后缀标识，用于不同用例调用e2eTemplateJson.ts中相同模板JSON生成不同的数据表标识、名称
        const appendText = faker.lorem.word(4);
        //用例标题
        const caseTitle = 'Copy the Schedule event of the Configuration Trigger node';

        // 1、前置条件：1.1、已登录;1.2、存在一个配置好数据表的表单事件工作流；1.3、存在一个添加数据的区块
        //创建数据表
        const e2eJsonCollectionDisplayName = '自动>组织[普通表]';
        const e2eJsonCollectionName = 'tt_amt_org';

        const collectionDisplayName = e2eJsonCollectionDisplayName + appendText;
        const collectionName = e2eJsonCollectionName + appendText;
        const fieldName = 'orgname';
        const fieldDisplayName = '公司名称(单行文本)';

        //创建数据表
        const newPage = mockPage(appendJsonCollectionName(JSON.parse(JSON.stringify(e2e_GeneralFormsTable)), appendText));
        //配置工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        const workflowManagement = new WorkflowManagement(page);
        await workflowManagement.addNewButton.click();
        const createWorkFlow = new CreateWorkFlow(page);
        const workFlowName = caseTitle + appendText;
        await createWorkFlow.name.fill(workFlowName);
        await createWorkFlow.triggerType.click();
        await page.getByRole('option', { name: 'Schedule event' }).click();
        await createWorkFlow.submitButton.click();
        await expect(page.getByText(workFlowName)).toBeVisible();

        //配置工作流触发器
        const workflowListRecords = new WorkflowListRecords(page, workFlowName);
        await workflowListRecords.configureAction.click();
        const scheduleTriggerNode = new ScheduleTriggerNode(page, workFlowName, collectionName);
        await scheduleTriggerNode.nodeConfigure.click();
        await scheduleTriggerNode.startTimeEntryBox.click();
        const startTime = dayjs().add(60, 'second').format('YYYY-MM-DD HH:mm:ss');
        await scheduleTriggerNode.startTimeEntryBox.fill(startTime);
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await scheduleTriggerNode.submitButton.click();
        await page.getByRole('link', { name: 'Workflow' }).click();
        await workflowListRecords.editAction.click();
        const editWorkFlow = new EditWorkFlow(page, workFlowName);
        await editWorkFlow.statusIsOn.check();
        await editWorkFlow.submitButton.click();

        // 2、测试步骤：等待60秒
        await page.waitForTimeout(60000);
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await expect(workflowListRecords.executionCountPopup).toHaveText('1');

        await workflowListRecords.configureAction.click();
        await page.getByLabel('more').click();
        await page.getByLabel('revision').click();
        await page.waitForLoadState('networkidle');
        await scheduleTriggerNode.nodeConfigure.click();
        // 3、预期结果：startTime时间为60秒后的时间
        await expect(scheduleTriggerNode.startTimeEntryBox).toHaveValue(startTime);
        // 4、后置处理：删除工作流
        await page.goto('/admin/settings/workflow');
        await page.waitForLoadState('networkidle');
        await workflowListRecords.deleteAction.click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByText(workFlowName)).toBeHidden();
    });
});

test.describe('Configuration page  delete version', () => { });

test.describe('Node Add Modify Delete', () => { });
