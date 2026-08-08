/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getRunJSDocFor } from '..';
import { setupRunJSContexts } from '../runjs-context/setup';
import { FlowContext } from '../flowContext';

function getRunJSDocText(doc: unknown) {
  return typeof doc === 'string' ? doc : (doc as any)?.description ?? (doc as any)?.detail ?? '';
}

describe('RunJS locales patch (engine doc)', () => {
  beforeAll(async () => {
    await setupRunJSContexts();
  });

  it('should merge zh-CN locales for subclass doc label', () => {
    const ctx = new FlowContext();
    (ctx as any).defineProperty('model', { value: { constructor: { name: 'JSFieldModel' } } });
    (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
    const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
    expect(doc?.label || '').toMatch(/JS 字段|JS 字段 RunJS 上下文/);
  });

  it('should localize base properties/methods via locales', () => {
    const ctx = new FlowContext();
    (ctx as any).defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });
    (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
    const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
    expect(String(getRunJSDocText(doc?.properties?.message))).toMatch(/Ant Design 全局消息 API/);
    expect(String(getRunJSDocText(doc?.methods?.t))).toMatch(/国际化函数/);
  });

  it('keeps JS page English and Chinese facade docs aligned', () => {
    const englishContext = new FlowContext();
    englishContext.defineProperty('model', { value: { constructor: { name: 'JSPageModel' } } });
    const chineseContext = new FlowContext();
    chineseContext.defineProperty('model', { value: { constructor: { name: 'JSPageModel' } } });
    chineseContext.defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });

    const english = getRunJSDocFor(englishContext, { version: 'v2' });
    const chinese = getRunJSDocFor(chineseContext, { version: 'v2' });
    expect(Object.keys(chinese?.properties?.page?.properties || {})).toEqual(
      Object.keys(english?.properties?.page?.properties || {}),
    );
    expect(chinese?.label).toContain('JS 页面');
  });
});
