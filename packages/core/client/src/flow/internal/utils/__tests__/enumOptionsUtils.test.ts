/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { enumToOptions, translateOptions } from '../enumOptionsUtils';

// 一个极简的 t：
// - 直接返回传入 key；
// - 支持形如 {{t('Yes')}} 的模板，提取 'Yes' 并给出模拟翻译。
function mockT(input: string) {
  const tpl = /\{\{\s*t\s*\(\s*['"](.+?)['"][^)]*\)\s*\}\}/;
  const m = input?.match?.(tpl);
  const key = m ? m[1] : input;
  if (key === 'Yes') return '是';
  if (key === 'No') return '否';
  if (key === 'Draft') return '草稿';
  return key;
}

describe('enumOptions utils', () => {
  it('enumToOptions: converts primitive enum and translates labels', () => {
    const uiEnum = ['{{t("Yes")}}', '{{t("No")}}'];
    const options = enumToOptions(uiEnum as any, mockT)!;
    expect(options).toHaveLength(2);
    expect(options[0]).toEqual({ label: '是', value: '{{t("Yes")}}' });
    expect(options[1]).toEqual({ label: '否', value: '{{t("No")}}' });
  });

  it('enumToOptions: keeps object value and translates object label', () => {
    const uiEnum = [
      { label: '{{t("Yes")}}', value: true },
      { label: '{{t("No")}}', value: false },
    ];
    const options = enumToOptions(uiEnum as any, mockT)!;
    expect(options).toEqual([
      { label: '是', value: true },
      { label: '否', value: false },
    ]);
  });

  it('translateOptions: maps given options labels through t()', () => {
    const options = [
      { label: '{{t("Draft")}}', value: 'draft' },
      { label: 'No', value: false },
    ];
    const out = translateOptions(options as any, mockT);
    expect(out).toEqual([
      { label: '草稿', value: 'draft' },
      { label: '否', value: false },
    ]);
  });
});
