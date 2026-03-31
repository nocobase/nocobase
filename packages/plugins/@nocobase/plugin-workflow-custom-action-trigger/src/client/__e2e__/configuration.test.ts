/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import {
  CustomActionEventTriggerNode,
  WorkflowListRecords,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetDataSourceCount,
  apiGetWorkflow,
  apiTriggerCustomActionEvent,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';

test.describe('Upper Left Path Jump', () => {
  test('Form event Workflow Configuration Page Path Jump Workflow Management Page', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

    //创建触发器节点数据表
    // const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    // const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    // const triggerNodeFieldName = 'orgname';
    // const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    // await mockCollections(appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText).collections);
    //添加工作流
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');

    // 2、测试步骤：跳转到工作流管理页面
    await page.getByRole('link', { name: 'Workflow' }).click();

    // 3、预期结果：跳转路径正确
    await page.waitForLoadState('load');
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
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

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
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const workflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { type: 1, collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionFieldData = triggerNodeFieldDisplayName + Math.random().toString(36).substring(2, 20);
    const triggerWorkflows = workflowKey;
    const triggerNodeCollectionRecords = await apiTriggerCustomActionEvent(
      triggerNodeCollectionName,
      triggerWorkflows,
      { orgname: triggerNodeCollectionFieldData },
    );
    await page.waitForTimeout(1000);

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    await page.getByLabel('more').click();
    await page.getByLabel('revision').click();
    await page.waitForLoadState('load');
    //元素重复
    await page.getByLabel('version', { exact: true }).click();
    await page.getByLabel('version-1').click();
    await page.getByRole('link', { name: 'Workflow' }).click();

    // 3、预期结果：跳转路径正确
    await page.waitForLoadState('load');
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
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

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
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const workflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionFieldData = triggerNodeFieldDisplayName + Math.random().toString(36).substring(2, 20);
    const triggerWorkflows = workflowKey;
    const triggerNodeCollectionRecords = await apiTriggerCustomActionEvent(
      triggerNodeCollectionName,
      triggerWorkflows,
      { orgname: triggerNodeCollectionFieldData },
    );
    await page.waitForTimeout(1000);

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('load');
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('load');
    await page.getByRole('link', { name: 'Workflow', exact: true }).click();

    // 3、预期结果：跳转路径正确
    await page.waitForLoadState('load');
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
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

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
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const workflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { type: 1, collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionFieldData = triggerNodeFieldDisplayName + Math.random().toString(36).substring(2, 20);
    const triggerWorkflows = workflowKey;
    const triggerNodeCollectionRecords = await apiTriggerCustomActionEvent(
      triggerNodeCollectionName,
      triggerWorkflows,
      { orgname: triggerNodeCollectionFieldData },
    );
    await page.waitForTimeout(1000);

    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('load');
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);
    await workflowListRecords.executionCountPopup.click();
    await page.getByText('View').click();
    await page.waitForLoadState('load');
    //跳转其他执行日志界面，元素无法定位

    // 3、预期结果：跳转路径正确
    await page.waitForLoadState('load');
    // expect(page.url()).toBe(`${process.env.APP_BASE_URL}/admin/settings/workflow`);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('Version switch', () => {});

test.describe('Workflow Enable Disable', () => {
  test('Form event Workflow Add Data Trigger Disable Do Not Trigger', async ({
    page,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

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
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: false,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const workflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { type: 1, collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionFieldData = triggerNodeFieldDisplayName + Math.random().toString(36).substring(2, 20);
    const triggerWorkflows = workflowKey;
    let triggerNodeCollectionRecords = await apiTriggerCustomActionEvent(triggerNodeCollectionName, triggerWorkflows, {
      orgname: triggerNodeCollectionFieldData,
    });
    await page.waitForTimeout(1000);

    // 3、预期结果：触发次数为1
    let getWorkflow = await apiGetWorkflow(workflowId);
    let getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    let getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(0);

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    await page.getByRole('switch', { name: 'On Off' }).click();

    triggerNodeCollectionRecords = await apiTriggerCustomActionEvent(triggerNodeCollectionName, triggerWorkflows, {
      orgname: triggerNodeCollectionFieldData + '1',
    });
    await page.waitForTimeout(1000);

    getWorkflow = await apiGetWorkflow(workflowId);
    getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    getWorkflowExecuted = getWorkflowObj.versionStats.executed;
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
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

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
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const workflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { type: 1, collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionFieldData = triggerNodeFieldDisplayName + Math.random().toString(36).substring(2, 20);
    const triggerWorkflows = workflowKey;
    let triggerNodeCollectionRecords = await apiTriggerCustomActionEvent(triggerNodeCollectionName, triggerWorkflows, {
      orgname: triggerNodeCollectionFieldData,
    });
    await page.waitForTimeout(1000);

    // 3、预期结果：触发次数为1
    let getWorkflow = await apiGetWorkflow(workflowId);
    let getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    let getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    await page.getByRole('switch', { name: 'On Off' }).click();

    triggerNodeCollectionRecords = await apiTriggerCustomActionEvent(triggerNodeCollectionName, triggerWorkflows, {
      orgname: triggerNodeCollectionFieldData + '1',
    });
    await page.waitForTimeout(1000);

    getWorkflow = await apiGetWorkflow(workflowId);
    getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('execution history', () => {});

test.describe('copy to new version', () => {
  test('Copy the Form event of the Configuration Trigger node', async ({ page, mockCollections, mockRecords }) => {
    //数据表后缀标识
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

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
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const workflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { type: 1, collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionFieldData = triggerNodeFieldDisplayName + Math.random().toString(36).substring(2, 20);
    const triggerWorkflows = workflowKey;
    const triggerNodeCollectionRecords = await apiTriggerCustomActionEvent(
      triggerNodeCollectionName,
      triggerWorkflows,
      { orgname: triggerNodeCollectionFieldData },
    );
    await page.waitForTimeout(1000);

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    await page.getByLabel('more').click();
    await page.getByLabel('revision').click();
    await page.waitForLoadState('load');

    // 3、预期结果：新版本工作流配置内容同旧版本一样
    const customActionEventTriggerNode = new CustomActionEventTriggerNode(
      page,
      workFlowName,
      triggerNodeCollectionName,
    );
    await customActionEventTriggerNode.nodeConfigure.click();
    await expect(
      page
        .getByLabel('block-item-DataSourceCollectionCascader-workflows-Collection')
        .getByText(`Main / ${triggerNodeCollectionDisplayName}`),
    ).toBeVisible();
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('delete version', () => {});

test.describe('Trigger node', () => {
  test('add new form trigger workflow button', async ({ page, mockPage, mockCollections }) => {
    //数据表后缀标识
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

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
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const workflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { type: 1, collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    //配置录入数据区块
    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0, { steps: 100 });
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-popup:addNew:addBlock-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).hover();
    await page.getByRole('menuitem', { name: 'Current collection' }).click();
    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .getByLabel(`schema-initializer-ActionBar-createForm:configureActions-${triggerNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Trigger workflow' }).click();
    // 绑定工作流
    await page.getByLabel(`schema-initializer-Grid-form:configureFields-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page
      .getByLabel(`action-Action-Trigger workflow-customize:triggerWorkflows-${triggerNodeCollectionName}-form`)
      .hover();
    await page
      .getByRole('button', {
        name: `designer-schema-settings-Action-actionSettings:submitToWorkflow-${triggerNodeCollectionName}`,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Bind workflows' }).click();
    await page.getByRole('button', { name: 'plus Add workflow' }).click();
    await page.getByRole('button', { name: 'Select workflow' }).click();
    await page.getByRole('option', { name: workFlowName }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionFieldData = triggerNodeFieldDisplayName + Math.random().toString(36).substring(2, 20);
    await page.getByRole('textbox').fill(triggerNodeCollectionFieldData);
    await page.getByRole('button', { name: 'Trigger workflow' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    // 3、预期结果：触发次数为1
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('edit form trigger workflow button', async ({ page, mockPage, mockRecords, mockCollections }) => {
    //数据表后缀标识
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

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
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const workflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { type: 1, collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    const triggerNodeCollectionFieldData = Math.random().toString(36).substring(2, 20);
    await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionFieldData }]);
    //配置录入数据区块
    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0, { steps: 100 });
    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.mouse.move(300, 0, { steps: 100 });

    await page.getByRole('button', { name: 'Actions', exact: true }).hover();
    await page
      .getByLabel(`designer-schema-initializer-TableV2.Column-fieldSettings:TableColumn-${triggerNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.mouse.move(100, 0, { steps: 100 });
    await page.mouse.click(100, 0);
    // await page.getByLabel(`action-Action.Link-View-view-${triggerNodeCollectionName}-table-0`).click();
    await page
      .locator('tr', { hasText: triggerNodeCollectionFieldData })
      .getByLabel('action-Action.Link-View-view-')
      .click();
    await page.waitForLoadState('load');
    await page.getByLabel(`schema-initializer-Grid-popup:common:addBlock-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form (Edit)' }).click();
    await page
      .getByLabel(`schema-initializer-ActionBar-editForm:configureActions-${triggerNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Trigger workflow' }).click();
    // 绑定工作流
    await page.getByLabel(`schema-initializer-Grid-form:configureFields-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page
      .getByLabel(`action-Action-Trigger workflow-customize:triggerWorkflows-${triggerNodeCollectionName}-form`)
      .hover();
    await page
      .getByRole('button', {
        name: `designer-schema-settings-Action-actionSettings:submitToWorkflow-${triggerNodeCollectionName}`,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Bind workflows' }).click();
    await page.getByRole('button', { name: 'plus Add workflow' }).click();
    await page.getByRole('button', { name: 'Select workflow' }).click();
    await page.getByRole('option', { name: workFlowName }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();

    // 2、测试步骤：添加数据触发工作流
    await page.getByRole('button', { name: 'Trigger workflow' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    // 3、预期结果：触发次数为1
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('table block trigger workflow action', async ({ page, mockPage, mockRecords, mockCollections }) => {
    //数据表后缀标识
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

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
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const workflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { type: 1, collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    const triggerNodeCollectionFieldData = Math.random().toString(36).substring(2, 20);
    await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionFieldData }]);
    //配置录入数据区块
    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0, { steps: 100 });
    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.mouse.move(300, 0, { steps: 100 });

    await page.getByRole('button', { name: 'Actions', exact: true }).hover();
    await page
      .getByLabel(`designer-schema-initializer-TableV2.Column-fieldSettings:TableColumn-${triggerNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Trigger workflow' }).click();

    await page.mouse.move(100, 0, { steps: 100 });
    await page.mouse.click(100, 0);
    await page
      .locator('tr', { hasText: triggerNodeCollectionFieldData })
      .getByLabel('action-Action.Link-Trigger')
      .hover();
    await page
      .getByLabel(`designer-schema-settings-Action.Link-actionSettings:submitToWorkflow-${triggerNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Bind workflows' }).click();
    await page.getByRole('button', { name: 'plus Add workflow' }).click();
    await page.getByRole('button', { name: 'Select workflow' }).click();
    await page.getByRole('option', { name: workFlowName }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();

    // 2、测试步骤：添加数据触发工作流
    await page
      .locator('tr', { hasText: triggerNodeCollectionFieldData })
      .getByLabel('action-Action.Link-Trigger')
      .click();
    await page.waitForTimeout(1000);

    // 3、预期结果：触发次数为1
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('details block trigger workflow button', async ({ page, mockPage, mockRecords, mockCollections }) => {
    //数据表后缀标识
    const triggerNodeAppendText = Math.random().toString(36).substring(2, 20);

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
    const workFlowName = Math.random().toString(36).substring(2, 20);
    const workflowData = {
      current: true,
      options: { deleteExecutionOnStatus: [] },
      title: workFlowName,
      sync: false,
      type: 'custom-action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;
    const workflowKey = workflowObj.key;

    //配置工作流触发器
    const triggerNodeData = { config: { type: 1, collection: triggerNodeCollectionName, appends: [] } };
    const triggerNode = await apiUpdateWorkflowTrigger(workflowId, triggerNodeData);
    const triggerNodeObj = JSON.parse(JSON.stringify(triggerNode));

    const triggerNodeCollectionFieldData = Math.random().toString(36).substring(2, 20);
    await mockRecords(triggerNodeCollectionName, [{ orgname: triggerNodeCollectionFieldData }]);
    //配置录入数据区块
    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    const dataSourcesCount = await apiGetDataSourceCount();
    if (dataSourcesCount > 1) {
      await page.getByRole('menuitem', { name: 'Main right' }).hover();
    }
    await page.getByRole('menuitem', { name: `${triggerNodeCollectionDisplayName}` }).click();

    // 移开鼠标，关闭菜单
    await page.getByLabel(`schema-initializer-ActionBar-details:configureActions-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'Trigger workflow' }).click();
    await page
      .getByLabel(`action-Action-Trigger workflow-customize:triggerWorkflows-${triggerNodeCollectionName}-details`)
      .hover();
    await page
      .getByLabel(`designer-schema-settings-Action-actionSettings:submitToWorkflow-${triggerNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Bind workflows' }).click();
    await page.getByRole('button', { name: 'plus Add workflow' }).click();
    await page.getByRole('button', { name: 'Select workflow' }).click();
    await page.getByRole('option', { name: workFlowName }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();

    // 2、测试步骤：添加数据触发工作流
    await page
      .getByLabel(`action-Action-Trigger workflow-customize:triggerWorkflows-${triggerNodeCollectionName}-details`)
      .click();
    await page.waitForTimeout(1000);

    // 3、预期结果：触发次数为1
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('Node Add Modify Delete', () => {});
