import { useState, type ReactElement } from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { describe, expect, it } from 'vitest';
import { NotificationTemplates } from '../client/components/templates.js';
import {
  languageName,
  pickPreviewLocale,
} from '../client/template-language.js';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';
import type { NotificationTemplateView } from '../shared/templates.js';

const example = (key: string, defaultValue: string) => ({
  ns: '@nocobase/example',
  key,
  defaultValue,
});

const item: NotificationTemplateView = {
  id: 'task.assigned',
  name: example('assigned', 'Task assigned'),
  category: example('category', 'Tasks'),
  contributor: '@nocobase/example',
  contributorLabel: example('contributor', 'Examples'),
  trigger: 'Task created',
  recipients: 'Assignee',
  businessRule: 'On business action',
  locales: ['en-US', 'zh-CN', 'ja-JP'],
  localeMode: 'separate',
  languagePolicy: 'One language per message',
  variables: [{ name: 'title', description: 'Task title' }],
  channels: [
    {
      name: 'inbox',
      type: 'in-app',
      label: example('inbox', 'Task inbox'),
      typeLabel: {
        ns: '@nocobase/app-plugin-notification',
        key: 'templates.channelTypes.inApp',
        defaultValue: 'In-app message',
      },
      configured: true,
      enabled: false,
    },
  ],
};
const invitation: NotificationTemplateView = {
  ...item,
  id: 'users.invitation',
  name: 'User invitation',
  category: 'Accounts',
  trigger: 'Invitation sent',
  locales: ['en-US', 'zh-CN'],
  localeMode: 'combined',
  languagePolicy: 'All languages in the body',
  channels: [
    { name: 'mailer', type: 'email', configured: false, enabled: null },
  ],
};
const templates = [item, invitation];

function Page({ initial = null }: { initial?: string | null }): ReactElement {
  const [id, setId] = useState<string | null>(initial);
  return <NotificationTemplates selectedId={id} onSelect={setId} />;
}

async function renderPage({
  list = { data: templates } as unknown,
  locale,
  initial,
}: { list?: unknown; locale?: string; initial?: string } = {}) {
  const calls: string[] = [];
  await renderWithApp(<Page initial={initial ?? null} />, {
    namespace: '@nocobase/app-plugin-notification',
    ...(locale ? { locale } : {}),
    namespaces: {
      '@nocobase/app-plugin-notification': {
        'en-US': () => Promise.resolve(enUS),
        'zh-CN': () => Promise.resolve(zhCN),
      },
      '@nocobase/example': {
        'en-US': async () => ({
          assigned: 'Task assigned',
          category: 'Tasks',
          contributor: 'Examples',
          inbox: 'Task inbox',
        }),
        'zh-CN': async () => ({
          assigned: '任务已分配',
          category: '任务',
          contributor: '示例',
          inbox: '任务收件箱',
        }),
      },
    },
    fetch: answerApi(({ path, method, json }) => {
      calls.push(
        method === 'POST'
          ? `${method} ${path} ${(json as { locale: string }).locale}`
          : `${method} ${path}`,
      );
      if (path === 'notifications/templates') return list;
      for (const template of templates) {
        if (path === `notifications/templates/${template.id}`)
          return { data: template };
        if (path === `notifications/templates/${template.id}/preview`)
          return {
            data: {
              synthetic: true,
              requestedLocale: 'en-US',
              effectiveLocale: 'en-US',
              definition: { title: '{{title}}', body: 'Template' },
              content: {
                title: 'Sample task',
                body: 'Synthetic example',
                html: '<img src="https://example.invalid/track"><script>alert(1)</script>',
              },
            },
          };
      }
      return new Response(null, { status: 404 });
    }),
  });
  return calls;
}

