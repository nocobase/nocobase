// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';
import { MessageItem } from '../../../client/panel/message-item.js';
import enUS from '../../../client/locales/en-US.js';
import zhCN from '../../../client/locales/zh-CN.js';

it.each(['en-US', 'zh-CN'] as const)(
  'renders safe file guidance and language changes in the registry UI (%s)',
  async (locale) => {
    const runtime = await createTestI18nRuntime({
      namespaces: {
        '@nocobase/app-plugin-agents': {
          'en-US': () => Promise.resolve({ default: enUS }),
          'zh-CN': () => Promise.resolve({ default: zhCN }),
        },
      },
      locale,
    });
    render(
      <TestI18nProvider runtime={runtime}>
        <MessageItem
          agentName={() => 'Agent'}
          message={{
            id: 'failure',
            role: 'assistant',
            parts: [
              {
                type: 'data-notice',
                id: 'execution-status',
                data: {
                  type: 'failed',
                  title: 'private-provider-response',
                  params: { fileInputReason: 'imageCapability' },
                },
              },
            ],
          }}
        />
      </TestI18nProvider>,
    );
    expect(
      screen.getByText(
        locale === 'zh-CN'
          ? zhCN.chat.fileInputFailures.imageCapability
          : enUS.chat.fileInputFailures.imageCapability,
      ),
    ).toBeVisible();
    expect(screen.queryByText('private-provider-response')).toBeNull();
    await act(async () =>
      runtime.changeLanguage(locale === 'zh-CN' ? 'en-US' : 'zh-CN'),
    );
    expect(
      screen.getByText(
        locale === 'zh-CN'
          ? enUS.chat.fileInputFailures.imageCapability
          : zhCN.chat.fileInputFailures.imageCapability,
      ),
    ).toBeVisible();
  },
);
