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
      type: 'action',
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
  test('add new Action event', async ({ page }) => {
    // 添加工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = faker.string.alphanumeric(5);
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Action event' }).click();
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
  test('delete Action event', async ({ page }) => {
    //添加工作流
    const triggerNodeAppendText = faker.string.alphanumeric(5);
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
  test('edit Action event name', async ({ page }) => {
    //添加工作流
    const triggerNodeAppendText = faker.string.alphanumeric(5);
    let workFlowName = faker.string.alphanumeric(5) + triggerNodeAppendText;
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
  test('Duplicate Action event triggers with only unconfigured trigger nodes', async ({ page }) => {
    //添加工作流
    const triggerNodeAppendText = faker.string.alphanumeric(5);
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

    // 2、复制工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(`action-Action.Link-Duplicate-workflows-${workFlowName}`).click();
    await page.getByLabel(`action-Action-Submit-workflows-${workFlowName}`).click();
    await page.waitForLoadState('networkidle');
    // 3、预期结果：列表中出现筛选的工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByText(`${workFlowName} copy`)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}  copy`).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(`${workFlowName} copy`)).toBeHidden();
    await apiDeleteWorkflow(workflowId);
  });
});

test.describe('Executed', () => {});
