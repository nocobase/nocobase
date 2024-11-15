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
  apiCreateRecordTriggerFormEvent,
  apiCreateWorkflow,
  apiDeleteWorkflow,
  apiUpdateWorkflowTrigger,
  appendJsonCollectionName,
  generalWithNoRelationalFields,
} from '@nocobase/plugin-workflow-test/e2e';
import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';

test.describe('Configuration page version switching', () => {});

test.describe('Configuration page execution history', () => {});

test.describe('Configuration page copy to new version', () => {
  test('Copy the action event of the Configuration Trigger node', async ({ page, mockCollections, mockRecords }) => {
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
    await page.waitForLoadState('load');
    await page.getByLabel('more').click();
    await page.getByLabel('revision').click();
    await page.waitForLoadState('load');

    // 3、预期结果：新版本工作流配置内容同旧版本一样
    const formEventTriggerNode = new FormEventTriggerNode(page, workFlowName, triggerNodeCollectionName);
    await formEventTriggerNode.nodeConfigure.click();
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
