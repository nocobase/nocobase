/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { javascriptWithHtmlTemplates } from '../javascriptHtmlTemplate';

describe('javascriptWithHtmlTemplates', () => {
  it('mounts html parser for template literal segments', () => {
    const support = javascriptWithHtmlTemplates();
    const state = EditorState.create({
      doc: 'const template = `<div class="box">${value}</div>`;',
      extensions: [support],
    });

    const htmlPos = state.doc.toString().indexOf('div class');
    const node = syntaxTree(state).resolveInner(htmlPos, 1);

    expect(node.name).toBe('TagName');
  });

  it('preserves interpolation nodes from javascript parser', () => {
    const support = javascriptWithHtmlTemplates();
    const state = EditorState.create({
      doc: 'const template = `<div>${value}</div>`;',
      extensions: [support],
    });

    const variablePos = state.doc.toString().indexOf('value');
    const node = syntaxTree(state).resolveInner(variablePos, 1);

    expect(node.name).toBe('VariableName');
  });
});
