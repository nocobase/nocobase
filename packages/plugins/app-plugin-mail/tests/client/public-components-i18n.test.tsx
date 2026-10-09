import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider, NamespaceScope } from '@nocobase/i18n/client';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../client/runtime.js', () => {
  const mail = { listLabels: async () => [], listTemplates: async () => [] };
  return { useMailClient: () => mail };
});

import {
  MailLabelManager,
  MailTemplateManager,
} from '@nocobase/app-plugin-mail/client/components';
import locales from '../../client/locales/index.js';
import { MAIL_PLUGIN_NS } from '../../client/namespace.js';

describe('public Mail components outside the plugin namespace', () => {
  it.each(['en-US', 'zh-CN'] as const)(
    'uses Mail translations in %s',
    async (locale) => {
      const runtime = new I18nRuntime({
        defaultLocale: 'en-US',
        locales: ['en-US', 'zh-CN'],
        applicationNamespace: '@test/host',
      });
      runtime.registerNamespace(MAIL_PLUGIN_NS, locales);
      await runtime.init(locale);
      render(
        <I18nProvider runtime={runtime}>
          <NamespaceScope ns='@test/host'>
            <MailLabelManager />
            <MailTemplateManager />
          </NamespaceScope>
        </I18nProvider>,
      );
      const messages = (await locales[locale]()).default;
      expect(await screen.findByText(messages.labels.empty)).toBeVisible();
      expect(await screen.findByText(messages.templates.empty)).toBeVisible();
      expect(
        screen.getByRole('combobox', {
          name: messages.workspace.editor.fontSize,
        }),
      ).toBeVisible();
      expect(
        screen.getByRole('combobox', {
          name: messages.workspace.editor.heading,
        }),
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: messages.workspace.editor.link }),
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: messages.workspace.editor.image }),
      ).toBeVisible();
    },
  );
});
