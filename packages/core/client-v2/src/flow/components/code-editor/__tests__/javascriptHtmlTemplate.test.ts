/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ensureSyntaxTree } from '@codemirror/language';
import { CompletionContext } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { describe, expect, it, beforeAll } from 'vitest';
import { setupRunJSContexts } from '@nocobase/flow-engine';
import { javascriptWithHtmlTemplates } from '../javascriptHtmlTemplate';
import { createHtmlCompletion } from '../htmlCompletion';

const javascriptDialect = { jsx: true, typescript: false };

describe('javascriptWithHtmlTemplates', () => {
  beforeAll(async () => {
    await setupRunJSContexts();
  });
  it('mounts html parser for template literal segments', () => {
    const support = javascriptWithHtmlTemplates(javascriptDialect);
    const state = EditorState.create({
      doc: 'const template = `<div class="box">${value}</div>`;',
      extensions: [support],
    });

    const htmlPos = state.doc.toString().indexOf('div class');
    const node = ensureSyntaxTree(state, state.doc.length, 1_000)?.resolveInner(htmlPos, 1);

    expect(node?.name).toBe('TagName');
  });

  it('preserves interpolation nodes from javascript parser', () => {
    const support = javascriptWithHtmlTemplates(javascriptDialect);
    const state = EditorState.create({
      doc: 'const template = `<div>${value}</div>`;',
      extensions: [support],
    });

    const variablePos = state.doc.toString().indexOf('value');
    const node = ensureSyntaxTree(state, state.doc.length, 1_000)?.resolveInner(variablePos, 1);

    expect(node?.name).toBe('VariableName');
  });

  it('uses the TypeScript grammar for type-only imports and declarations', () => {
    const support = javascriptWithHtmlTemplates({ jsx: false, typescript: true });
    const state = EditorState.create({
      doc: `import { type User } from './types';\ntype Result = { user: User };\nconst value = {} as Result;`,
      extensions: [support],
    });
    const tree = ensureSyntaxTree(state, state.doc.length, 1_000);
    let hasSyntaxError = false;

    tree?.iterate({
      enter(node) {
        if (node.type.isError) {
          hasSyntaxError = true;
        }
      },
    });

    expect(hasSyntaxError).toBe(false);
  });

  it('defers to html completions inside template literals', async () => {
    const support = javascriptWithHtmlTemplates(javascriptDialect);
    const state = EditorState.create({
      doc: 'const template = `<`;',
      extensions: [support],
    });
    const doc = state.doc.toString();
    const pos = doc.indexOf('<') + 1;
    const context = new CompletionContext(state, pos, true);

    const { createJavascriptCompletion } = await import('../javascriptCompletion');
    const jsCompletion = createJavascriptCompletion()(context);
    expect(jsCompletion).toBeNull();

    const htmlResult = await createHtmlCompletion()(context);
    expect(htmlResult).not.toBeNull();
    expect(htmlResult?.options?.some((option) => option.label.includes('div'))).toBe(true);
  });

  it('keeps html completions working after interpolations', async () => {
    const support = javascriptWithHtmlTemplates(javascriptDialect);
    const state = EditorState.create({
      doc: 'const template = `<div>${value}<<`;',
      extensions: [support],
    });

    const doc = state.doc.toString();
    const pos = doc.lastIndexOf('<');
    const context = new CompletionContext(state, pos + 1, true);

    const { createJavascriptCompletion } = await import('../javascriptCompletion');
    const jsCompletion = createJavascriptCompletion()(context);
    expect(jsCompletion).toBeNull();

    const htmlResult = await createHtmlCompletion()(context);
    expect(htmlResult).not.toBeNull();
    expect(htmlResult?.options?.some((option) => option.label.includes('div'))).toBe(true);
  });

  it('keeps javascript completions available outside template literals', async () => {
    const state = EditorState.create({
      doc: 'const value = windo',
      extensions: [javascriptWithHtmlTemplates(javascriptDialect)],
    });

    const pos = state.doc.length;
    const context = new CompletionContext(state, pos, true);

    const { createJavascriptCompletion } = await import('../javascriptCompletion');
    const result = createJavascriptCompletion()(context);
    expect(result).not.toBeNull();
    expect(result?.options.length ?? 0).toBeGreaterThan(0);
  });

  it.each([
    ['TypeScript', { jsx: false, typescript: true }, 'const template: string = `<section>${value}</section>`;'],
    [
      'TSX',
      { jsx: true, typescript: true },
      'const View = ({ value }: { value: string }) => <main>{`<section>${value}</section>`}</main>;',
    ],
  ])('keeps mixed html parsing in the %s dialect', (_, dialect, doc) => {
    const state = EditorState.create({
      doc,
      extensions: [javascriptWithHtmlTemplates(dialect)],
    });

    const htmlPos = state.doc.toString().indexOf('section');
    const tree = ensureSyntaxTree(state, state.doc.length, 1_000);
    const node = tree?.resolveInner(htmlPos, 1);
    let hasError = false;
    tree?.iterate({
      enter: (syntaxNode) => {
        hasError ||= syntaxNode.type.isError;
      },
    });

    expect(node?.name).toBe('TagName');
    expect(hasError).toBe(false);
  });
});
