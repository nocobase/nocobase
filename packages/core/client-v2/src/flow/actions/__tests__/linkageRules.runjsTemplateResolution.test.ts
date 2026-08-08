/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext } from '@nocobase/flow-engine';
import { describe, it, expect, vi } from 'vitest';
import { blockLinkageRules } from '../linkageRules';

function fakeResolveJsonTemplate(input: unknown): unknown {
  if (typeof input === 'string') {
    return input
      .replaceAll('{{ctx.user.id}}', '123')
      .replaceAll('{{ ctx.user.id }}', '123')
      .replaceAll('{{ctx.user.name}}', 'Alice')
      .replaceAll('{{ ctx.user.name }}', 'Alice');
  }
  if (Array.isArray(input)) return input.map((v) => fakeResolveJsonTemplate(v));
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) out[k] = fakeResolveJsonTemplate(v);
    return out;
  }
  return input;
}

function createTestContext(linkageRunjsHandler: (...args: unknown[]) => unknown) {
  const ctx = new FlowContext();
  const resolveJsonTemplate = vi.fn(async (value: unknown) => fakeResolveJsonTemplate(value));
  ctx.defineProperty('app', { value: { jsonLogic: { apply: () => true } } });
  ctx.defineProperty('model', { value: { __allModels: [] } });
  ctx.defineProperty('t', { value: (text: string) => text });
  ctx.defineMethod('getAction', (name: string) =>
    name === 'linkageRunjs' ? { handler: linkageRunjsHandler } : undefined,
  );
  ctx.defineMethod('resolveJsonTemplate', resolveJsonTemplate);
  return { ctx, resolveJsonTemplate };
}

describe('linkageRules: RunJS script templates resolved at execution time', () => {
  it('resolves non-script templates but preserves linkageRunjs script as raw', async () => {
    const linkageRunjsHandler = vi.fn();
    const { ctx, resolveJsonTemplate } = createTestContext(linkageRunjsHandler);

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

    expect(resolveJsonTemplate).toHaveBeenCalledTimes(1);
    expect(linkageRunjsHandler).toHaveBeenCalledTimes(1);

    const passedParams = linkageRunjsHandler.mock.calls[0]?.[1];
    expect(passedParams.other).toBe('hello Alice');
    // Script must keep the original template markers; actual resolution happens in ctx.runjs at execution time.
    expect(passedParams.value.script).toContain('{{ctx.user.id}}');
    expect(passedParams.value.script).toContain('{{ctx.user.name}}');
  });

  it('preserves RunJSValue code while resolving its settings', async () => {
    const linkageRunjsHandler = vi.fn();
    const { ctx } = createTestContext(linkageRunjsHandler);

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
                value: {
                  code: 'return "{{ctx.user.id}}/{{ctx.user.name}}";',
                  version: 'v2',
                  settings: { greeting: 'hello {{ctx.user.name}}' },
                },
              },
            },
          ],
        },
      ],
    });

    const passedParams = linkageRunjsHandler.mock.calls[0]?.[1];
    expect(passedParams.value.code).toBe('return "{{ctx.user.id}}/{{ctx.user.name}}";');
    expect(passedParams.value.settings).toEqual({ greeting: 'hello Alice' });
  });
});
