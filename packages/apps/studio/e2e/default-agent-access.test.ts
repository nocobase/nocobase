import { expect, open, test, unique } from './support/fixtures.ts';

test('system defaults require everyone access and can be replaced or cleared', async ({
  page,
  api,
}) => {
  const previous = await api.get<{ defaultAgentId: string | null }>(
    'agents/chatSettings',
  );
  const restricted = await api.post<{ id: string; name: string }>('agents', {
    name: `Private assistant ${unique()}`,
    type: 'online',
    access: 'ownerOnly',
  });
  const shared = await api.post<{ id: string; name: string; revision: number }>(
    'agents',
    {
      name: `Shared assistant ${unique()}`,
      type: 'online',
      access: 'everyone',
    },
  );
  try {
    await expect(
      api.patch('agents/chatSettings', { defaultAgentId: restricted.id }),
    ).rejects.toThrow(/400.*defaultAgentId/);
    await open(page, '/agents');
    const picker = page.getByRole('button', { name: /^系统默认对话 Agent:/ });
    await picker.click();
    const blocked = page
      .getByRole('menuitem')
      .filter({ hasText: restricted.name });
    await expect(blocked).toHaveAttribute('aria-disabled', 'true');
    await expect(blocked).toContainText(
      '仅所有人可用的 Agent 可设为系统默认。',
    );
    await page.screenshot({
      path: 'output/default-agent-access.png',
      animations: 'disabled',
    });
    await page.getByRole('menuitem').filter({ hasText: shared.name }).click();
    await expect(picker).toContainText(shared.name);
    await expect
      .poll(
        async () =>
          (
            await api.get<{ defaultAgentId: string | null }>(
              'agents/chatSettings',
            )
          ).defaultAgentId,
      )
      .toBe(shared.id);
    await expect(
      api.patch(`agents/${shared.id}`, {
        expectedRevision: shared.revision,
        access: 'ownerOnly',
      }),
    ).rejects.toThrow(/400.*access/);
    await open(page, `/agents/${shared.id}`);
    await page.getByRole('radio', { name: '仅所有者', exact: true }).check();
    await page.getByRole('button', { name: '保存', exact: true }).click();
    // The toast also repeats this text in a separate live region.
    await expect(
      page
        .getByLabel('Notifications')
        .getByText('请先更换或清空系统默认 Agent，再修改其可用范围。', {
          exact: true,
        }),
    ).toBeVisible();
    await page.getByRole('radio', { name: '所有人', exact: true }).check();
    await open(page, '/agents');
    await picker.click();
    await page.getByRole('menuitem', { name: '不设置', exact: true }).click();
    await expect(picker).toContainText('不设置');
    await expect
      .poll(
        async () =>
          (
            await api.get<{ defaultAgentId: string | null }>(
              'agents/chatSettings',
            )
          ).defaultAgentId,
      )
      .toBeNull();
    await api.patch(`agents/${shared.id}`, {
      expectedRevision: shared.revision,
      access: 'ownerOnly',
    });
  } finally {
    await api.patch('agents/chatSettings', {
      defaultAgentId: previous.defaultAgentId,
    });
  }
});
