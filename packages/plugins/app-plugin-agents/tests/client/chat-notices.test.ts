import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';

import { noticeText } from '../../client/chat/message-model.js';
import locales from '../../client/locales/index.js';

it.each([
  ['en-US', 'Model unavailable'],
  ['zh-CN', '模型不可用'],
] as const)(
  'explains an unavailable fallback in %s',
  async (locale, reason) => {
    const namespace = '@nocobase/app-plugin-agents';
    const runtime = await createTestI18nRuntime({
      locale,
      namespaces: { [namespace]: locales },
    });
    const text = noticeText(
      runtime.getFixedT(namespace, locale),
      {
        code: 'onlineFallbackUnavailable',
        fromAgentId: 'lead',
        reason: 'modelUnavailable',
      },
      'English fallback',
      () => 'Review lead',
    );
    expect(text).toContain('Review lead');
    expect(text).toContain(reason);
    expect(text).not.toContain('English fallback');
  },
);
