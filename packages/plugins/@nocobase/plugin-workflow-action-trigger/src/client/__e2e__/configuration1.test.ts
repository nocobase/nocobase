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
  FormEventTriggerNode,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetDataSourceCount,
  apiGetWorkflow,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

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
      type: 'action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const formEventTriggerNode = new FormEventTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await formEventTriggerNode.nodeConfigure.click();
    await formEventTriggerNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
    await formEventTriggerNode.submitButton.click();

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
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-popup:addNew:addBlock-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).hover();
    await page.getByRole('menuitem', { name: 'Current collection' }).click();
    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);
    await page
      .getByLabel(`schema-initializer-ActionBar-createForm:configureActions-${triggerNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    // 绑定工作流
    await page.getByLabel(`schema-initializer-Grid-form:configureFields-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`).hover();
    await page
      .getByRole('button', {
        name: `designer-schema-settings-Action-actionSettings:createSubmit-${triggerNodeCollectionName}`,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Bind workflows' }).click();
    await page.getByRole('button', { name: 'plus Add workflow' }).click();
    await page.getByRole('button', { name: 'Select workflow' }).click();
    await page.getByRole('option', { name: workFlowName }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page.getByLabel(`action-Action-Submit-submit-${triggerNodeCollectionName}-form`, { exact: true }).click();
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

  // TODO: 需要转移到新事件中
  test.skip('Form Submit to Workflow Button Add Data Trigger', async ({
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
      type: 'action',
      enabled: true,
    };
    const workflow = await apiCreateWorkflow(workflowData);
    const workflowObj = JSON.parse(JSON.stringify(workflow));
    const workflowId = workflowObj.id;

    //配置工作流触发器
    await page.goto(`admin/workflow/workflows/${workflowId}`);
    await page.waitForLoadState('load');
    const formEventTriggerNode = new FormEventTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await formEventTriggerNode.nodeConfigure.click();
    await formEventTriggerNode.collectionDropDown.click();
    await page.getByRole('menuitemcheckbox', { name: 'Main right' }).click();
    await page.getByRole('menuitemcheckbox', { name: triggerNodeCollectionDisplayName }).click();
    await formEventTriggerNode.submitButton.click();

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
    await page.mouse.move(300, 0);

    await page.getByText('Configure columns').hover();
    await page.getByText(triggerNodeFieldDisplayName).click();
    await page.getByText('Configure actions').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).click();

    await page.getByLabel(`action-Action-Add new-create-${triggerNodeCollectionName}-table`).click();
    await page.getByLabel(`schema-initializer-Grid-popup:addNew:addBlock-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 移开鼠标，关闭菜单
    await page.mouse.move(300, 0);

    // 绑定工作流
    await page
      .getByLabel(`schema-initializer-ActionBar-createForm:configureActions-${triggerNodeCollectionName}`)
      .hover();
    await page.getByRole('menuitem', { name: 'Submit to workflow' }).click();
    await page.getByLabel(`schema-initializer-Grid-form:configureFields-${triggerNodeCollectionName}`).hover();
    await page.getByRole('menuitem', { name: `${triggerNodeFieldDisplayName}` }).click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Submit to workflow' }).hover();
    await page
      .getByRole('button', {
        name: `designer-schema-settings-Action-Action.Designer-${triggerNodeCollectionName}`,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Bind workflows' }).click();
    await page.getByRole('button', { name: 'plus Add workflow' }).click();
    await page.getByRole('button', { name: 'Select workflow' }).click();
    await page.getByRole('option', { name: workFlowName }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();

    // 2、测试步骤：进入“数据区块”-“添加”按钮，填写表单，点击“确定”按钮
    const fieldData = triggerNodeFieldDisplayName + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await page.getByRole('textbox').fill(fieldData);
    await page
      .getByLabel(`action-Action-Submit to workflow-customize:triggerWorkflows-${triggerNodeCollectionName}-form`)
      .click();
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
});
