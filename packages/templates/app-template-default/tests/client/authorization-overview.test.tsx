import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AuthorizationOverview from '../../client/pages/capabilities/authorization-overview.js';
import locales from '../../client/locales/index.js';
import packageMetadata from '../../package.json' with { type: 'json' };

function mount() {
  const calls = vi.fn(() => ({ data: { serverPlugins: [] } }));
  return renderWithApp(<AuthorizationOverview />, {
    route: '/capabilities/app-plugin-authorization',
    namespace: '@nocobase/app-plugin-foundation',
    namespaces: { [packageMetadata.name]: locales },
    fetch: answerApi(calls),
  }).then((rendered) => ({ ...rendered, calls }));
}

it('explains the four roles together and marks its access example as illustrative without reading or changing permissions', async () => {
  const user = userEvent.setup();
  const { calls } = await mount();
  const table = screen.getByRole('table', {
    name: 'Example: viewing customers during a handover',
  });
  expect(
    screen.getByText(
      /Illustration only, not this application’s current permissions/,
    ),
  ).toBeInTheDocument();
  expect(
    within(table).getByRole('row', { name: /C · handover customer/ }),
  ).toHaveTextContent('Yes');
  expect(
    within(table).getByRole('row', { name: /D · confidential handover/ }),
  ).toHaveTextContent('No');
  expect(
    screen.getByText(
      /A default or sharing rule cannot create a missing operation permission/,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/multiple matching restrictions all apply/),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Plugins covered by this guide' }),
  );
  for (const name of [
    'authorization',
    'authz-default-access',
    'authz-sharing-rules',
    'authz-restriction-rules',
  ]) {
    expect(screen.getByText(`@nocobase/app-plugin-${name}`)).toBeVisible();
  }
  expect(calls).toHaveBeenCalledExactlyOnceWith({
    method: 'GET',
    path: 'foundation/registrations',
  });
});

it('preserves edited development requests across tabs, collapse and language changes and copies the displayed request', async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { app, calls } = await mount();
  const toggle = screen.getByRole('button', {
    name: 'How to set up business permissions',
  });
  await user.click(toggle);
  const prompt = screen.getByRole('textbox', { name: 'Editable request' });
  expect((prompt as HTMLTextAreaElement).value).toContain(
    'relevant default-access, sharing-rules and restriction-rules Skills',
  );
  await user.clear(prompt);
  await user.type(prompt, 'Sales can view their own customers');
  await user.click(screen.getByRole('tab', { name: 'Configuration steps' }));
  expect(
    screen.getByText(/Unrestricted administrators bypass these record rules/),
  ).toBeVisible();
  expect(
    screen.getByText(/Removing one source does not remove access/),
  ).toBeVisible();
  await user.click(screen.getByRole('tab', { name: 'Development request' }));
  await user.click(toggle);
  await user.click(toggle);
  expect(prompt).toHaveValue('Sales can view their own customers');
  await act(async () => {
    await app.runtime.i18n.changeLanguage('zh-CN');
  });
  expect(screen.getByRole('textbox', { name: '可编辑的需求' })).toHaveValue(
    'Sales can view their own customers',
  );
  await user.click(screen.getByRole('button', { name: '复制需求' }));
  expect(await screen.findByText('已复制')).toBeInTheDocument();
  expect(write).toHaveBeenCalledWith('Sales can view their own customers');
  expect(screen.getByText('四个插件如何分工')).toBeVisible();
  expect(calls).toHaveBeenCalledExactlyOnceWith({
    method: 'GET',
    path: 'foundation/registrations',
  });
});

it('allows manual copying when the clipboard is unavailable', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('Denied'),
  );
  await mount();
  await user.click(
    screen.getByRole('button', { name: 'How to set up business permissions' }),
  );
  await user.click(screen.getByRole('button', { name: 'Copy request' }));
  expect(await screen.findByText(/Copy failed/)).toBeInTheDocument();
  expect(
    screen.getByRole('textbox', { name: 'Editable request' }),
  ).toBeEnabled();
});

it('shows all four plugin integration states in This application', async () => {
  await mount();
  expect(
    screen.getByRole('heading', { name: 'This application' }),
  ).toBeVisible();
  expect(await screen.findAllByText('Not configured')).toHaveLength(4);
  expect(
    screen.getByText(
      /A configured plugin does not establish that users have been granted access/,
    ),
  ).toBeVisible();
});
