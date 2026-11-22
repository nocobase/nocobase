// @vitest-environment jsdom
import { noticeText } from '../../../client/chat.js';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';

import enUS from '../../../client/locales/en-US.js';
import zhCN from '../../../client/locales/zh-CN.js';

it.each([
  ['en-US', 'Cancellation requested.'],
  ['zh-CN', '已请求取消。'],
] as const)(
  'keeps an old cancellation notice distinct from terminal feedback in %s',
  async (locale, expected) => {
    const runtime = await createTestI18nRuntime({
      namespaces: {
        '@nocobase/app-plugin-agents': {
          'en-US': () => Promise.resolve({ default: enUS }),
          'zh-CN': () => Promise.resolve({ default: zhCN }),
        },
      },
      locale,
    });
    const t = runtime.getFixedT('@nocobase/app-plugin-agents', locale);
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
        ? 'Cancelled. Check possibly completed actions before repeating them.'
        : '已取消。再次执行前请核对可能已完成的操作。',
    );
  },
);
