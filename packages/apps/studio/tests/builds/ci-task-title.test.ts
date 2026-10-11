import { I18nRuntime } from '@nocobase/i18n';
import { describe, expect, it } from 'vitest';

import { localizedCiTaskTitle } from '../../server/builds/ci-task-title.js';
import locales from '../../server/locales/index.js';

async function runtime(): Promise<I18nRuntime> {
  const i18n = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: 'studio',
  });
  i18n.registerApplicationNamespace('studio', locales);
  // Started the way the application starts it.
  await i18n.init('en-US');
  return i18n;
}

describe("the CI issue's title", () => {
  it("is worded in the installation's language", async () => {
    await expect(
      localizedCiTaskTitle(await runtime(), 'zh-CN', 'acme/shop'),
    ).resolves.toBe('接入部署：acme/shop');
    await expect(
      localizedCiTaskTitle(await runtime(), 'en-US', 'acme/shop'),
    ).resolves.toBe('Set up deployment: acme/shop');
  });

  it('falls back to English without the i18n runtime', async () => {
    await expect(
      localizedCiTaskTitle(undefined, 'zh-CN', 'acme/shop'),
    ).resolves.toBe('Set up deployment: acme/shop');
  });
});
