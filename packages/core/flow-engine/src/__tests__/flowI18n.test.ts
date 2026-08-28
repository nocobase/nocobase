/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowI18n } from '../flowI18n';

describe('FlowI18n', () => {
  it('translates plain keys and templates', () => {
    const i18n = new FlowI18n({ i18n: { t: (k: string, _o?: any) => (k === 'Hello' ? '你好' : k) } });
    expect(i18n.translate('Hello')).toBe('你好');
    expect(i18n.translate("{{ t('Hello') }}")).toBe('你好');
  });

  it('keeps embedded quotes of a different type inside the key', () => {
    // A single-quoted key whose text contains double quotes (and vice versa) must not be truncated at the first inner
    // quote.
    const key = 'Unlike "Post-action event", it listens for data changes.';
    const table: Record<string, string> = { [key]: '与“操作后事件”不同，它监听数据变动。' };
    const i18n = new FlowI18n({ i18n: { t: (k: string) => table[k] ?? k } });

    expect(i18n.translate(`{{t('${key}', { ns: "workflow" })}}`)).toBe(table[key]);
    expect(i18n.translate(`{{t("It's here", { ns: "workflow" })}}`)).toBe("It's here");
  });

  it('template compile ignores malformed options', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const i18n = new FlowI18n({ i18n: { t: (k: string) => k } });
    // malformed options will be treated as no options, key is translated directly
    const s = (i18n as any).translate("{{ t('X', oops) }}");
    expect(s).toBe('X');
    spy.mockRestore();
  });
});
