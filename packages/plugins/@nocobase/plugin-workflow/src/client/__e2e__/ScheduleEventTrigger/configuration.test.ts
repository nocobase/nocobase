import { faker } from '@faker-js/faker';
import {
  ScheduleTriggerNode,
  WorkflowListRecords,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test.describe('Configuration page to configure the Trigger node', () => {
  test('Triggered one minute after the current time of the customized time', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    test.setTimeout(120000);
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
      type: 'schedule',
      enabled: true,
    };
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
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'schedule',
      enabled: true,
    };
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

  test('Schedule event Workflow History Version Configuration Page Path Jump Workflow Management Page', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    test.setTimeout(120000);
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
      type: 'schedule',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeWithTimeZone = now.toLocaleString('en-US', { timeZone: timeZone });
    const triggerNodeData = { config: { mode: 0, startsOn: timeWithTimeZone } };
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

  test('Schedule event Workflow Execution Log Page Path Jump Workflow Management Page', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    test.setTimeout(120000);
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
      type: 'schedule',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeWithTimeZone = now.toLocaleString('en-US', { timeZone: timeZone });
    const triggerNodeData = { config: { mode: 0, startsOn: timeWithTimeZone } };
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

  test.skip('Schedule event Workflow Execution Log Page Path Jump Execution Log Screen', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    test.setTimeout(120000);
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
      type: 'schedule',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeWithTimeZone = now.toLocaleString('en-US', { timeZone: timeZone });
    const triggerNodeData = { config: { mode: 0, startsOn: timeWithTimeZone } };
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

test.describe('Configuration page version switching', () => {});

test.describe('Configuration page disable enable', () => {});

test.describe('Configuration page execution history', () => {});

test.describe('Configuration page copy to new version', () => {
  test('Copy the Schedule event of the Configuration Trigger node', async ({ page, mockCollections, mockRecords }) => {
    test.setTimeout(120000);
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
      type: 'schedule',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeWithTimeZone = now.toLocaleString('en-US', { timeZone: timeZone });
    const triggerNodeData = { config: { mode: 0, startsOn: timeWithTimeZone } };
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
    const timeWithoutTimeZonea = now.toLocaleString('en-US', { timeZone: timeZone, hour12: false });
    // 将 MM/DD/YYYY, HH:mm:ss 格式的字符串转换为 YYYY-MM-DD HH:mm:ss 格式
    const parts = timeWithoutTimeZonea.split(/[\s,/:]+/);
    const formattedTimeWithTimeZone = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')} ${
      parts[3]
    }:${parts[4]}:${parts[5]}`;

    await expect(scheduleTriggerNode.startTimeEntryBox).toHaveValue(formattedTimeWithTimeZone);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('Configuration page  delete version', () => {});

test.describe('Node Add Modify Delete', () => {});
