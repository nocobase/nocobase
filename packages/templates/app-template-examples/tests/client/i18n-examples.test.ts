import { describe, expect, it } from 'vitest';

import {
  createFallbackDemo,
  formatRegion,
} from '../../client/pages/i18n-examples/demo';

describe('isolated fallback demonstration', () => {
  it('tries the application default before English and distinguishes default text from a key', async () => {
    // An extra requested language exercises all three lookup steps without adding an application locale.
    const rows = await createFallbackDemo('de-DE', 'zh-CN', 'Unavailable');
    expect(rows).toEqual([
      {
        id: 'translated',
        key: 'translated',
        text: '更改已保存。',
        source: 'zh-CN',
      },
      {
        id: 'englishOnly',
        key: 'englishOnly',
        text: 'This message is available in English only.',
        source: 'en-US',
      },
      {
        id: 'withDefault',
        key: 'missingMessage',
        text: 'Unavailable',
        source: 'defaultValue',
      },
      {
        id: 'withoutDefault',
        key: 'missingMessage',
        text: 'missingMessage',
        source: 'key',
      },
    ]);
  });

  it('uses the current language before the application default', async () => {
    const rows = await createFallbackDemo('en-US', 'zh-CN', 'Unavailable');
    expect(rows[0]).toMatchObject({
      text: 'Your changes are saved.',
      source: 'en-US',
    });
  });
});

describe('regional formats', () => {
  it('keeps the amount in USD and the time in UTC across regional conventions', () => {
    const en = formatRegion('en-US');
    const de = formatRegion('de-DE');
    expect(en.number).toBe('1,234,567.89');
    expect(en.currency).toBe('$1,234,567.89');
    expect(en.date).toContain('Sep 23, 2026');
    expect(en.date).toContain('2:05');
    expect(de.number).toBe('1.234.567,89');
    expect(de.currency).toMatch(/^1\.234\.567,89\s+\$$/u);
    expect(de.date).toContain('23.09.2026');
    expect(de.date).toContain('14:05');
  });
});
