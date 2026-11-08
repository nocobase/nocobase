import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, screen, within } from '@testing-library/react';
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

it('shows effective defaults and the union of interface/server languages without equating support with translation coverage', async () => {
  const calls: ApiCall[] = [];
  await mount((call) => {
    calls.push(call);
    return server;
  });
  expect(
    await screen.findByText('Languages — interface: 2 · server: 2'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Server default language').parentElement,
  ).toHaveTextContent('ja-JP');
  expect(
    screen.getByText('Interface default language').parentElement,
  ).toHaveTextContent('en-US');
  const chinese = screen.getByText('zh-CN').closest('li')!;
  expect(within(chinese).getByText('Available')).toBeInTheDocument();
  expect(within(chinese).getByText('Not declared')).toBeInTheDocument();
  const japaneseRow = screen.getByText('ja-JP').closest('li')!;
  expect(within(japaneseRow).getByText('Not declared')).toBeInTheDocument();
  expect(within(japaneseRow).getByText('Available')).toBeInTheDocument();
  expect(
    screen.getByText(/does not guarantee that every page/),
  ).toBeInTheDocument();
  expect(calls).toEqual([{ method: 'GET', path: 'i18n/locales' }]);
});

it('does not present an empty server language list during loading or failure and can retry', async () => {
  const user = userEvent.setup();
  let resolve!: (value: unknown) => void;
  const pending = new Promise((done) => {
    resolve = done;
  });
  let attempt = 0;
  await mount(() => (++attempt === 1 ? pending : server));
  expect(
    screen.getByText('Server default language').parentElement,
  ).toHaveTextContent('Checking');
  expect(screen.queryByText(/0 server languages/)).not.toBeInTheDocument();
  resolve(new Response(null, { status: 503 }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to read server languages',
  );
  expect(
    screen.getByText('Server default language').parentElement,
  ).toHaveTextContent('Unable to confirm');
  expect(screen.queryByText('Not declared')).not.toBeInTheDocument();
  expect(
    screen.queryByText(/server responses fall back/),
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Refresh server languages' }),
  );
  expect(
    await screen.findByText('Languages — interface: 2 · server: 2'),
  ).toBeInTheDocument();
});

it.each([401, 403])(
  'keeps interface facts visible when server access fails (%s)',
  async (status) => {
    await mount(() => new Response(null, { status }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      status === 401 ? 'session has expired' : 'do not have permission',
    );
    expect(screen.getByText('zh-CN')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Refresh server languages' }),
    ).not.toBeInTheDocument();
    if (status === 401)
      expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
        'href',
        '/login',
      );
  },
);

it('updates the current language and copy from the real runtime without confusing a preference with the default', async () => {
  const user = userEvent.setup();
  const rendered = await mount(() => ({
    data: { defaultLocale: 'en-US', locales: [english] },
  }));
  await screen.findByText('Languages — interface: 2 · server: 1');
  await user.click(screen.getByRole('button', { name: 'Add a language' }));
  const request = screen.getByRole('textbox', { name: 'Editable request' });
  await user.clear(request);
  await user.type(request, 'Keep this draft');
  await act(async () => {
    await rendered.app.runtime.i18n.changeLanguage('zh-CN');
  });
  expect(screen.getByText('你的界面语言').parentElement).toHaveTextContent(
    'zh-CN',
  );
  expect(screen.getByText('界面默认语言').parentElement).toHaveTextContent(
    'en-US',
  );
  expect(
    screen.getByText(/服务端未声明你当前使用的界面语言/),
  ).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: '可编辑的需求' })).toHaveValue(
    'Keep this draft',
  );
  expect(
    screen.getByRole('button', { name: '修改默认语言' }),
  ).toBeInTheDocument();
});

it('keeps editable requests through tabs and collapse and separates new languages from default configuration', async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  await mount(() => server);
  const add = screen.getByRole('button', { name: 'Add a language' });
  await user.click(add);
  const request = screen.getByRole('textbox', { name: 'Editable request' });
  expect((request as HTMLTextAreaElement).value).toContain(
    'Do not try to add supported languages through config.yml',
  );
  await user.clear(request);
  await user.type(request, 'Add French for customer support');
  await user.click(screen.getByRole('tab', { name: 'Manual steps' }));
  expect(
    screen.getByText(/Declare its loader in client\/locales\/index.ts/),
  ).toBeVisible();
  await user.click(screen.getByRole('tab', { name: 'Use Agent' }));
  await user.click(add);
  await user.click(add);
  expect(request).toHaveValue('Add French for customer support');
  await user.click(screen.getByRole('button', { name: 'Copy request' }));
  expect(await screen.findByText('Copied')).toBeInTheDocument();
  expect(write).toHaveBeenCalledWith('Add French for customer support');
  await user.click(add);
  await user.click(
    screen.getByRole('button', { name: 'Change the default language' }),
  );
  expect(
    (
      screen.getByRole('textbox', {
        name: 'Editable request',
      }) as HTMLTextAreaElement
    ).value,
  ).toContain('APP_DEFAULT_LOCALE');
  await user.click(screen.getByRole('tab', { name: 'Manual steps' }));
  expect(
    screen.getByText(/Changing the default does not overwrite/),
  ).toBeVisible();
  expect(
    screen.getByText(/defaultLocale: zh-CN/, { selector: 'code' }),
  ).toBeVisible();
  expect(screen.getByText(/not an export of this application/)).toBeVisible();
});

it('allows manual copying after a clipboard failure', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('Denied'),
  );
  await mount(() => server);
  await user.click(screen.getByRole('button', { name: 'Add a language' }));
  await user.click(screen.getByRole('button', { name: 'Copy request' }));
  expect(await screen.findByText(/Copy failed/)).toBeInTheDocument();
  expect(
    screen.getByRole('textbox', { name: 'Editable request' }),
  ).toBeEnabled();
});
