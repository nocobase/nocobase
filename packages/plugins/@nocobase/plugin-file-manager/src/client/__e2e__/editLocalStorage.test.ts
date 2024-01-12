import { expect, test } from '@nocobase/test/e2e';
import { dayjs } from '@nocobase/utils';
import { CreateLocalStorage, EditLocalStorage } from './pageobject/localStorage';

test.describe('File manager', () => {
  test('edit local storage title', async ({ page }) => {
    //用例编号
    const caseNum = 'FM02AA';
    //用例标题
    let caseTitle = 'edit local storage title';

    // 1、前置条件：1.1已登录;1.2存在一个文件管理器
    await page.goto('/admin/settings/file-manager');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'plus Add new' }).hover();
    await page.getByRole('menuitem', { name: 'Local storage' }).click();

    const createLocalStorage = new CreateLocalStorage(page);
    await createLocalStorage.title.fill(caseTitle);
    const storageName = caseNum + dayjs().format('YYYYMMDDHHmmssSSS').toString();
    await createLocalStorage.storageName.fill(storageName);
    // await createLocalStorage.storagebaseURL.fill('/storage/uploadsFM02AA');
    // await createLocalStorage.destination.fill('storage/uploadsFM02AA');
    // // await createLocalStorage.path.fill('');
    // await createLocalStorage.defaultStorage.check();
    // await createLocalStorage.deleteRecordRetentionFile.check();
    await page.getByLabel('action-Action-Submit-storages').click();
    await expect(page.getByText(storageName)).toBeVisible();

    // 2、测试步骤：点击“文件管理器”-“编辑”按钮，编辑标题，点击“确定”按钮
    await page.getByText('Edit').nth(2).click();
    const editLocalStorage = new EditLocalStorage(page);
    caseTitle = caseTitle + dayjs().format('YYYYMMDDHHmmssSSS').toString();
    await editLocalStorage.title.fill(caseTitle);
    // await editLocalStorage.path.fill('');
    // await editLocalStorage.defaultStorage.check();
    // await editLocalStorage.deleteRecordRetentionFile.check();
    await page.getByLabel('action-Action-Submit-storages').click();
    // await page.waitForTimeout(5000);

    // 3、预期结果：编辑成功，列表中出现编辑后的文件管理器
    await expect(page.getByText(caseTitle)).toBeVisible();

    // 4、后置处理：删除文件管理器
    await page.getByLabel(`action-Action.Link-Delete-storages-${storageName}`).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(storageName)).toBeHidden();
  });
});
