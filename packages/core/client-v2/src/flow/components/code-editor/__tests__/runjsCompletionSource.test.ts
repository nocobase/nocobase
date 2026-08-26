/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

// Avoid pulling in heavy HTML/JSX completion behaviors; we only test our ctx meta merging logic here.
vi.mock('../htmlCompletion', () => ({ isHtmlTemplateContext: () => false }));
vi.mock('../jsxCompletion', () => ({ createJsxCompletion: () => () => false }));

import { createRunJSCompletionSource } from '../runjsCompletionSource';

function makeDoc(text: string) {
  return {
    sliceString(from: number, to: number) {
      return text.slice(from, to);
    },
  };
}

describe('createRunJSCompletionSource', () => {
  it('suppresses snapshot property completions under meta root (keeps meta breadcrumb)', async () => {
    const hostCtx: any = {
      t: (s: string) => s,
      getPropertyMetaTree: (value: string) => {
        if (value === '{{ ctx.record }}') {
          return [
            {
              name: 'roles',
              title: '角色',
              type: 'object',
              paths: ['record', 'roles'],
              children: [
                {
                  name: 'users',
                  title: 'users',
                  type: 'object',
                  paths: ['record', 'roles', 'users'],
                  parentTitles: ['角色'],
                },
              ],
            },
          ];
        }
        return [];
      },
    };

    const staticOptions: any[] = [
      { label: 'ctx.record.roles.users', type: 'property', detail: 'object' },
      { label: 'ctx.record.save()', type: 'function', detail: '() => void' },
      { label: 'ctx.other', type: 'property' },
    ];

    const source = createRunJSCompletionSource({ hostCtx, staticOptions });

    const text = 'ctx.record.roles.users';
    const context: any = {
      explicit: true,
      pos: text.length,
      state: { doc: makeDoc(text) },
      matchBefore: () => ({ from: 0, to: text.length, text }),
    };

    const res = await source(context);
    expect(res).toBeTruthy();
    const options = (res as any).options as any[];

    const matches = options.filter((o) => o.label === 'ctx.record.roles.users');
    expect(matches.length).toBe(1);
    expect(matches[0].detail).toBe('角色 / users');
    // function under same root should NOT be filtered out
    expect(options.some((o) => o.label === 'ctx.record.save()')).toBe(true);
  });

  it('uses await ctx.getVar(fullPath) for ctx.popup.* meta completions and hides snapshot ctx.popup in deep contexts', async () => {
    const hostCtx: any = {
      t: (s: string) => s,
      popup: Promise.resolve({ uid: 'p1' }),
      getPropertyMetaTree: (value: string) => {
        if (value === '{{ ctx.popup }}') {
          return [
            {
              name: 'record',
              title: 'Record',
              type: 'object',
              paths: ['popup', 'record'],
              children: [
                {
                  name: 'id',
                  title: 'ID',
                  type: 'string',
                  paths: ['popup', 'record', 'id'],
                  parentTitles: ['Record'],
                },
              ],
            },
          ];
        }
        return [];
      },
    };

    const staticOptions: any[] = [
      { label: 'ctx.popup', type: 'property', detail: 'Promise<any>' },
      { label: 'ctx.popup.record', type: 'property' },
    ];

    const source = createRunJSCompletionSource({ hostCtx, staticOptions });

    const text = 'ctx.popup.record.'; // cursor after dot
    const context: any = {
      explicit: true,
      pos: text.length,
      state: { doc: makeDoc(text) },
      matchBefore: () => ({ from: 0, to: text.length, text }),
    };

    const res = await source(context);
    expect(res).toBeTruthy();
    const options = (res as any).options as any[];

    const id = options.find((o) => o.label === 'ctx.popup.record.id');
    expect(id).toBeTruthy();
    expect(typeof id.apply).toBe('function');
    const mockView = { dispatch: vi.fn(), state: { doc: makeDoc(text) } } as any;
    (id as any).apply(mockView, id, (res as any).from, (res as any).to);
    const inserted = mockView.dispatch.mock.calls[0][0]?.changes?.insert;
    expect(inserted).toBe("await ctx.getVar('ctx.popup.record.id')");
    // deep meta context should not propose snapshot ctx.popup root (to avoid inserting await ctx.getVar('ctx.popup') + trailing .xxx)
    expect(options.some((o) => o.label === 'ctx.popup')).toBe(false);
  });

  it('does not wrap ctx.* into getVar when completing inside a string literal', async () => {
    const hostCtx: any = {
      t: (s: string) => s,
      popup: Promise.resolve({ uid: 'p1' }),
      getPropertyMetaTree: (value: string) => {
        if (value === '{{ ctx.popup }}') {
          return [
            {
              name: 'record',
              title: 'Record',
              type: 'object',
              paths: ['popup', 'record'],
              children: [
                {
                  name: 'createdAt',
                  title: 'Created at',
                  type: 'string',
                  paths: ['popup', 'record', 'createdAt'],
                  parentTitles: ['Record'],
                },
              ],
            },
          ];
        }
        return [];
      },
    };

    const staticOptions: any[] = [{ label: 'ctx.popup.record.createdAt', type: 'property' }];
    const source = createRunJSCompletionSource({ hostCtx, staticOptions });

    const prefix = "await ctx.getVar('";
    const pathText = 'ctx.popup.record.';
    const text = `${prefix}${pathText}`;
    const wordFrom = prefix.length;
    const context: any = {
      explicit: true,
      pos: text.length,
      state: { doc: makeDoc(text) },
      matchBefore: () => ({ from: wordFrom, to: text.length, text: pathText }),
    };

    const res = await source(context);
    expect(res).toBeTruthy();
    const options = (res as any).options as any[];

    const createdAt = options.find((o) => o.label === 'ctx.popup.record.createdAt');
    expect(createdAt).toBeTruthy();
    expect(typeof createdAt.apply).toBe('function');

    const mockView = { dispatch: vi.fn(), state: { doc: makeDoc(text) } } as any;
    (createdAt as any).apply(mockView, createdAt, (res as any).from, (res as any).to);
    const inserted = mockView.dispatch.mock.calls[0][0]?.changes?.insert;
    expect(inserted).toBe('ctx.popup.record.createdAt');
  });

  it('supports async hidden/disabled/disabledReason in meta nodes', async () => {
    const hostCtx: any = {
      t: (s: string) => s,
      getPropertyMetaTree: (value: string) => {
        if (value === '{{ ctx.record }}') {
          return [
            {
              name: 'visible',
              title: 'Visible',
              type: 'string',
              paths: ['record', 'visible'],
              hidden: async () => false,
            },
            {
              name: 'hidden',
              title: 'Hidden',
              type: 'string',
              paths: ['record', 'hidden'],
              hidden: async () => true,
            },
            {
              name: 'disabled',
              title: 'Disabled',
              type: 'string',
              paths: ['record', 'disabled'],
              disabled: async () => true,
              disabledReason: async () => 'not allowed',
            },
          ];
        }
        return [];
      },
    };

    const source = createRunJSCompletionSource({ hostCtx, staticOptions: [] });

    const text = 'ctx.record.'; // cursor after dot
    const context: any = {
      explicit: true,
      pos: text.length,
      state: { doc: makeDoc(text) },
      matchBefore: () => ({ from: 0, to: text.length, text }),
    };

    const res = await source(context);
    expect(res).toBeTruthy();
    const options = (res as any).options as any[];

    expect(options.some((o) => o.label === 'ctx.record.visible')).toBe(true);
    expect(options.some((o) => o.label === 'ctx.record.hidden')).toBe(false);

    const disabled = options.find((o) => o.label === 'ctx.record.disabled');
    expect(disabled).toBeTruthy();
    expect(String(disabled?.info || '')).toContain('Disabled:');
    expect(String(disabled?.info || '')).toContain('not allowed');
  });
});
