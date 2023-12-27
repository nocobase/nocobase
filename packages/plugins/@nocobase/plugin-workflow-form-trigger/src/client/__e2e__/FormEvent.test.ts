import { faker } from '@faker-js/faker';
import {
  CreateWorkFlow,
  EditWorkFlow,
  FormEventTriggerNode,
  WorkflowListRecords,
  apiCreateRecordTriggerFormEvent,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test.describe('Filter', () => {
  test('filter workflow name', async ({ page }) => {
    //添加工作流
    const triggerNodeAppendText = faker.string.alphanumeric(5);
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'form',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    // 2、筛选工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();

    // 3、预期结果：列表中出现筛选的工作流
    await expect(page.getByText(workFlowName)).toBeAttached();

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('Add new', () => {
  test('add new Form event', async ({ page }) => {
    // 添加工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = faker.string.alphanumeric(5);
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Form event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    // 3、预期结果：列表中出现新建的工作流
    await expect(page.getByText(workFlowName)).toBeVisible();

    // 4、后置处理：删除工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});

test.describe('Sync', () => {});

test.describe('Delete', () => {
  test('delete Form event', async ({ page }) => {
    //添加工作流
    const triggerNodeAppendText = faker.string.alphanumeric(5);
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'form',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    // 删除工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 3、预期结果：列表中出现筛选的工作流
    await expect(page.getByText(workFlowName)).toBeHidden();

    // 4、后置处理：删除工作流
  });
});

test.describe('Edit', () => {
  test('edit Form event name', async ({ page }) => {
    //添加工作流
    const triggerNodeAppendText = faker.string.alphanumeric(5);
    let workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'form',
      enabled: true,
    };
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
  test('Duplicate Form event triggers with only unconfigured trigger nodes', async ({ page }) => {
    //添加工作流
    const triggerNodeAppendText = faker.string.alphanumeric(5);
    const workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      type: 'form',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    // 2、复制工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`action-Action.Link-Duplicate-workflows-${workFlowName}`).click();
    await page.getByLabel(`action-Action-Submit-workflows-${workFlowName}`).click();
    await page.waitForLoadState('networkidle');
    // 3、预期结果：列表中出现筛选的工作流
    await expect(page.getByText(`${workFlowName} copy`)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}  copy`).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(`${workFlowName} copy`)).toBeHidden();
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('Executed', () => {});

test.describe('Configuration page to configure the Trigger node', () => {
  test('Form Submit Button Binding Workflow Add Data Trigger', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
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
      type: 'form',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const formEventTriggerNode = new FormEventTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await formEventTriggerNode.nodeConfigure.click();
    await formEventTriggerNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await formEventTriggerNode.submitButton.click();

    //配置录入数据区块
    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();
    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();
    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);
    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    // 绑定工作流
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`).hover();
    await page
      .getByRole('button', { name: `designer-schema-settings-Action-Action.Designer-${triggerNodeCollectionName}` })
      .hover();
    await page.getByRole('menuitem', { name: 'Bind workflows' }).click();
    await page.getByRole('button', { name: 'plus Add workflow' }).click();
    await page.getByRole('button', { name: 'Select workflow' }).click();
    await page.getByRole('option', { name: workFlowName }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
    await page.waitForLoadState('networkidle');
    // 3、预期结果：触发次数为1
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Form Submit to Workflow Button Add Data Trigger', async ({ page, mockPage, mockCollections, mockRecords }) => {
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
      type: 'form',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const formEventTriggerNode = new FormEventTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await formEventTriggerNode.nodeConfigure.click();
    await formEventTriggerNode.collectionDropDown.click();
    await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await formEventTriggerNode.submitButton.click();

    //配置录入数据区块
    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeEnabled();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-CreateFormBlockInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    // 绑定工作流
    await page
      .getByLabel(`schema-initializer-ActionBar-CreateFormActionInitializers-${triggerNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'Submit to workflow' }).click();
    await page.getByLabel(`schema-initializer-Grid-FormItemInitializers-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Submit to workflow' }).hover();
    await page
      .getByRole('button', { name: `designer-schema-settings-Action-Action.Designer-${triggerNodeCollectionName}` })
      .hover();
    await page.getByRole('menuitem', { name: 'Bind workflows' }).click();
    await page.getByRole('button', { name: 'plus Add workflow' }).click();
    await page.getByRole('button', { name: 'Select workflow' }).click();
    await page.getByRole('option', { name: workFlowName }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page
      .getByLabel(`action-Action-Submit to workflow-customize:triggerWorkflows-${triggerNodeCollectionName}-form`)
      .click();
    await page.waitForLoadState('networkidle');
    // 3、预期结果：触发次数为1
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('Configuration Page Path Jump Workflow Management Page', () => {
  test('Form event Workflow Configuration Page Path Jump Workflow Management Page', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
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
      type: 'form',
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

  test('Form event Workflow History Version Configuration Page Path Jump Workflow Management Page', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
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
      type: 'form',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const WorkflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerWorkflows = WorkflowKey;
    const triggerNodeCollectionRecords = await apiCreateRecordTriggerFormEvent(
      triggerNodeCollectionName,
      triggerWorkflows,
      { orgname: triggerNodeCollectionRecordOne },
    );
    await page.waitForTimeout(1000);

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

  test('Form event Workflow Execution Log Page Path Jump Workflow Management Page', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
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
      type: 'form',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const WorkflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerWorkflows = WorkflowKey;
    const triggerNodeCollectionRecords = await apiCreateRecordTriggerFormEvent(
      triggerNodeCollectionName,
      triggerWorkflows,
      { orgname: triggerNodeCollectionRecordOne },
    );
    await page.waitForTimeout(1000);

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

  test.skip('Form event Workflow Execution Log Page Path Jump Execution Log Screen', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
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
      type: 'form',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const WorkflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerWorkflows = WorkflowKey;
    const triggerNodeCollectionRecords = await apiCreateRecordTriggerFormEvent(
      triggerNodeCollectionName,
      triggerWorkflows,
      { orgname: triggerNodeCollectionRecordOne },
    );
    await page.waitForTimeout(1000);

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

test.describe('Configuration page disable enable', () => {
  test('Form event Workflow Add Data Trigger Disable Do Not Trigger', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
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
      type: 'form',
      enabled: false,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const WorkflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerWorkflows = WorkflowKey;
    const triggerNodeCollectionRecords = await apiCreateRecordTriggerFormEvent(
      triggerNodeCollectionName,
      triggerWorkflows,
      { orgname: triggerNodeCollectionRecordOne },
    );
    await page.waitForTimeout(1000);

    // 3、预期结果：触发次数为1
    let getWorkflow = await apiGetWorkflow(workflowId);
    let getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    let getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(0);

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('switch', { name: 'On Off' }).click();

    await apiCreateRecordTriggerFormEvent(triggerNodeCollectionName, triggerWorkflows, {
      orgname: triggerNodeCollectionRecordOne + '1',
    });
    await page.waitForTimeout(1000);

    getWorkflow = await apiGetWorkflow(workflowId);
    getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Form event Workflow Add Data Trigger Disable Enable Post Trigger', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
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
      type: 'form',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const WorkflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerWorkflows = WorkflowKey;
    const triggerNodeCollectionRecords = await apiCreateRecordTriggerFormEvent(
      triggerNodeCollectionName,
      triggerWorkflows,
      { orgname: triggerNodeCollectionRecordOne },
    );
    await page.waitForTimeout(1000);

    // 3、预期结果：触发次数为1
    let getWorkflow = await apiGetWorkflow(workflowId);
    let getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    let getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('switch', { name: 'On Off' }).click();

    await apiCreateRecordTriggerFormEvent(triggerNodeCollectionName, triggerWorkflows, {
      orgname: triggerNodeCollectionRecordOne + '1',
    });
    await page.waitForTimeout(1000);

    getWorkflow = await apiGetWorkflow(workflowId);
    getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('Configuration page execution history', () => {});

test.describe('Configuration page copy to new version', () => {
  test('Copy the Form event of the Configuration Trigger node', async ({ page, mockCollections, mockRecords }) => {
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
      type: 'form',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const WorkflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerWorkflows = WorkflowKey;
    const triggerNodeCollectionRecords = await apiCreateRecordTriggerFormEvent(
      triggerNodeCollectionName,
      triggerWorkflows,
      { orgname: triggerNodeCollectionRecordOne },
    );
    await page.waitForTimeout(1000);

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    await page.getByLabel('more').click();
    await page.getByLabel('revision').click();
    await page.waitForLoadState('networkidle');

    // 3、预期结果：新版本工作流配置内容同旧版本一样
    const formEventTriggerNode = new FormEventTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await formEventTriggerNode.nodeConfigure.click();
    await expect(page.getByRole('button', { name: triggerNodeCollectionDisplayName })).toBeVisible();

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('Configuration page  delete version', () => {});

test.describe('Node Add Modify Delete', () => {});
