/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { ServerBaseContext } from '../contexts';
import { resolveJsonTemplate } from '../resolver';

describe('server template resolver: dashed keys in dot-only path', () => {
  it('resolves dashed keys in dot-only expressions', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('formValues', {
      value: {
        roles: {
          'a-b': 123,
        },
      },
    });

    const out = await resolveJsonTemplate('{{ ctx.formValues.roles.a-b }}', ctx as any);
    expect(out).toBe(123);
  });

  it('resolves dashed keys inside template strings', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('formValues', {
      value: {
        roles: {
          'a-b': 'X',
        },
      },
    });

    const out = await resolveJsonTemplate('prefix {{ ctx.formValues.roles.a-b }} suffix', ctx as any);
    expect(out).toBe('prefix X suffix');
  });

  it('keeps subtraction working (fallback to JS evaluation)', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('aa', { value: { bb: 10 } });
    ctx.defineProperty('cc', { value: 5 });

    const out = await resolveJsonTemplate('{{ ctx.aa.bb-ctx.cc }}', ctx as any);
    expect(out).toBe(5);
  });
});
