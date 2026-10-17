import { noticeText } from '@nocobase/app-plugin-agents/client/chat';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';

import enUS from '../../client/extensions/nocobase-agent-chat/locales/en-US.js';
import zhCN from '../../client/extensions/nocobase-agent-chat/locales/zh-CN.js';

it.each([
  ['en-US', 'Cancellation requested.'],
  ['zh-CN', '已请求取消。'],
] as const)(
  'keeps an old cancellation notice distinct from terminal feedback in %s',
  async (locale, expected) => {
    const runtime = await createTestI18nRuntime({
      application: {
        namespace: 'chat-notice-test',
        resources: {
          'en-US': () => Promise.resolve({ default: enUS }),
          'zh-CN': () => Promise.resolve({ default: zhCN }),
        },
      },
      locale,
    });
    const t = runtime.getFixedT('chat-notice-test', locale);
    const text = noticeText(
      t,
      { code: 'runCancelled', runId: 'still-running' },
      'You stopped the agent.',
      () => 'Agent',
    );
    expect(text).toBe(expected);
    expect(text).not.toMatch(/stopped|已停止|已取消/i);
    expect(t('chat.feedback.cancelled')).toBe(
      locale === 'en-US'
        ? 'Cancelled. Any partial reply is saved in history.'
        : '已取消。已生成的回复保留在历史中。',
    );
  },
);
