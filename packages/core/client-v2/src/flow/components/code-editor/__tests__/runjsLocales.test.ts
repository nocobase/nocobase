/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { buildRunJSCompletions } from '../runjsCompletions';

describe('RunJS snippets locales (client completions)', () => {
  it('should load snippets with zh-CN labels when locale is zh-CN', async () => {
    const hostCtx = {
      model: { constructor: { name: 'JSBlockModel' } },
      api: { auth: { locale: 'zh-CN' } },
    } as any;
    const { entries } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    // expect at least one well-known snippet description (from doc) to be Chinese
    const hasDialog = entries.some((e) => /对话框/.test(e.description || ''));
    expect(hasDialog).toBe(true);
  });
});
