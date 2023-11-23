import { expect, test } from '@nocobase/test/client';
import { dayjs } from '@nocobase/utils';
import { CreateWorkFlow, EditWorkFlow } from './pageobject/workFlow';

test.describe('filter workflow', () => {
  test('filter workflow name', async ({ page }) => {
    //用例标题
    const caseTitle = 'filter workflow name';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Form event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“筛选”按钮，筛选工作流名称
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();

    // 3、预期结果：列表中出现筛选的工作流
    await expect(page.getByText(workFlowName)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});

test.describe('add new workflow', () => {
  test('add new form event', async ({ page }) => {
    //用例标题
    const caseTitle = 'add new form event';

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
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('add new schedule event', async ({ page }) => {
    //用例标题
    const caseTitle = 'add new schedule event';

    // 1、前置条件：已登录

    // 2、测试步骤：进入“工作流管理”-“新建”按钮，填写表单，点击“确定”按钮
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Schedule event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    // 3、预期结果：新建成功，列表中出现新建的工作流
    await expect(page.getByText(workFlowName)).toBeVisible();

    // 4、后置处理：删除新建的工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('add new collection event', async ({ page }) => {
    //用例标题
    const caseTitle = 'add new collection event';

    // 1、前置条件：已登录

    // 2、测试步骤：进入“工作流管理”-“新建”按钮，填写表单，点击“确定”按钮
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Collection event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    // 3、预期结果：新建成功，列表中出现新建的工作流
    await expect(page.getByText(workFlowName)).toBeVisible();

    // 4、后置处理：删除新建的工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test.skip('add new approval', async ({ page }) => {
    //用例标题
    const caseTitle = 'add new approval';

    // 1、前置条件：已登录

    // 2、测试步骤：进入“工作流管理”-“新建”按钮，填写表单，点击“确定”按钮
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Approval' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    // 3、预期结果：新建成功，列表中出现新建的工作流
    await expect(page.getByText(workFlowName)).toBeVisible();

    // 4、后置处理：删除新建的工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});

test.describe('sync workflow', () => {});

test.describe('delete workflow', () => {
  test('delete form event', async ({ page }) => {
    //用例标题
    const caseTitle = 'delete form event';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Form event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“删除”操作，删除工作流名称
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // 3、预期结果：列表中出现筛选的工作流
    await expect(page.getByText(workFlowName)).toBeHidden();

    // 4、后置处理：删除工作流
  });

  test('delete schedule event', async ({ page }) => {
    //用例标题
    const caseTitle = 'delete schedule event';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Schedule event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“删除”操作，删除工作流名称
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // 3、预期结果：列表中出现筛选的工作流
    await expect(page.getByText(workFlowName)).toBeHidden();

    // 4、后置处理：删除工作流
  });

  test('delete collection event', async ({ page }) => {
    //用例标题
    const caseTitle = 'delete collection event';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Collection event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“删除”操作，删除工作流名称
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // 4、后置处理：删除工作流
  });

  test.skip('delete approval', async ({ page }) => {
    //用例标题
    const caseTitle = 'delete approval';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Approval' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“删除”操作，删除工作流名称
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // 4、后置处理：删除工作流
  });
});

test.describe('edit workflow', () => {
  test('edit form event name', async ({ page }) => {
    //用例标题
    const caseTitle = 'edit form event name';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    let workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Form event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“编辑”按钮，编辑名称，点击“确定”按钮
    await page.getByLabel(`action-Action.Link-Edit-workflows-${workFlowName}`).click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await page.getByLabel('action-Action-Submit-workflows').click();

    // 3、预期结果：编辑成功，列表中出现编辑后的工作流
    await expect(page.getByText(workFlowName)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('edit schedule event name', async ({ page }) => {
    //用例标题
    const caseTitle = 'edit schedule event name';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    let workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Schedule event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“编辑”按钮，编辑名称，点击“确定”按钮
    await page.getByLabel(`action-Action.Link-Edit-workflows-${workFlowName}`).click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await page.getByLabel('action-Action-Submit-workflows').click();

    // 3、预期结果：编辑成功，列表中出现编辑后的工作流
    await expect(page.getByText(workFlowName)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('edit collection event name', async ({ page }) => {
    //用例标题
    const caseTitle = 'edit collection event name';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    let workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Collection event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“编辑”按钮，编辑名称，点击“确定”按钮
    await page.getByLabel(`action-Action.Link-Edit-workflows-${workFlowName}`).click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await page.getByLabel('action-Action-Submit-workflows').click();

    // 3、预期结果：编辑成功，列表中出现编辑后的工作流
    await expect(page.getByText(workFlowName)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test.skip('edit approval name', async ({ page }) => {
    //用例标题
    const caseTitle = 'edit approval name';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    let workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Approval' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“编辑”按钮，编辑名称，点击“确定”按钮
    await page.getByLabel(`action-Action.Link-Edit-workflows-${workFlowName}`).click();
    const editWorkFlow = new EditWorkFlow(page, workFlowName);
    workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await page.getByLabel('action-Action-Submit-workflows').click();

    // 3、预期结果：编辑成功，列表中出现编辑后的工作流
    await expect(page.getByText(workFlowName)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByLabel('action-Filter.Action-Filter-filter-workflows').click();
    await page.getByRole('textbox').fill(workFlowName);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});

test.describe('copy workflow', () => {
  test('Copy form events that do not set any node information', async ({ page }) => {
    //用例标题
    const caseTitle = 'Copy form events that do not set any node information';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Form event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“复制”操作
    await page.getByLabel(`action-Action.Link-Duplicate-workflows-${workFlowName}`).click();
    await page.getByLabel(`action-Action-Submit-workflows-${workFlowName}`).click();

    // 3、预期结果：列表中出现筛选的工作流
    await expect(page.getByText(`${workFlowName} copy`)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}  copy`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(`${workFlowName} copy`)).toBeHidden();

    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('Copy schedule events that do not set any node information', async ({ page }) => {
    //用例标题
    const caseTitle = 'Copy schedule events that do not set any node information';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Schedule event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“复制”操作
    await page.getByLabel(`action-Action.Link-Duplicate-workflows-${workFlowName}`).click();
    await page.getByLabel(`action-Action-Submit-workflows-${workFlowName}`).click();

    // 3、预期结果：列表中出现筛选的工作流
    await expect(page.getByText(`${workFlowName} copy`)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}  copy`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(`${workFlowName} copy`)).toBeHidden();

    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });

  test('Copy collection events that do not set any node information', async ({ page }) => {
    //用例标题
    const caseTitle = 'Copy collection events that do not set any node information';

    // 1、前置条件：1.1、已登录,1.2、存在一个工作流
    await page.goto('/admin/settings/workflow');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('action-Action-Add new-workflows').click();
    const createWorkFlow = new CreateWorkFlow(page);
    const workFlowName = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createWorkFlow.name.fill(workFlowName);
    await createWorkFlow.triggerType.click();
    await page.getByRole('option', { name: 'Collection event' }).click();
    await page.getByLabel('action-Action-Submit-workflows').click();

    await expect(page.getByText(workFlowName)).toBeAttached();

    // 2、测试步骤：进入“工作流管理”-“复制”操作
    await page.getByLabel(`action-Action.Link-Duplicate-workflows-${workFlowName}`).click();
    await page.getByLabel(`action-Action-Submit-workflows-${workFlowName}`).click();

    // 3、预期结果：列表中出现筛选的工作流
    await expect(page.getByText(`${workFlowName} copy`)).toBeAttached();

    // 4、后置处理：删除工作流
    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}  copy`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(`${workFlowName} copy`)).toBeHidden();

    await page.getByLabel(`action-Action.Link-Delete-workflows-${workFlowName}`).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(workFlowName)).toBeHidden();
  });
});

test.describe('View Execution History', () => {});
