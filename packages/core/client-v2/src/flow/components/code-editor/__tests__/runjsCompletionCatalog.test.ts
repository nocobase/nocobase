/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Completion } from '@codemirror/autocomplete';
import { collectRunJSTypeLibraryUsage, type RunJSTypeLibraryRequest } from '@nocobase/runjs/client-v2';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../htmlCompletion', () => ({ isHtmlTemplateContext: () => false }));
vi.mock('../jsxCompletion', () => ({ createJsxCompletion: () => () => false }));

import {
  clearRunJSTypeLibraryPackRegistryForTests,
  registerRunJSTypeLibraryPackLoader,
} from '../typescriptLibraryRegistry';
import { createRunJSCompletionSource } from '../runjsCompletionSource';

afterEach(() => {
  clearRunJSTypeLibraryPackRegistryForTests();
});

describe('RunJS generated completion catalogs', () => {
  it.each(['ctx.libs.antd.', 'ctx.antd.'])('provides real antd members for %s', async (text) => {
    const result = await runCompletion(text);
    const labels = labelsOf(result);

    expect(labels.has('Button')).toBe(true);
    expect(labels.has('Table')).toBe(true);
    expect(labels.has('ButtonProps')).toBe(false);
    expect(result?.from).toBe(text.length);
  });

  it('provides real icon names with group metadata and maps accepted members to the symbol pack', async () => {
    const text = 'ctx.libs.antdIcons.Pl';
    const result = await runCompletion(text);
    const plus = result?.options.find((option) => option.label === 'PlusOutlined');
    const accepted = replaceCompletionFragment(text, result, 'PlusOutlined');
    const requests = collectRunJSTypeLibraryUsage(ts, { files: [{ path: 'src/main.tsx', content: accepted }] });

    expect(plus?.detail).toContain('antd-icons/P');
    expect(requests).toContainEqual({
      kind: 'symbol',
      libraryName: 'antdIcons',
      packId: 'antd-icons/P',
      symbol: 'PlusOutlined',
      group: 'P',
    });
  });

  it('maps an accepted antd member to its component pack on the next usage analysis', async () => {
    const text = 'ctx.libs.antd.Bu';
    const result = await runCompletion(text);
    const accepted = replaceCompletionFragment(text, result, 'Button');
    const requests = collectRunJSTypeLibraryUsage(ts, { files: [{ path: 'src/main.tsx', content: accepted }] });

    expect(accepted).toBe('ctx.libs.antd.Button');
    expect(requests).toContainEqual({
      kind: 'symbol',
      libraryName: 'antd',
      packId: 'antd/Button',
      symbol: 'Button',
    });
  });

  it('completes antd destructuring keys and excludes keys already present', async () => {
    const text = 'const { Input, Bu } = ctx.libs.antd;';
    const cursor = text.indexOf('Bu') + 2;
    const result = await runCompletion(text, cursor);
    const labels = labelsOf(result);

    expect(labels.has('Button')).toBe(true);
    expect(labels.has('Input')).toBe(false);
    expect(result?.from).toBe(cursor - 2);
  });

  it.each(["const text = 'ctx.libs.antd.';", '// ctx.libs.antd.', '/* ctx.libs.antd. */', 'unrelated.antd.'])(
    'does not provide catalog members in non-code or unrelated context: %s',
    async (text) => {
      const result = await runCompletion(text);
      expect(labelsOf(result).has('Button')).toBe(false);
    },
  );

  it('keeps high-value and injected completions ahead of catalog entries without duplicates', async () => {
    const text = 'ctx.libs.antd.';
    const staticOptions: Completion[] = [
      { label: 'ctx.libs.antd.Button', type: 'snippet', detail: 'High-value template', boost: 130 },
      { label: 'ctx.libs.antd.CustomWidget', type: 'class', detail: 'Injected completion', boost: 125 },
      { label: 'ctx.libs.antd.Button', type: 'snippet', detail: 'Injected override', boost: 140 },
    ];
    const result = await runCompletion(text, text.length, staticOptions);
    const labels = result?.options.map((option) => option.label) || [];

    expect(labels.filter((label) => label === 'Button')).toHaveLength(1);
    expect(labels.indexOf('Button')).toBeLessThan(labels.indexOf('Affix'));
    expect(labels.indexOf('CustomWidget')).toBeLessThan(labels.indexOf('Affix'));
    expect(result?.options.find((option) => option.label === 'Button')?.detail).toBe('Injected override');
  });

  it('does not invoke registered TypeScript pack loaders while opening catalog completion', async () => {
    const packLoader = vi.fn((_request: RunJSTypeLibraryRequest) => {
      throw new Error('type pack loader must not be called by completion');
    });
    registerRunJSTypeLibraryPackLoader('antd/Button', packLoader);

    const result = await runCompletion('ctx.libs.antd.');

    expect(labelsOf(result).has('Button')).toBe(true);
    expect(packLoader).not.toHaveBeenCalled();
  });
});

function makeDoc(text: string) {
  return {
    length: text.length,
    sliceString(from: number, to: number) {
      return text.slice(from, to);
    },
  };
}

async function runCompletion(text: string, position = text.length, staticOptions: Completion[] = []) {
  const source = createRunJSCompletionSource({ hostCtx: {}, staticOptions });
  return await source({
    explicit: true,
    pos: position,
    state: { doc: makeDoc(text) },
    matchBefore(pattern: RegExp) {
      const prefix = text.slice(0, position);
      const match = prefix.match(new RegExp(`${pattern.source}$`, pattern.flags));
      if (!match) return null;
      return { from: position - match[0].length, to: position, text: match[0] };
    },
  } as never);
}

function labelsOf(result: Awaited<ReturnType<typeof runCompletion>>): Set<string> {
  return new Set(result?.options.map((option) => option.label) || []);
}

function replaceCompletionFragment(
  text: string,
  result: Awaited<ReturnType<typeof runCompletion>>,
  label: string,
): string {
  if (!result) throw new Error('Missing completion result');
  return `${text.slice(0, result.from)}${label}${text.slice(result.to || result.from)}`;
}
