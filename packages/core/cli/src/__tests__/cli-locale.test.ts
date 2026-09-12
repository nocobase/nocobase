/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import { setCliConfigValue } from '../lib/cli-config.js';
import { detectCliLocale, resolveCliLocale } from '../lib/cli-locale.js';

async function withTempCliHome(run: () => Promise<void>) {
  const previousRoot = process.env.NB_CLI_ROOT;
  const previousNbLocale = process.env.NB_LOCALE;
  const previousLcAll = process.env.LC_ALL;
  const previousLcMessages = process.env.LC_MESSAGES;
  const previousLang = process.env.LANG;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-locale-'));

  process.env.NB_CLI_ROOT = tempHome;
  delete process.env.NB_LOCALE;
  delete process.env.LC_ALL;
  delete process.env.LC_MESSAGES;
  delete process.env.LANG;

  try {
    await run();
  } finally {
    if (previousRoot === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previousRoot;
    }

    if (previousNbLocale === undefined) {
      delete process.env.NB_LOCALE;
    } else {
      process.env.NB_LOCALE = previousNbLocale;
    }

    if (previousLcAll === undefined) {
      delete process.env.LC_ALL;
    } else {
      process.env.LC_ALL = previousLcAll;
    }

    if (previousLcMessages === undefined) {
      delete process.env.LC_MESSAGES;
    } else {
      process.env.LC_MESSAGES = previousLcMessages;
    }

    if (previousLang === undefined) {
      delete process.env.LANG;
    } else {
      process.env.LANG = previousLang;
    }

    await rm(tempHome, { recursive: true, force: true });
  }
}

test('detectCliLocale uses configured locale when environment overrides are absent', async () => {
  await withTempCliHome(async () => {
    await setCliConfigValue('locale', 'zh-CN', { scope: 'global' });

    expect(detectCliLocale()).toBe('zh-CN');
    expect(resolveCliLocale()).toBe('zh-CN');
  });
});

test('NB_LOCALE overrides the configured locale', async () => {
  await withTempCliHome(async () => {
    await setCliConfigValue('locale', 'zh-CN', { scope: 'global' });
    process.env.NB_LOCALE = 'en-US';

    expect(detectCliLocale()).toBe('en-US');
    expect(resolveCliLocale()).toBe('en-US');
  });
});
