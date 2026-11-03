import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';

import { UserMenu } from '../../client/layouts/components/user-menu.js';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';

it('uses CJK name endings in the avatar while retaining the full account name and picture', async () => {
  const view = await renderAuthenticatedClient(<UserMenu />);
  const user = userEvent.setup();
  const trigger = screen.getByRole('button', { name: 'Open account menu' });
  await user.tab();
  for (const [name, expected] of [
    ['周建国', '建国'],
    ['欧阳娜娜', '娜娜'],
    ['李雷', '李雷'],
    ['周 建国', '建国'],
    ['Li Lei', 'LL'],
    ['周', '周'],
  ] as const) {
    await act(async () => {
      const response = await view.identity().client.updateUser({ name });
      expect(response.error).toBeNull();
      await view.identity().refresh();
    });
    expect(trigger).toHaveTextContent(expected);
    await user.keyboard('{Enter}');
    expect(
      within(screen.getByRole('menu')).getByText(name, { exact: true }),
    ).toBeVisible();
    await user.keyboard('{Escape}');
  }
  await act(async () => {
    const response = await view.identity().client.updateUser({ name: '' });
    expect(response.error).toBeNull();
    await view.identity().refresh();
  });
  expect(trigger).toHaveTextContent(view.session.user.email[0]!.toUpperCase());
  await act(async () => {
    const response = await view
      .identity()
      .client.updateUser({ image: 'https://example.test/avatar.png' });
    expect(response.error).toBeNull();
    await view.identity().refresh();
  });
  expect(trigger.querySelector('img')).toHaveAttribute(
    'src',
    'https://example.test/avatar.png',
  );
  expect(trigger).not.toHaveTextContent('周');
});
