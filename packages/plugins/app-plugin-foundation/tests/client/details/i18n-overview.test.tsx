import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import I18nOverview from '../../../client/capability-guide/details/i18n-overview.js';
import locales from '../../../client/locales/index.js';
import packageMetadata from '../../../package.json' with { type: 'json' };

const english = { locale: 'en-US', label: 'English', direction: 'ltr' };
const japanese = { locale: 'ja-JP', label: '日本語', direction: 'ltr' };
const server = {
  data: { defaultLocale: 'ja-JP', locales: [english, japanese] },
};
function mount(answer: (call: ApiCall) => unknown) {
  return renderWithApp(<I18nOverview />, {
    route: '/capabilities/app-plugin-i18n',
    namespace: '@nocobase/app-plugin-foundation',
    namespaces: { [packageMetadata.name]: locales },
    fetch: answerApi(answer),
  });
}

it('shows application languages and message languages separately without inferring missing configuration', async () => {
  const calls = vi.fn(() => server);
  await mount(calls);
  expect(await screen.findByText('English、日本語')).toBeVisible();
  expect(
    screen.getByRole('group', { name: 'Available languages' }),
  ).toHaveTextContent('Configured');
  expect(
    screen.getByRole('group', { name: 'Default language' }),
  ).toHaveTextContent('English');
  expect(calls).toHaveBeenCalledWith({ method: 'GET', path: 'i18n/locales' });
});
it.each([401, 403, 503])(
  'keeps unavailable message configuration unknown (%s) and allows retry',
  async (status) => {
    const user = userEvent.setup();
    let attempt = 0;
    await mount(() =>
      ++attempt === 1 ? new Response(null, { status }) : server,
    );
    expect(await screen.findByRole('alert')).toBeVisible();
    const group = screen.getByRole('group', {
      name: 'Message and notification languages',
    });
    expect(group).not.toHaveTextContent('Not configured');
    expect(
      screen.getByRole('group', { name: 'Available languages' }),
    ).toHaveTextContent('Configured');
    await user.click(
      screen.getByRole('button', { name: 'Refresh configuration status' }),
    );
    expect(await screen.findByText('English、日本語')).toBeVisible();
  },
);
it('preserves an edited request across language changes and copies it', async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { app } = await mount(() => server);
  await user.click(screen.getByRole('button', { name: 'Add a language' }));
  const input = screen.getByRole('textbox', { name: 'Editable request' });
  await user.clear(input);
  await user.type(input, 'Add French for support');
  await user.click(screen.getByRole('tab', { name: 'Configuration steps' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
  await user.click(screen.getByRole('tab', { name: 'Development request' }));
  await act(async () => {
    await app.runtime.i18n.changeLanguage('zh-CN');
  });
  expect(screen.getByRole('textbox', { name: '可编辑的需求' })).toHaveValue(
    'Add French for support',
  );
  await user.click(screen.getByRole('button', { name: '复制需求' }));
  expect(write).toHaveBeenCalledWith('Add French for support');
});
