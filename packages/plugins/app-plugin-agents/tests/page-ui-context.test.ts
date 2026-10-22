import { describe, expect, it } from 'vitest';
import { runnerUIMessages } from '../server/online/agent/runner/projection.js';
import {
  clonePageUIContext,
  PAGE_UI_CONTEXT_LIMITS,
  pageUIContextSchema,
} from '../shared/page-ui-context.js';
import {
  appUIPageContextSchema,
  publicUIPageContext,
} from '../shared/ui-message.js';
import {
  PageContextSchema,
  createPageContextKinds,
  renderPageContext,
} from '../server/core/conversations/page-context.js';

const snapshot = () => ({
  version: 1,
  items: [
    {
      kind: 'unknown.application/ui',
      id: 'a:b',
      payload: { nested: [false, 0, '', null, { custom: true }] },
    },
  ],
});

describe('open browser UI context', () => {
  it('preserves unknown kinds and custom JSON through schema, resolution and public projection without business authorization', async () => {
    const raw = snapshot();
    const context = PageContextSchema.parse({
      route: '/page',
      items: [{ kind: 'unknown', id: 'secret' }],
      ui: raw,
    });
    const resolved = await createPageContextKinds().resolve(
      undefined!,
      'alice',
      context,
    );
    expect(resolved.items).toEqual([]);
    expect(resolved.dropped).toBe(1);
    expect(resolved.ui).toEqual(raw);
    expect(appUIPageContextSchema.parse(resolved).ui).toEqual(raw);
    const publicContext = publicUIPageContext(resolved);
    raw.items[0].payload.nested[0] = true;
    expect(publicContext.ui?.items[0].payload).toEqual({
      nested: [false, 0, '', null, { custom: true }],
    });
    const prompt = renderPageContext(publicContext);
    expect(prompt).toContain('untrusted browser data');
    expect(prompt).toContain('do not grant resource access');
    expect(prompt).toContain('unknown.application/ui');
    expect(
      PageContextSchema.parse({ route: '/', items: [] }),
    ).not.toHaveProperty('ui');
  });

  it('keeps the same UI snapshot in Runner public history projection without promoting it to a business reference', () => {
    const ui = clonePageUIContext(snapshot());
    const messages = runnerUIMessages([
      {
        id: 'runner-user',
        conversationId: 'conversation',
        seq: 1,
        role: 'user',
        content: { type: 'text', content: 'Inspect the widget' },
        toolCalls: null,
        attachments: null,
        workContext: { route: '/', items: [], dropped: 0, ui },
        metadata: { clientId: 'browser-input' },
        runId: 'run',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    expect(messages[0].metadata?.context?.ui).toEqual(ui);
    ui.items[0].changed = true;
    expect(messages[0].metadata?.context?.ui?.items[0]).not.toHaveProperty(
      'changed',
    );
    expect(messages[0].metadata?.context?.items).toEqual([]);
  });

  it.each([
    undefined,
    () => {},
    1n,
    NaN,
    Infinity,
    new Date(),
    new Map(),
    new Uint8Array(),
    { x: undefined },
    [undefined],
    Array(1),
    Object.create({ inherited: true }),
    JSON.parse('{"__proto__":{"polluted":true}}'),
    { constructor: {} },
    { prototype: {} },
  ])('rejects non-JSON or unsafe nested values: %s', (bad) => {
    expect(() =>
      clonePageUIContext({ version: 1, items: [{ kind: 'x', id: 'y', bad }] }),
    ).toThrow(/UI context/);
  });

  it('rejects cycles, symbols, duplicate identities, extra envelope properties and invalid identifiers', () => {
    const accessor = Object.defineProperty({}, 'x', {
      enumerable: true,
      get: () => {
        throw new Error('getter must not run');
      },
    });
    expect(() =>
      clonePageUIContext({
        version: 1,
        items: [{ kind: 'x', id: 'y', accessor }],
      }),
    ).toThrow(/accessors/);
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    for (const bad of [cycle, { [Symbol('hidden')]: 1 }])
      expect(() =>
        clonePageUIContext({
          version: 1,
          items: [{ kind: 'x', id: 'y', bad }],
        }),
      ).toThrow();
    for (const bad of [
      { version: 2, items: [] },
      { version: 1, items: [], extra: true },
      { version: 1, items: [{ kind: '', id: 'x' }] },
      {
        version: 1,
        items: [
          { kind: 'x', id: 'y' },
          { kind: 'x', id: 'y', changed: 1 },
        ],
      },
    ])
      expect(pageUIContextSchema.safeParse(bad).success).toBe(false);
    expect({}).not.toHaveProperty('polluted');
  });

  it('enforces every named budget without silent truncation', () => {
    const item = { kind: 'x', id: 'y' };
    const test = (items: unknown[]) =>
      expect(() => clonePageUIContext({ version: 1, items })).toThrow();
    test(
      Array.from({ length: PAGE_UI_CONTEXT_LIMITS.items + 1 }, (_, index) => ({
        ...item,
        id: String(index),
      })),
    );
    test([{ ...item, kind: 'x'.repeat(PAGE_UI_CONTEXT_LIMITS.kind + 1) }]);
    test([{ ...item, id: 'x'.repeat(PAGE_UI_CONTEXT_LIMITS.id + 1) }]);
    test([{ ...item, data: 'x'.repeat(PAGE_UI_CONTEXT_LIMITS.string + 1) }]);
    test([{ ...item, ['x'.repeat(PAGE_UI_CONTEXT_LIMITS.key + 1)]: true }]);
    test([
      {
        ...item,
        data: Array.from({ length: PAGE_UI_CONTEXT_LIMITS.nodes }, () => 0),
      },
    ]);
    test([
      { ...item, data: Array.from({ length: 6 }, () => 'x'.repeat(12000)) },
    ]);
    let data: unknown = null;
    for (let index = 0; index <= PAGE_UI_CONTEXT_LIMITS.depth; index += 1)
      data = { data };
    test([{ ...item, data }]);
    const original = snapshot();
    expect(clonePageUIContext(original)).not.toBe(original);
  });
});
