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
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';

test.describe('Configuration page to configure the Trigger node', () => {
  test('Add Data Trigger with No Filter', async ({ page, mockCollections, mockRecords }) => {
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
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    // await page.getByRole('option', { name: triggerNodeCollectionDisplayName }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发,判断节点true通过
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Modify Data Without Filter Trigger', async ({ page, mockCollections, mockRecords }) => {
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
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record updated', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    // 2、测试步骤：添加数据,编辑数据触发工作流
    const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    const recordId = triggerNodeCollectionRecords[0].id;
    await apiUpdateRecord(triggerNodeCollectionName, recordId, { orgname: triggerNodeCollectionRecordOne + '1' });
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('No-filter new or modified data triggers', async ({ page, mockCollections, mockRecords }) => {
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
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added or updated', { exact: true }).click();
    await collectionTriggerNode.submitButton.click();

    // 2、测试步骤：添加数据,编辑数据触发工作流
    const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    const recordId = triggerNodeCollectionRecords[0].id;
    await apiUpdateRecord(triggerNodeCollectionName, recordId, { orgname: triggerNodeCollectionRecordOne + '1' });
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(2);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Filter radio fields equal to a specific value new data trigger', async ({
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
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record added or updated', { exact: true }).click();
    // 设置触发器过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page
      .getByLabel('block-item-Filter-workflows-Only triggers when match conditions')
      .getByRole('button', { name: 'Select field' })
      .click();
    await page.getByText('公司状态(下拉单选)').click();
    await page
      .getByLabel('block-item-Filter-workflows-Only triggers when match conditions')
      .getByTestId('select-single')
      .click();
    await page.getByRole('option', { name: '存续' }).click();
    await collectionTriggerNode.submitButton.click();

    // 2、测试步骤：添加数据,编辑数据触发工作流
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [{ status_singleselect: '1' }]);
    await page.waitForTimeout(1000);

    // 3、预期结果：工作流成功触发
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Filter radio fields equal to a specific value Edit Data Trigger', async ({
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
      type: 'collection',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    await collectionTriggerNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
    await collectionTriggerNode.triggerOnDropdown.click();
    await page.getByText('After record updated', { exact: true }).click();
    // 设置触发器过滤条件
    await page.getByText('Add condition', { exact: true }).click();
    await page
      .getByLabel('block-item-Filter-workflows-Only triggers when match conditions')
      .getByRole('button', { name: 'Select field' })
      .click();
    await page.getByText('公司状态(下拉单选)').click();
    await page
      .getByLabel('block-item-Filter-workflows-Only triggers when match conditions')
      .getByTestId('select-single')
      .click();
    await page.getByRole('option', { name: '存续' }).click();
    await collectionTriggerNode.submitButton.click();

    // 2、测试步骤：添加数据,编辑数据触发工作流
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [{ status_singleselect: '1' }]);
    await page.waitForTimeout(1000);
    const recordId = triggerNodeCollectionRecords[0].id;
    await apiUpdateRecord(triggerNodeCollectionName, recordId, { orgname: '1' });
    await page.waitForTimeout(1000);
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
  test('Collection event Workflow Configuration Page Path Jump Workflow Management Page', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
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
      type: 'collection',
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

  test('Collection event Workflow History Version Configuration Page Path Jump Workflow Management Page', async ({
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

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
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

  test('Collection event Workflow Execution Log Page Path Jump Workflow Management Page', async ({
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

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
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

  test.skip('Collection event Workflow Execution Log Page Path Jump Execution Log Screen', async ({
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

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await expect(workflowListRecords.executionCountPopup).toHaveText('1');
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
  test('Collection Event Workflow Add Data Trigger Disable Do Not Trigger', async ({
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

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：触发次数为1
    let getWorkflow = await apiGetWorkflow(workflowId);
    let getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    let getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('switch', { name: 'On Off' }).click();
    await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne + '1' }]);
    await page.waitForTimeout(1000);

    getWorkflow = await apiGetWorkflow(workflowId);
    getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection Event Workflow Add Data Trigger Disable Enable Post Trigger', async ({
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
      type: 'collection',
      enabled: false,
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

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：触发次数为1
    let getWorkflow = await apiGetWorkflow(workflowId);
    let getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    let getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(0);

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('switch', { name: 'On Off' }).click();
    await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionRecordOne + '1' }]);
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
  test('Copy the Collection event of the Configuration Trigger node', async ({
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

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne = faker.string.alphanumeric(9);
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('networkidle');
    await page.locator('.workflow-toolbar').getByLabel('more').hover();
    await page.getByLabel('revision').click();
    await page.waitForLoadState('networkidle');
    // 3、预期结果：新版本工作流配置内容同旧版本一样
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.nodeConfigure.click();
    // await expect(page.getByRole('button', { name: `Main / ${triggerNodeCollectionDisplayName}` })).toBeVisible();
    await expect(
      page
        .getByLabel('block-item-DataSourceCollectionCascader-workflows-Collection')
        .getByText(`Main / ${triggerNodeCollectionDisplayName}`),
    ).toBeVisible();

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('Configuration page  delete version', () => {});

test.describe('Node Add Modify Delete', () => {});