describe('notification template directory', () => {
  it('groups clickable cards by category and opens details in a drawer with inert HTML', async () => {
    const calls = await renderPage();
    const group = await screen.findByRole('region', { name: 'Tasks' });
    expect(screen.getByRole('region', { name: 'Accounts' })).toBeVisible();
    const card = within(group).getByRole('button', { name: /Task assigned/u });
    expect(card).toHaveTextContent('In-app message');
    expect(card).not.toHaveTextContent('in-app');
    fireEvent.click(card);
    const drawer = await screen.findByRole('dialog');
    expect(
      await within(drawer).findByRole('group', { name: 'Preview' }),
    ).toHaveTextContent('Sample task');
    expect(drawer).toHaveTextContent('Provided by Examples');
    expect(within(drawer).getByText('Task inbox')).toBeVisible();
    expect(within(drawer).getByText('Off')).toBeVisible();
    // The template id and package stay in the collapsed technical details.
    expect(within(drawer).getByText('task.assigned')).not.toBeVisible();
    expect(
      within(drawer).getAllByLabelText('HTML version (shown as code)')[0],
    ).toHaveTextContent('<script>alert(1)</script>');
    expect(drawer.querySelector('img, iframe, script')).toBeNull();
    expect(calls).toEqual([
      'GET notifications/templates',
      'GET notifications/templates/task.assigned',
      'POST notifications/templates/task.assigned/preview en-US',
    ]);
    fireEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('searches translated text', async () => {
    await renderPage();
    const search = await screen.findByLabelText('Search templates');
    fireEvent.change(search, { target: { value: 'missing' } });
    expect(screen.getByText('No templates match these filters.')).toBeVisible();
    fireEvent.change(search, { target: { value: 'invitation' } });
    expect(screen.queryByRole('region', { name: 'Tasks' })).toBeNull();
    expect(
      screen.getByRole('button', { name: /User invitation/u }),
    ).toBeVisible();
  });

  it('shows translated names and previews in the interface language', async () => {
    const calls = await renderPage({
      locale: 'zh-CN',
      initial: 'task.assigned',
    });
    const drawer = await screen.findByRole('dialog');
    expect(
      await within(drawer).findByRole('heading', { name: '任务已分配' }),
    ).toBeVisible();
    expect(
      await within(drawer).findByRole('combobox', { name: /语言/u }),
    ).toHaveTextContent(languageName('zh-CN', 'zh-CN'));
    expect(calls).toContain(
      'POST notifications/templates/task.assigned/preview zh-CN',
    );
    expect(
      screen.getByRole('region', { name: '任务', hidden: true }),
    ).toBeInTheDocument();
  });

  it('hides the language choice for a message that combines every language', async () => {
    await renderPage({ initial: 'users.invitation' });
    const drawer = await screen.findByRole('dialog');
    expect(
      await within(drawer).findByText(
        /Every recipient receives the same content/u,
      ),
    ).toHaveTextContent(
      `${languageName('en-US', 'en-US')}, ${languageName('zh-CN', 'en-US')}`,
    );
    await within(drawer).findByRole('group', { name: 'Preview' });
    expect(within(drawer).queryByRole('combobox')).toBeNull();
    expect(within(drawer).getByText('Not set up')).toBeVisible();
  });

  it('distinguishes an empty registry from denied access and a retryable failure', async () => {
    await renderPage({ list: { data: [] } });
    expect(
      await screen.findByText('There are no notification templates yet.'),
    ).toBeVisible();
  });

  it('does not offer retry on a permission denial', async () => {
    await renderPage({
      list: new Response(
        JSON.stringify({
          error: {
            reason: 'NOTIFICATION_TEMPLATES_FORBIDDEN',
            message: 'Forbidden',
          },
        }),
        { status: 403, headers: { 'content-type': 'application/json' } },
      ),
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You do not have permission',
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('offers retry after a server error', async () => {
    await renderPage({ list: new Response(null, { status: 500 }) });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible(),
    );
  });
});

describe('preview language', () => {
  it('prefers the interface language, then its base language, then the first locale', () => {
    expect(pickPreviewLocale(['en-US', 'zh-CN'], 'zh-CN')).toBe('zh-CN');
    expect(pickPreviewLocale(['en-US', 'zh-TW'], 'zh-CN')).toBe('zh-TW');
    expect(pickPreviewLocale(['en-US', 'de-DE'], 'ja-JP')).toBe('en-US');
  });

  it('names languages in the interface language', () => {
    expect(languageName('zh-CN', 'en-US')).toBe('Chinese (China)');
    expect(languageName('ja-JP', 'zh-CN')).toBe(
      new Intl.DisplayNames(['zh-CN'], { type: 'language' }).of('ja-JP'),
    );
  });
});
