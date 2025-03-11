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
  ManualNode,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiGetWorkflowNodeExecutions,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test.describe('field data entry', () => {
  test('Collection event to add a data trigger, entering multiple select data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'range_multipleselect';
    const manualNodeFieldDisplayName = '经营范围(下拉多选)';
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
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
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
    await manualNode.customFormMenu.click();
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
    await page.getByRole('menuitem', { name: 'Multiple select', exact: true }).click();
    await page
      .getByLabel(`block-item-Input-${randomValue}-Field display name`)
      .getByRole('textbox')
      .fill(manualNodeFieldDisplayName);
    await page.getByLabel(`block-item-Input-${randomValue}-Field name`).getByRole('textbox').fill(manualNodeFieldName);
    await page.getByRole('button', { name: 'Add option' }).click();
    await page.getByRole('button', { name: 'Add option' }).click();
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').first().fill('F3134');
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').nth(1).fill('软件销售');
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').nth(2).fill('I3006');
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').nth(3).fill('软件开发');
    await page.getByLabel(`action-Action-Submit-${randomValue}`).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('load');

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
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page.locator('.ant-list', { hasText: manualNodeName }).getByLabel('action-Action.Link-View-view-').click();
    await page.getByTestId('select-multiple').click();
    await page.getByRole('option', { name: '软件销售', exact: true }).click();
    await page.getByRole('option', { name: '软件开发', exact: true }).click();
    await page.getByTestId('select-multiple').click();
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    let resultFieldValue = '';
    const expectFieldValue = ['F3134', 'I3006'];
    for (const key in manualNodeJobResult) {
      if (Object.prototype.hasOwnProperty.call(manualNodeJobResult[key], 'range_multipleselect')) {
        resultFieldValue = manualNodeJobResult[key]['range_multipleselect'];
        break;
      }
    }
    const isEqual = JSON.stringify(resultFieldValue) === JSON.stringify(expectFieldValue);
    expect(isEqual).toBe(true);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, entering radio group data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'status_radio';
    const manualNodeFieldDisplayName = '公司状态(单选)';
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
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
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
    await manualNode.customFormMenu.click();
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
    await page.getByRole('menuitem', { name: 'Radio group', exact: true }).click();
    await page
      .getByLabel(`block-item-Input-${randomValue}-Field display name`)
      .getByRole('textbox')
      .fill(manualNodeFieldDisplayName);
    await page.getByLabel(`block-item-Input-${randomValue}-Field name`).getByRole('textbox').fill(manualNodeFieldName);
    await page.getByRole('button', { name: 'Add option' }).click();
    await page.getByRole('button', { name: 'Add option' }).click();
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').first().fill('1');
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').nth(1).fill('存续');
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').nth(2).fill('2');
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').nth(3).fill('在业');
    await page.getByLabel(`action-Action-Submit-${randomValue}`).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('load');

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
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page.locator('.ant-list', { hasText: manualNodeName }).getByLabel('action-Action.Link-View-view-').click();
    // const manualNodeRecord = faker.number.float({ min: 0, max: 100, precision: 2 });
    await page.getByLabel('存续').check();
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    const hasIsenable = Object.values(manualNodeJobResult).some(
      (value) => (value as { status_radio: string }).status_radio === '1',
    );
    expect(hasIsenable).toBe(true);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, entering checkbox group data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'range_check';
    const manualNodeFieldDisplayName = '经营范围(复选)';
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
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
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
    await manualNode.customFormMenu.click();
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
    await page.getByRole('menuitem', { name: 'Checkbox group', exact: true }).click();
    await page
      .getByLabel(`block-item-Input-${randomValue}-Field display name`)
      .getByRole('textbox')
      .fill(manualNodeFieldDisplayName);
    await page.getByLabel(`block-item-Input-${randomValue}-Field name`).getByRole('textbox').fill(manualNodeFieldName);
    await page.getByRole('button', { name: 'Add option' }).click();
    await page.getByRole('button', { name: 'Add option' }).click();
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').first().fill('F3134');
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').nth(1).fill('软件销售');
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').nth(2).fill('I3006');
    await page.getByLabel('block-item-ArrayTable-').getByRole('textbox').nth(3).fill('软件开发');
    await page.getByLabel(`action-Action-Submit-${randomValue}`).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('load');

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
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page.locator('.ant-list', { hasText: manualNodeName }).getByLabel('action-Action.Link-View-view-').click();
    await page.getByLabel('软件销售', { exact: true }).check();
    await page.getByLabel('软件开发', { exact: true }).check();
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    let resultFieldValue = '';
    const expectFieldValue = ['F3134', 'I3006'];
    for (const key in manualNodeJobResult) {
      if (Object.prototype.hasOwnProperty.call(manualNodeJobResult[key], 'range_check')) {
        resultFieldValue = manualNodeJobResult[key]['range_check'];
        break;
      }
    }
    const isEqual = JSON.stringify(resultFieldValue) === JSON.stringify(expectFieldValue);
    expect(isEqual).toBe(true);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });

  test('Collection event to add a data trigger, entering datetime data', async ({
    page,
    mockPage,
    mockCollections,
    mockRecords,
  }) => {
    //数据表后缀标识
    const triggerNodeAppendText = 'a' + faker.string.alphanumeric(4);
    const manualNodeAppendText = 'b' + dayjs().format('HHmmss').toString();

    // 创建触发器节点数据表
    const triggerNodeCollectionDisplayName = `自动>组织[普通表]${triggerNodeAppendText}`;
    const triggerNodeCollectionName = `tt_amt_org${triggerNodeAppendText}`;
    const triggerNodeFieldName = 'orgname';
    const triggerNodeFieldDisplayName = '公司名称(单行文本)';
    await mockCollections(
      appendJsonCollectionName(JSON.parse(JSON.stringify(generalWithNoRelationalFields)), triggerNodeAppendText)
        .collections,
    );
    // 创建Manual节点数据表
    const manualNodeCollectionDisplayName = `自动>组织[普通表]${manualNodeAppendText}`;
    const manualNodeCollectionName = `tt_amt_org${manualNodeAppendText}`;
    const manualNodeFieldName = 'establishdate';
    const manualNodeFieldDisplayName = '成立日期(日期)';
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
    //配置Manual节点
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const collectionTriggerNode = new CollectionTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await collectionTriggerNode.addNodeButton.click();
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
    await manualNode.customFormMenu.click();
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
    await page.getByRole('menuitem', { name: 'Datetime (with time zone)' }).click();
    await page
      .getByLabel(`block-item-Input-${randomValue}-Field display name`)
      .getByRole('textbox')
      .fill(manualNodeFieldDisplayName);
    await page.getByLabel(`block-item-Input-${randomValue}-Field name`).getByRole('textbox').fill(manualNodeFieldName);
    await page.getByLabel(`action-Action-Submit-${randomValue}`).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await manualNode.submitButton.click();
    await page.waitForLoadState('load');

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
    const getWorkflowExecuted = getWorkflowObj.executed;
    expect(getWorkflowExecuted).toBe(1);

    const newPage = mockPage();
    await newPage.goto();
    await page.waitForLoadState('load');
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'check-square Workflow todos' }).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.waitForTimeout(300);
    await page.locator('.ant-list', { hasText: manualNodeName }).getByLabel('action-Action.Link-View-view-').click();
    const manualNodeRecord = dayjs().format('YYYY-MM-DD');
    await page.getByPlaceholder('Select date').click();
    await page.getByTitle(manualNodeRecord.toString()).click();
    await page.mouse.move(300, 0, { steps: 100 });
    await page.mouse.click(300, 0);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Continue the process' }).click();

    await page.waitForTimeout(1000);
    const getWorkflowNodeExecutions = await apiGetWorkflowNodeExecutions(workflowId);
    const getWorkflowNodeExecutionsObj = JSON.parse(JSON.stringify(getWorkflowNodeExecutions));
    getWorkflowNodeExecutionsObj.sort(function (a: { id: number }, b: { id: number }) {
      return b.id - a.id;
    });
    const jobs = getWorkflowNodeExecutionsObj[0].jobs;
    const manualNodeJob = jobs.find((job) => job.nodeId.toString() === manualNodeId);
    const manualNodeJobStatus = manualNodeJob.status;
    expect(manualNodeJobStatus).toBe(1);

    const manualNodeJobResult = manualNodeJob.result;
    let resultFieldValue = '';
    for (const key in manualNodeJobResult) {
      if (Object.prototype.hasOwnProperty.call(manualNodeJobResult[key], 'establishdate')) {
        resultFieldValue = manualNodeJobResult[key]['establishdate'];
        break;
      }
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeWithTimeZone = now.toLocaleString('en-US', { timeZone: timeZone });
    // 转换为0时区的时间
    const timeInUTC = new Date(timeWithTimeZone).toISOString();

    expect(resultFieldValue).toBe(timeInUTC);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});
