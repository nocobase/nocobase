/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { compileLegacyTemplate, getFieldTitle } from '../components/utils';

describe('m2m array client-v2 utils', () => {
  it('compiles legacy translation title templates', () => {
    const t = vi.fn((key: string) => `t:${key}`);

    expect(compileLegacyTemplate('{{ t("Field title") }}', t)).toBe('t:Field title');
    expect(compileLegacyTemplate('{{t(\'Single quoted\', { ns: "client" })}}', t)).toBe('t:Single quoted');
    expect(compileLegacyTemplate('{{ somethingElse("Field title") }}', t)).toBe('{{ somethingElse("Field title") }}');
    expect(compileLegacyTemplate(123, t)).toBe(123);
  });

  it('resolves field titles from ui schema, title, or name', () => {
    const t = vi.fn((key: string) => `t:${key}`);

    expect(
      getFieldTitle(
        {
          name: 'json_array',
          title: 'Fallback title',
          uiSchema: {
            title: '{{ t("JSON array") }}',
          },
        },
        t,
      ),
    ).toBe('t:JSON array');
    expect(getFieldTitle({ name: 'field_name', title: 'Field title' }, t)).toBe('Field title');
    expect(getFieldTitle({ name: 'field_name' }, t)).toBe('field_name');
  });
});
