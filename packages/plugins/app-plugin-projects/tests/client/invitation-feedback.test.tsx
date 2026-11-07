import { renderWithApp } from '@nocobase/app-testing/client';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';

import projects from '../../client/plugin.js';
import { InviteResults } from '../../client/pages/config/members/invite-dialog.js';

afterEach(cleanup);

it.each([
  [
    'en-US',
    'Email not sent: no email channel configured',
    'Copy invitation link',
  ],
  ['zh-CN', '邮件未发送：未配置邮件渠道', '复制邀请链接'],
])(
  'translates delivery feedback in %s and copies the original manual link',
  async (locale, message, copyLabel) => {
    const user = userEvent.setup();
    const inviteUrl = 'https://example.test/invite/disposable-test-token';
    await renderWithApp(
      <InviteResults
        results={[
          {
            email: 'manual@example.test',
            outcome: 'invited',
            emailSent: false,
            emailError: 'Email not sent: no email channel configured',
            inviteUrl,
          },
        ]}
      />,
      {
        plugins: [projects({ routes: false })],
        namespace: '@nocobase/app-plugin-projects',
        locale,
      },
    );
    expect(screen.getByText(message)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: copyLabel }));
    expect(await navigator.clipboard.readText()).toBe(inviteUrl);
  },
);
