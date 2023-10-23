import { expect, test } from '@nocobase/test/client';
import { CreateWorkFlow, EditWorkFlow } from './pageobject/workFlow';
import { dayjs } from '@nocobase/utils';

test.describe('workflow manage', () => {
  test('edit from event name', async ({ page }) => {
    //用例编号
    const caseNum = 'WF05AA';
    //用例标题
    const caseTitle = 'edit from event name';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow/workflows');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('create-action').click();
    const createWorkFlow = new CreateWorkFlow(page);
    let workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByText('Form event').click();
    await page.getByTestId('submit-action').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“编辑”按钮，编辑名称，点击“确定”按钮
    await page.getByTestId('update-action').click();
    const editWorkFlow = new EditWorkFlow(page);
    workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await page.getByTestId('submit-action').click();

    // 3、预期结果：编辑成功，列表中出现编辑后的工作流
    await expect(page.getByText(workFlowName)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByTestId('filter-action').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('cell', { name: 'Configure Edit Duplicate Delete' }).getByTestId('delete-action').click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});
