import { describe, expect, it } from 'vitest';

import locales from '../client/locales/index.js';

describe('in-app notification Client locales', () => {
  it('provides matching English and Chinese inbox messages', async () => {
    const [enUS, zhCN] = await Promise.all([
      locales['en-US']?.(),
      locales['zh-CN']?.(),
    ]);

    expect(enUS?.default.inbox.unavailable).toBe('Inbox unavailable');
    expect(Object.keys(zhCN?.default.inbox ?? {})).toEqual(
      Object.keys(enUS?.default.inbox ?? {}),
    );
  });
});
