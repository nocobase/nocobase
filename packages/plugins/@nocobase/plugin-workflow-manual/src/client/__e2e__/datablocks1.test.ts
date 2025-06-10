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
  ManualNode,
  apiCreateWorkflow,
  apiCreateWorkflowNode,
  apiDeleteWorkflow,
  apiFilterList,
  apiGetList,
  apiGetWorkflow,
  apiGetWorkflowNode,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test.describe('field data', () => {
  test('Collection event to add a data trigger, get single line text data for manual node custom form', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    const preManualNodeAppendText = 'c' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建前置Manual节点数据表
    const preManualNodeCollectionDisplayName = `自动>组织[普通表]${preManualNodeAppendText}`;
    const preManualNodeCollectionName = `tt_amt_org${preManualNodeAppendText}`;
    const preManualNodeFieldName = 'orgname';
    const preManualNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), preManualNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'orgname';
    const manualNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
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
    //配置前置Manual节点
    const preManualNodeTitle = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const preManualNodeData = {
      type: 'manual',
      upstreamId: null,
      branchIndex: null,
      title: preManualNodeTitle,
      config: { assignees: [1], schema: null, forms: {} },
    };
    const preManualNode = await apiCreateWorkflowNode(workflowId, preManualNodeData);
    const preManualNodeObj = JSON.parse(JSON.stringify(preManualNode));
    const preAggregateNodeId = preManualNodeObj.id;
    const getAggregateNode = await apiGetWorkflowNode(preAggregateNodeId);
    const preAggregateNodeKey = getAggregateNode.key;

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const preManualNodePom = new ManualNode(page, preManualNodeTitle);
    await preManualNodePom.nodeConfigure.click();
    await preManualNodePom.configureUserInterfaceButton.click();
    await preManualNodePom.addBlockButton.hover();
    await preManualNodePom.customFormMenu.click();
    await page.mouse.move(300, 0, { steps: 100 });
    // 获取自定义表单的随机值
    const configureFieldsButton = page.locator(
      'button[aria-label^="schema-initializer-Grid-workflowManual:customForm:configureFields-"]',
    );
    const ariaLabel = await configureFieldsButton.getAttribute('aria-label');
    const randomValue = ariaLabel.split('-').pop();

    await page
      .locator(`button[aria-label^="schema-initializer-Grid-workflowManual:customForm:configureFields-${randomValue}"]`)
      .hover();
    await page.getByLabel(`designer-schema-settings-CardItem-SimpleDesigner-${randomValue}`).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Form' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-title').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-workflowManual:customForm:configureFields-${randomValue}"]`)
      .hover();
    await page.getByRole('menuitem', { name: 'Single line text' }).click();
    await page
      .getByLabel(`block-item-Input-${randomValue}-Field display name`)
      .getByRole('textbox')
      .fill('公司名称(单行文本)');
    await page.getByLabel(`block-item-Input-${randomValue}-Field name`).getByRole('textbox').fill('orgname');
    await page.getByLabel(`action-Action-Submit-${randomValue}`).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await preManualNodePom.submitButton.click();
    await page.waitForLoadState('load');
    //配置Manual节点
    await preManualNodePom.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.nodeDataMenu.hover();
    await page.getByRole('menuitem', { name: preManualNodeTitle }).hover();
    await page.getByRole('menuitem', { name: blockTitle }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.getByText('Configure fields').hover();
    await page.getByRole('menuitem', { name: '公司名称(单行文本)' }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page.locator('.itemCss', { hasText: preManualNodeTitle }).getByLabel('action-Action.Link-View-view-').click();
    const preManualNodeRecord = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(preManualNodeRecord);
    await page.getByRole('button', { name: 'Continue the process' }).click();
    await page.waitForTimeout(300);
    await page.getByLabel('action-Filter.Action-Filter-').click();
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByRole('button', { name: 'Task title' }).click();
    // await page.getByRole('menuitemcheckbox', { name: 'Task title' }).click();
    await page.getByRole('textbox').first().fill(manualNodeName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(300);
    await page.locator('.itemCss', { hasText: manualNodeName }).getByLabel('action-Action.Link-View-view-').click();
    await expect(page.getByText(preManualNodeRecord)).toBeAttached();
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, get single line text data for manual node create record form', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    const preManualNodeAppendText = 'c' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建前置Manual节点数据表
    const preManualNodeCollectionDisplayName = `自动>组织[普通表]${preManualNodeAppendText}`;
    const preManualNodeCollectionName = `tt_amt_org${preManualNodeAppendText}`;
    const preManualNodeFieldName = 'orgname';
    const preManualNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), preManualNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'orgname';
    const manualNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
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
    //配置前置Manual节点
    const preManualNodeTitle = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const preManualNodeData = {
      type: 'manual',
      upstreamId: null,
      branchIndex: null,
      title: preManualNodeTitle,
      config: { assignees: [1], schema: null, forms: {} },
    };
    const preManualNode = await apiCreateWorkflowNode(workflowId, preManualNodeData);
    const preManualNodeObj = JSON.parse(JSON.stringify(preManualNode));
    const preAggregateNodeId = preManualNodeObj.id;
    const getAggregateNode = await apiGetWorkflowNode(preAggregateNodeId);
    const preAggregateNodeKey = getAggregateNode.key;

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const preManualNodePom = new ManualNode(page, preManualNodeTitle);
    await preManualNodePom.nodeConfigure.click();
    await preManualNodePom.configureUserInterfaceButton.click();
    await preManualNodePom.addBlockButton.hover();
    await preManualNodePom.createRecordFormMenu.hover();
    await page.getByRole('menuitem', { name: preManualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${preManualNodeCollectionName}"]`)
      .hover();
    await page
      .getByLabel(`designer-schema-settings-CardItem-CreateFormDesigner-${preManualNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Create record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-title').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${preManualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: triggerNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await preManualNodePom.submitButton.click();
    await page.waitForLoadState('load');
    //配置Manual节点
    await preManualNodePom.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.nodeDataMenu.hover();
    await page.getByRole('menuitem', { name: preManualNodeTitle }).hover();
    await page.getByRole('menuitem', { name: blockTitle }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.getByText('Configure fields').hover();
    await page.getByRole('menuitem', { name: '公司名称(单行文本)' }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page.locator('.itemCss', { hasText: preManualNodeTitle }).getByLabel('action-Action.Link-View-view-').click();
    const preManualNodeRecord = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(preManualNodeRecord);
    await page.getByRole('button', { name: 'Continue the process' }).click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByTestId('select-filter-field').click();
    // await page.getByRole('menuitemcheckbox', { name: 'Task title' }).click();
    await page.getByRole('textbox').first().fill(manualNodeName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(300);
    await page.locator('.itemCss', { hasText: manualNodeName }).getByLabel('action-Action.Link-View-view-').click();
    await expect(page.getByText(preManualNodeRecord)).toBeAttached();

    const createNodeCollectionData = await apiGetList(preManualNodeCollectionName);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(1);
    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, get single line text data for manual node update record form', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();
    const preManualNodeAppendText = 'c' + dayjs().format('HHmmss').toString();
    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建前置Manual节点数据表
    const preManualNodeCollectionDisplayName = `自动>组织[普通表]${preManualNodeAppendText}`;
    const preManualNodeCollectionName = `tt_amt_org${preManualNodeAppendText}`;
    const preManualNodeFieldName = 'orgname';
    const preManualNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), preManualNodeAppendText)
        .collections,
    );
    const preManualNodeCollectioRecordOne = [
      { orgname: '公司名称(单行文本)1', status_singleselect: '1', staffnum: 10 },
    ];
    const preManualNodeCollectioRecordTwo = [
      { orgname: '公司名称(单行文本)2', status_singleselect: '1', staffnum: 20 },
    ];
    const preManualNodeCollectioRecordThree = [
      { orgname: '公司名称(单行文本)3', status_singleselect: '1', staffnum: 30 },
    ];
    const preManualNodeCollectioRecordFour = [
      { orgname: '公司名称(单行文本)4', status_singleselect: '1', staffnum: 40 },
    ];
    const preManualNodeCollectioRecordFive = [
      { orgname: '公司名称(单行文本)5', status_singleselect: '2', staffnum: 10 },
    ];
    const preManualNodeCollectioRecordSix = [
      { orgname: '公司名称(单行文本)6', status_singleselect: '2', staffnum: 20 },
    ];
    const preManualNodeCollectioRecordSeven = [
      { orgname: '公司名称(单行文本)7', status_singleselect: '2', staffnum: 30 },
    ];
    const preManualNodeCollectioRecordEight = [
      { orgname: '公司名称(单行文本)8', status_singleselect: '2', staffnum: 40 },
    ];
    await mockRecords(preManualNodeCollectionName, preManualNodeCollectioRecordOne);
    await mockRecords(preManualNodeCollectionName, preManualNodeCollectioRecordTwo);
    await mockRecords(preManualNodeCollectionName, preManualNodeCollectioRecordThree);
    await mockRecords(preManualNodeCollectionName, preManualNodeCollectioRecordFour);
    await mockRecords(preManualNodeCollectionName, preManualNodeCollectioRecordFive);
    await mockRecords(preManualNodeCollectionName, preManualNodeCollectioRecordSix);
    await mockRecords(preManualNodeCollectionName, preManualNodeCollectioRecordSeven);
    await mockRecords(preManualNodeCollectionName, preManualNodeCollectioRecordEight);
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'orgname';
    const manualNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), manualNodeAppendText)
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
    //配置前置Manual节点
    const preManualNodeTitle = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const preManualNodeData = {
      type: 'manual',
      upstreamId: null,
      branchIndex: null,
      title: preManualNodeTitle,
      config: { assignees: [1], schema: null, forms: {} },
    };
    const preManualNode = await apiCreateWorkflowNode(workflowId, preManualNodeData);
    const preManualNodeObj = JSON.parse(JSON.stringify(preManualNode));
    const preAggregateNodeId = preManualNodeObj.id;
    const getAggregateNode = await apiGetWorkflowNode(preAggregateNodeId);
    const preAggregateNodeKey = getAggregateNode.key;

    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const preManualNodePom = new ManualNode(page, preManualNodeTitle);
    await preManualNodePom.nodeConfigure.click();
    await preManualNodePom.configureUserInterfaceButton.click();
    await preManualNodePom.addBlockButton.hover();
    await preManualNodePom.updateRecordFormMenu.hover();
    await page.getByRole('menuitem', { name: preManualNodeCollectionDisplayName }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${preManualNodeCollectionName}"]`)
      .hover();
    await page
      .getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${preManualNodeCollectionName}`)
      .click();
    await page.getByRole('menuitem', { name: 'Filter settings' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'exists', exact: true }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${preManualNodeCollectionName}"]`)
      .hover();
    await page
      .getByLabel(`designer-schema-settings-CardItem-UpdateFormDesigner-${preManualNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const blockTitle = 'Update record' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('block-title').fill(blockTitle);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .locator(`button[aria-label^="schema-initializer-Grid-form:configureFields-${preManualNodeCollectionName}"]`)
      .hover();
    await page.getByRole('menuitem', { name: triggerNodeFieldDisplayName }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await preManualNodePom.submitButton.click();
    await page.waitForLoadState('load');
    //配置Manual节点
    await preManualNodePom.addNodeButton.click();
    await page.getByRole('button', { name: 'manual', exact: true }).click();
    const manualNodeName = 'Manual' + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByLabel('Manual-Manual', { exact: true }).getByRole('textbox').fill(manualNodeName);
    const manualNode = new ManualNode(page, manualNodeName);
    const manualNodeId = await manualNode.node.locator('.workflow-node-id').innerText();
    await manualNode.nodeConfigure.click();
    await manualNode.assigneesDropDown.click();
    await page.getByRole('option', { name: 'Super Admin' }).click();
    await manualNode.configureUserInterfaceButton.click();
    await manualNode.addBlockButton.hover();
    await manualNode.nodeDataMenu.hover();
    await page.getByRole('menuitem', { name: preManualNodeTitle }).hover();
    await page.getByRole('menuitem', { name: blockTitle }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.getByText('Configure fields').hover();
    await page.getByRole('menuitem', { name: '公司名称(单行文本)' }).getByRole('switch').click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();

    // 2、测试步骤：添加数据触发工作流
    const triggerNodeCollectionRecordOne =
      triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    const triggerNodeCollectionRecords = await mockRecords(triggerNodeCollectionName, [
      { orgname: triggerNodeCollectionRecordOne },
    ]);
    await page.waitForTimeout(1000);
    // 3、预期结果：工作流成功触发,待办弹窗表单中显示数据
    const getWorkflow = await apiGetWorkflow(workflowId);
    const getWorkflowObj = JSON.parse(JSON.stringify(getWorkflow));
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page.locator('.itemCss', { hasText: preManualNodeTitle }).getByLabel('action-Action.Link-View-view-').click();
    const preManualNodeRecord = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(preManualNodeRecord);
    await page.getByRole('button', { name: 'Continue the process' }).click();
    await page.getByLabel('action-Filter.Action-Filter-').click();
    // await page.getByText('Add condition', { exact: true }).click();
    // await page.getByTestId('select-filter-field').click();
    // await page.getByRole('menuitemcheckbox', { name: 'Task title' }).click();
    await page.getByRole('textbox').first().fill(manualNodeName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(300);
    await page.locator('.itemCss', { hasText: manualNodeName }).getByLabel('action-Action.Link-View-view-').click();
    await expect(page.getByText(preManualNodeRecord)).toBeAttached();
    const filter = `pageSize=20&page=1&filter={"$and":[{"orgname":{"$eq":"${preManualNodeRecord}"}}]}`;
    const createNodeCollectionData = await apiFilterList(preManualNodeCollectionName, filter);
    const createNodeCollectionDataObj = JSON.parse(JSON.stringify(createNodeCollectionData));
    expect(createNodeCollectionDataObj.meta.count).toBe(8);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});
