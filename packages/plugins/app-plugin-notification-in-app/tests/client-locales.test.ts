import { describe, expect, it } from 'vitest';

import locales from '../client/locales/index.js';

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child
      ? keysOf(child as object, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('in-app notification Client locales', () => {
  it('provides matching English and Chinese inbox messages', async () => {
    const [enUS, zhCN] = await Promise.all([
      locales['en-US']?.(),
      locales['zh-CN']?.(),
    ]);

    expect(enUS?.default.inbox.title).toBe('Inbox');
    expect(zhCN?.default.inbox.title).toBe('站内信');
    expect(keysOf(zhCN?.default ?? {}).sort()).toEqual(
      keysOf(enUS?.default ?? {}).sort(),
    );
  });

  it('translates only keys English has in the partial locales', async () => {
    const english = new Set(keysOf((await locales['en-US']!()).default));
    for (const [locale, load] of Object.entries(locales)) {
      if (locale === 'en-US' || !load) continue;
      for (const key of keysOf((await load()).default))
        expect(english, `${locale}: ${key}`).toContain(key);
    }
  });
});
