import { expect, test } from '@nocobase/test/client';
import { CreateLocalStorage, EditLocalStorage } from './pageobject/localStorage';
import { dayjs } from '@nocobase/utils';

test.describe('File manager', () => {
  test('edit local storage title', async ({ page }) => {
    //用例编号
    const caseNum = 'FM02AA';
    //用例标题
    let caseTitle = 'edit local storage title';

    // 1、前置条件：1.1已登录;1.2存在一个文件管理器
    await page.goto('/admin/settings/file-manager/storages');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('create-action').click();

    const createLocalStorage = new CreateLocalStorage(page);
    await createLocalStorage.title.fill(caseTitle);
    const storageName = caseNum + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await createLocalStorage.storageName.fill(storageName);
    await createLocalStorage.storagebaseURL.fill('/storage/uploadsFM02AA');
    await createLocalStorage.storageType.click();
    await page.getByText('Local storage').nth(1).click();
    await createLocalStorage.destination.fill('storage/uploadsFM02AA');
    // await createLocalStorage.path.fill('');
    // await createLocalStorage.defaultStorage.check();
    // await createLocalStorage.deleteRecordRetentionFile.check();
    await page.getByTestId('submit-action').click();
    await expect(page.getByText(storageName)).toBeAttached();

    // 2、测试步骤：点击“文件管理器”-“编辑”按钮，编辑标题，点击“确定”按钮
    await page
      .getByRole('row', { name: '2 ' + caseTitle + ' ' + storageName + ' Edit Delete' })
      .getByTestId('update-action')
      .click();
    const editLocalStorage = new EditLocalStorage(page);
    caseTitle = caseTitle + dayjs().format('YYYYMMDDHHmmss.SSS').toString();
    await editLocalStorage.title.fill(caseTitle);
    // await editLocalStorage.path.fill('');
    // await editLocalStorage.defaultStorage.check();
    // await editLocalStorage.deleteRecordRetentionFile.check();
    await page.getByTestId('submit-action').click();
    // await page.waitForTimeout(5000);

    // 3、预期结果：编辑成功，列表中出现编辑后的文件管理器
    await expect(page.getByText(caseTitle)).toBeAttached();

    // 4、后置处理：删除文件管理器
    await page
      .getByRole('row', { name: '2 ' + caseTitle + ' ' + storageName + ' Edit Delete' })
      .getByTestId('delete-action')
      .click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText(storageName)).toBeHidden();
  });
});
