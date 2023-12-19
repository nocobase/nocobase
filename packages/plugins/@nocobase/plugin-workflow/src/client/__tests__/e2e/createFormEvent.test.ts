import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { CreateWorkFlow } from './pageobject/workFlow';

test.describe('workflow manage', () => {
  test('add new from event', async ({ page }) => {
    //用例编号
    const caseNum = 'WF02AA';
    //用例标题
    const caseTitle = 'add new from event';

    // 1、前置条件：已登录

    // 2、测试步骤：进入“工作流管理”-“新建”按钮，填写表单，点击“确定”按钮
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Form event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    // 3、预期结果：新建成功，列表中出现新建的工作流
    await expect(page.getByText(workFlowName)).toBeVisible();

    // 4、后置处理：删除新建的工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});
