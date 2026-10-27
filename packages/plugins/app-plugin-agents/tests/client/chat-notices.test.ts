import { fileInputFailureTitles } from '../../shared/file-input-failures.js';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';

import { noticeText } from '../../client/chat/message-model.js';
import locales from '../../client/locales/index.js';
import type { ConsultationNotice } from '../../shared/conversations.js';

it.each(['en-US', 'zh-CN'] as const)(
  'marks an unresolved consultation as the original request in %s',
  async (locale) => {
    const namespace = '@nocobase/app-plugin-agents';
    const runtime = await createTestI18nRuntime({
      locale,
      namespaces: { [namespace]: locales },
    });
    const notice: ConsultationNotice = {
      code: 'consultation',
      callId: 'old',
      agentId: null,
      agentName: 'Original request',
      runId: null,
      question: 'Question',
      state: 'refused',
      answer: '',
      error: null,
      usage: null,
      plans: 0,
      identitySnapshot: true,
    };
    expect(
      noticeText(
        runtime.getFixedT(namespace, locale),
        notice,
        'Old body',
        () => 'Other',
      ),
    ).toBe(
      locale === 'en-US'
        ? 'Requested Original request at the time'
        : '当时请求的对象：Original request',
    );
  },
);

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
      () => 'Coding agent',
    );
    expect(text).toContain('Coding agent');
    expect(text).toContain(reason);
    expect(text).not.toContain('English fallback');
  },
);

it.each([
  ['en-US', 'Cancellation requested.'],
  ['zh-CN', '已请求取消。'],
] as const)(
  'renders historical runCancelled as a request, never confirmation, in %s',
  async (locale, expected) => {
    const namespace = '@nocobase/app-plugin-agents';
    const runtime = await createTestI18nRuntime({
      locale,
      namespaces: { [namespace]: locales },
    });
    const text = noticeText(
      runtime.getFixedT(namespace, locale),
      { code: 'runCancelled', runId: 'still-running' },
      'You stopped the agent.',
      () => 'Agent',
    );
    expect(text).toBe(expected);
    expect(text).not.toMatch(/stopped|已停止|已取消/i);
  },
);

it.each(['en-US', 'zh-CN'] as const)(
  'localizes every file failure and safely handles historical/unknown notices in %s',
  async (locale) => {
    const namespace = '@nocobase/app-plugin-agents';
    const runtime = await createTestI18nRuntime({
      locale,
      namespaces: { [namespace]: locales },
    });
    const t = runtime.getFixedT(namespace, locale);
    for (const [reason, title] of Object.entries(fileInputFailureTitles)) {
      const actual = noticeText(
        t,
        {
          code: 'news',
          type: 'failed',
          title,
          params: { fileInputReason: reason },
        },
        '',
        () => '',
      );
      expect(actual).toBe(t(`chat.fileInputFailures.${reason}`));
      expect(actual).not.toContain('chat.fileInputFailures.');
      if (locale === 'en-US') expect(actual).toBe(title);
      if (locale === 'zh-CN') expect(actual).not.toBe(title);
    }
    for (const reason of ['constructor', '__proto__', 'private-provider-key']) {
      expect(
        noticeText(
          t,
          {
            code: 'news',
            type: 'failed',
            title: 'private-provider-key',
            params: { fileInputReason: reason },
          },
          '',
          () => '',
        ),
      ).toBe(t('chat.fileInputFailures.preparationFailed'));
    }
    expect(
      noticeText(
        t,
        { code: 'news', type: 'failed', title: 'Interrupted' },
        '',
        () => '',
      ),
    ).toBe(t('chat.executionFailed'));
    expect(
      noticeText(
        t,
        { code: 'news', type: 'other', title: 'Custom public notice' },
        '',
        () => '',
      ),
    ).toBe('Custom public notice');
    expect(
      noticeText(
        t,
        {
          code: 'news',
          type: 'failed',
          title: 'Interrupted',
          params: { fileInputReason: 'imageCapability' },
        },
        '',
        () => '',
        () => 'Application wording',
      ),
    ).toBe('Application wording');
  },
);
