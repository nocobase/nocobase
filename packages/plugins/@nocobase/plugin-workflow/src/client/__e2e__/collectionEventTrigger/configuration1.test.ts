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
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiUpdateRecord,
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
    await page.waitForLoadState('load');
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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
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
    await page.waitForLoadState('load');
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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
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
    await page.waitForLoadState('load');
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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
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
    await page.waitForLoadState('load');
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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
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
    await page.waitForLoadState('load');
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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);

    // 4、后置处理：删除工作流
    await apiDeleteWorkflow(workflowId);
  });
});
