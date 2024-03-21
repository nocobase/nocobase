import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';
import { CreateLocalStorage } from './pageobject/localStorage';

test.describe('file manager', () => {
  test('add new local storage', async ({ page }) => {
    //用例编号
    const caseNum = 'FM01AA';
    //用例标题
    const caseTitle = 'add new local storage';

    // 1、前置条件：已登录

    // 2、测试步骤：进入“文件管理器”-“新建”按钮，填写表单，点击“确定”按钮
    await page.goto('/admin/settings/file-manager');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'plus Add new' }).hover();
    await page.getByRole('menuitem', { name: 'Local storage' }).click();
    const createLocalStorage = new CreateLocalStorage(page);
    await createLocalStorage.title.fill(caseTitle);
    const storageName = caseNum + dayjs().format('YYYYMMDDHHmmssSSS').toString();
    await createLocalStorage.storageName.fill(storageName);
    // await createLocalStorage.storagebaseURL.fill('/storage/uploadsFM01AA');
    // await createLocalStorage.destination.fill('storage/uploadsFM01AA');
    // await createLocalStorage.path.fill('');
    // await createLocalStorage.defaultStorage.check();
    // await createLocalStorage.deleteRecordRetentionFile.check();
    await page.getByLabel('action-Action-Submit-storages').click();

    // 3、预期结果：新建成功，列表中出现新建的文件管理器
    await expect(page.getByText(storageName)).toBeVisible();
    // await page.waitForTimeout(5000);

    // 4、后置处理：删除新建的文件管理器
    await page.getByLabel(`action-Action.Link-Delete-storages-${storageName}`).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(storageName)).toBeHidden();
  });
});
