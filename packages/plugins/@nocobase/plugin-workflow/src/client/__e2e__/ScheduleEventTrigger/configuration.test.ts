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
  ScheduleTriggerNode,
  WorkflowListRecords,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';

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
    await page.waitForLoadState('load');
    const workflowListRecords = new WorkflowListRecords(page, workFlowName);

    await workflowListRecords.configureAction.click();
    await page.getByLabel('more').click();
    await page.getByLabel('revision').click();
    await page.waitForLoadState('load');
    const scheduleTriggerNode = new ScheduleTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await scheduleTriggerNode.nodeConfigure.click();
    // 3、预期结果：startTime时间为60秒后的时间
    const timeWithoutTimeZonea = now.toLocaleString('en-US', { timeZone: timeZone, hour12: false });
    // 将 MM/DD/YYYY, HH:mm:ss 格式的字符串转换为 YYYY-MM-DD HH:mm:ss 格式
    const parts = timeWithoutTimeZonea.split(/[\s,/:]+/);
    if (parts[3] === '24') {
      parts[3] = '00';
    }
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
