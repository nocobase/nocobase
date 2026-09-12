/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { blockLinkageRules } from '../linkageRules';

function fakeResolveJsonTemplate(input: any): any {
  if (typeof input === 'string') {
    return input
      .replaceAll('{{ctx.user.id}}', '123')
      .replaceAll('{{ ctx.user.id }}', '123')
      .replaceAll('{{ctx.user.name}}', 'Alice')
      .replaceAll('{{ ctx.user.name }}', 'Alice');
  }
  if (Array.isArray(input)) return input.map((v) => fakeResolveJsonTemplate(v));
  if (input && typeof input === 'object') {
    const out: any = Array.isArray(input) ? [] : {};
    for (const [k, v] of Object.entries(input)) out[k] = fakeResolveJsonTemplate(v);
    return out;
  }
  return input;
}

describe('linkageRules: RunJS script templates resolved at execution time', () => {
  it('resolves non-script templates but preserves linkageRunjs script as raw', async () => {
    const linkageRunjsHandler = vi.fn();

    const ctx: any = {
      app: { jsonLogic: { apply: () => true } },
      model: { __allModels: [] },
      t: (s: string) => s,
      getAction: (name: string) => (name === 'linkageRunjs' ? { handler: linkageRunjsHandler } : undefined),
      resolveJsonTemplate: vi.fn(async (v: any) => fakeResolveJsonTemplate(v)),
    };

    await blockLinkageRules.handler(ctx, {
      value: [
        {
          key: 'r1',
          title: 'r1',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageRunjs',
              params: {
                other: 'hello {{ctx.user.name}}',
                value: { script: 'ctx.message.info("{{ctx.user.id}}/{{ctx.user.name}}")' },
              },
            },
          ],
        },
      ],
    });

    expect(ctx.resolveJsonTemplate).toHaveBeenCalledTimes(1);
    expect(linkageRunjsHandler).toHaveBeenCalledTimes(1);

    const passedParams = linkageRunjsHandler.mock.calls[0]?.[1];
    expect(passedParams.other).toBe('hello Alice');
    // Script must keep the original template markers; actual resolution happens in ctx.runjs at execution time.
    expect(passedParams.value.script).toContain('{{ctx.user.id}}');
    expect(passedParams.value.script).toContain('{{ctx.user.name}}');
  });
});
