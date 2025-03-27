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
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiGetWorkflow,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';

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
    await page.waitForLoadState('load');

    // 2、测试步骤：跳转到工作流管理页面
    await page.getByRole('link', { name: 'Workflow' }).click();

    // 3、预期结果：跳转路径正确
    await page.waitForLoadState('load');
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
    const getWorkflowExecuted = getWorkflowObj.versionStats.executed;
    expect(getWorkflowExecuted).toBe(1);
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
});
