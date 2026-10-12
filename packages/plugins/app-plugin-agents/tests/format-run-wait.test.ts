import { I18nRuntime } from '@nocobase/i18n';
import { describe, expect, it } from 'vitest';

import {
  formatRunWait,
  runWaitBlocks,
  type RunWaitTranslate,
} from '../client/runs/format-wait.js';
import locales from '../client/locales/index.js';
import { ACCESS_NAMESPACE } from '../shared/access.js';
import { RUN_WAIT_REASONS } from '../shared/runs.js';

async function runtimeWith(
  app: Record<string, unknown> = {},
): Promise<{ runtime: I18nRuntime; t: RunWaitTranslate }> {
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': () => Promise.resolve({ default: app }),
    'zh-CN': () => Promise.resolve({ default: {} }),
  });
  runtime.registerNamespace(ACCESS_NAMESPACE, locales);
  await runtime.init('en-US');
  return { runtime, t: runtime.getFixedT('app') };
}

describe('formatRunWait', () => {
  it('words every reason with the values the server sends', async () => {
    const { t } = await runtimeWith();
    const words = (
      reason: string,
      params?: Readonly<Record<string, string | number | readonly string[]>>,
    ) => formatRunWait(t, { reason, ...(params ? { params } : {}) });
    expect(words('toolSlotsFull', { tool: 'claude', used: 2, limit: 2 })).toBe(
      'claude slots full (2/2)',
    );
    expect(
      words('secretsNotAllowed', { variables: ['NPM_TOKEN', 'KEY'] }),
    ).toBe('Needs a team runtime: NPM_TOKEN, KEY is for team runtimes only');
    expect(words('concurrencyFull', { active: 2, limit: 2 })).toBe(
      'Concurrency full (2/2)',
    );
    expect(words('toolUnavailable', { tool: 'codex' })).toBe(
      'No runtime has codex signed in',
    );
    expect(words('missingFeatures', { features: ['secrets', 'mounts'] })).toBe(
      'No runtime supports secrets, mounts',
    );
    expect(words('setupRetrying', { detail: 'No repo.' })).toBe(
      'Preparing it failed; retrying: No repo.',
    );
    expect(words('next')).toBe('Next for a free runtime');
    // Every reason the server knows has its own words.
    for (const reason of RUN_WAIT_REASONS)
      expect(words(reason)).not.toBe(`Queued (${reason})`);
  });

  it('names a reason it does not know, and marks a value the server did not send', async () => {
    const { t } = await runtimeWith();
    expect(formatRunWait(t, { reason: 'somethingNew' })).toBe(
      'Queued (somethingNew)',
    );
    expect(formatRunWait(t, { reason: 'toolSlotsFull' })).toBe(
      '— slots full (—/—)',
    );
  });

  it('reads the fields servers sent before params', async () => {
    const { t } = await runtimeWith();
    expect(
      formatRunWait(t, {
        reason: 'missingFeatures',
        missing: ['checkout'],
        tool: null,
        until: null,
        detail: null,
      }),
    ).toBe('No runtime supports checkout');
  });

  it('follows the language the page switches to', async () => {
    const { runtime, t } = await runtimeWith();
    const wait = { reason: 'secretsNotAllowed', params: { variables: ['K'] } };
    expect(formatRunWait(t, wait)).toBe(
      'Needs a team runtime: K is for team runtimes only',
    );
    await runtime.changeLanguage('zh-CN');
    expect(formatRunWait(t, wait)).toBe('需要团队运行环境：K 仅限团队运行环境');
    expect(formatRunWait(t, { reason: 'somethingNew' })).toBe(
      '排队中（somethingNew）',
    );
  });

  it('takes an application’s own words for a reason, and for one this version does not know', async () => {
    const { t } = await runtimeWith({
      overrides: {
        [ACCESS_NAMESPACE]: {
          runWait: {
            reasons: {
              secretsNotAllowed: 'Ask ops for a shared runner ({{variables}})',
              somethingNew: 'Something new',
            },
          },
        },
      },
    });
    expect(
      formatRunWait(t, {
        reason: 'secretsNotAllowed',
        params: { variables: ['K'] },
      }),
    ).toBe('Ask ops for a shared runner (K)');
    expect(formatRunWait(t, { reason: 'somethingNew' })).toBe('Something new');
    expect(formatRunWait(t, { reason: 'next' })).toBe(
      'Next for a free runtime',
    );
  });

  it('says which waits need someone to act', () => {
    expect(runWaitBlocks({ reason: 'secretsNotAllowed' })).toBe(true);
    expect(runWaitBlocks({ reason: 'concurrencyFull' })).toBe(false);
    expect(runWaitBlocks({ reason: 'somethingNew' })).toBe(false);
  });
});
