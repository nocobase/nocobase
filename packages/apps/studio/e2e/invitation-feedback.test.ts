import { expect, open, test, unique } from './support/fixtures.ts';

test('invitation creation and resend explain missing email configuration and keep a copyable link', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const email = `invitation-${unique()}@example.test`;
  await open(page, '/config/members');
  await page.getByRole('button', { name: '邀请成员', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('邮箱', { exact: true }).fill(email);
  await dialog.getByRole('button', { name: '发送邀请', exact: true }).click();
  await expect(
    dialog
      .getByRole('list')
      .getByText('邮件未发送：未配置邮件渠道', { exact: true }),
  ).toBeVisible();
  const original = await dialog
    .getByLabel('邀请链接', { exact: true })
    .inputValue();
  await dialog
    .getByRole('button', { name: '复制邀请链接', exact: true })
    .click();
  expect(await page.evaluate<string>('navigator.clipboard.readText()')).toBe(
    original,
  );
  await dialog.getByRole('button', { name: '完成', exact: true }).click();
  await page
    .getByRole('button', { name: `发给 ${email} 的邀请的操作`, exact: true })
    .click();
  await page.getByRole('menuitem', { name: '重新发送', exact: true }).click();
  await expect(
    dialog
      .getByRole('list')
      .getByText('邮件未发送：未配置邮件渠道', { exact: true }),
  ).toBeVisible();
  const renewed = await dialog
    .getByLabel('邀请链接', { exact: true })
    .inputValue();
  expect(renewed).not.toBe(original);
  await dialog
    .getByRole('button', { name: '复制邀请链接', exact: true })
    .click();
  expect(await page.evaluate<string>('navigator.clipboard.readText()')).toBe(
    renewed,
  );
});
