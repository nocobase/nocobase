/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ts from 'typescript';

import { collectStaticModuleReferences } from '../compiler';

describe('static module references', () => {
  it('collects declarations and ImportType nodes with their source positions', () => {
    const source = [
      `import value from './runtime';`,
      `export type { Shape } from '../types';`,
      `type Row = import('../../../shared/types').Row;`,
      `type Sdk = import('@nocobase/runjs/js-template/client').JsTemplate;`,
      `void import('./dynamic-runtime');`,
    ].join('\n');
    const sourceFile = ts.createSourceFile('src/client/index.ts', source, ts.ScriptTarget.Latest, true);

    const references = collectStaticModuleReferences(sourceFile);

    expect(
      references.map(({ kind, specifier, typeOnly, line, column }) => ({
        kind,
        specifier,
        typeOnly,
        line,
        column,
      })),
    ).toEqual([
      {
        kind: 'import-declaration',
        specifier: './runtime',
        typeOnly: false,
        line: 1,
        column: 19,
      },
      {
        kind: 'export-declaration',
        specifier: '../types',
        typeOnly: true,
        line: 2,
        column: 28,
      },
      {
        kind: 'import-type',
        specifier: '../../../shared/types',
        typeOnly: true,
        line: 3,
        column: 19,
      },
      {
        kind: 'import-type',
        specifier: '@nocobase/runjs/js-template/client',
        typeOnly: true,
        line: 4,
        column: 19,
      },
    ]);
    expect(references.map((reference) => source.slice(reference.start, reference.end))).toEqual([
      `'./runtime'`,
      `'../types'`,
      `'../../../shared/types'`,
      `'@nocobase/runjs/js-template/client'`,
    ]);
  });

  it('does not treat runtime import expressions as static type references', () => {
    const sourceFile = ts.createSourceFile(
      'src/client/index.ts',
      `const literal = import('./runtime');\nconst specifier = './other';\nconst computed = import(specifier);`,
      ts.ScriptTarget.Latest,
      true,
    );

    expect(collectStaticModuleReferences(sourceFile)).toEqual([]);
  });
});
