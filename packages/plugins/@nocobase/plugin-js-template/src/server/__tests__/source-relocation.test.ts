/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { JsTemplateError } from '../../shared/errors';
import { collectAndRelocateInlineFiles } from '../services/DetachJsTemplateToInlineService';
import { collectRelativeModuleReferences, rewriteRelativeImports } from '../services/sourceRelocation';

describe('JS Template static source relocation', () => {
  it('collects and rewrites relative ImportType references while preserving extension style', () => {
    const sourcePath = 'src/client/js-blocks/sales/nested/index.ts';
    const targetPath = 'src/client/index.ts';
    const dependencyPath = 'src/shared/models/row.ts';
    const content = [
      `import type { Local } from './local';`,
      `type Row = import('../../../../shared/models/row.ts').Row;`,
      `export type { Shared } from '../../../../shared/models/shared';`,
      `const runtime = import('../../../../shared/runtime');`,
    ].join('\n');
    const targetBySource = new Map([
      [sourcePath, targetPath],
      ['src/client/js-blocks/sales/nested/local.ts', 'src/client/local.ts'],
      [dependencyPath, dependencyPath],
      ['src/shared/models/shared.ts', 'src/shared/models/shared.ts'],
    ]);

    expect(collectRelativeModuleReferences(sourcePath, content).map((reference) => reference.kind)).toEqual([
      'import-declaration',
      'import-type',
      'export-declaration',
    ]);
    const rewritten = rewriteRelativeImports(content, sourcePath, targetPath, targetBySource);
    expect(rewritten).toContain(`import type { Local } from './local'`);
    expect(rewritten).toContain(`import('../shared/models/row.ts').Row`);
    expect(rewritten).toContain(`from '../shared/models/shared'`);
    expect(rewritten).toContain(`import('../../../../shared/runtime')`);
  });

  it('returns a RunJS unresolved diagnostic instead of dropping a missing static type dependency', () => {
    let caught: unknown;
    try {
      collectAndRelocateInlineFiles({
        entryPath: 'src/client/js-blocks/sales/index.ts',
        files: [
          {
            path: 'src/client/js-blocks/sales/index.ts',
            content: `type Missing = import('../../../shared/missing').Missing;\nreturn null as unknown as Missing;`,
          },
        ],
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(JsTemplateError);
    expect(caught).toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        failureCode: 'RUNJS_IMPORT_NOT_FOUND',
        diagnostics: [
          expect.objectContaining({
            code: 'RUNJS_IMPORT_NOT_FOUND',
            path: 'src/client/js-blocks/sales/index.ts',
            line: 1,
            details: expect.objectContaining({
              importer: 'src/client/js-blocks/sales/index.ts',
              specifier: '../../../shared/missing',
              kind: 'type',
              candidatePaths: expect.arrayContaining(['src/shared/missing.ts', 'src/shared/missing/index.ts']),
            }),
          }),
        ],
      },
    });
  });
});
