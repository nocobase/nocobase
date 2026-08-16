/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { compileRunJSSourceWorkspace } from '@nocobase/runjs/compiler';

import { JsTemplateError } from '../../shared/errors';
import { createJsTemplateWorkspaceFromRunJS } from '../services/SaveAsJsTemplateService';
import {
  buildJsTemplateInlineOverwriteChanges,
  collectAndRelocateInlineFiles,
  convertJsTemplateToInlineWorkspace,
  createRunJSInlineManifestFile,
} from '../services/conversion/jsTemplateToInlineWorkspace';
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

  it('relocates only the reachable value and ImportType closure into a compilable inline workspace', async () => {
    const result = convertJsTemplateToInlineWorkspace({
      entryPath: 'src/client/js-blocks/orders/index.tsx',
      runtimeVersion: 'v2',
      files: [
        {
          path: 'src/client/js-blocks/orders/index.tsx',
          content: [
            'import { title } from "./title";',
            "type Row = import('../../../shared/models/row').Row;",
            'const row: Row = { label: title };',
            'ctx.render(<div>{row.label}</div>);',
          ].join('\n'),
        },
        { path: 'src/client/js-blocks/orders/title.ts', content: 'export const title = "Orders";\n' },
        { path: 'src/shared/models/row.ts', content: 'export interface Row { label: string }\n' },
        { path: 'src/shared/models/unused.ts', content: 'export interface Unused { value: string }\n' },
        {
          path: 'src/client/js-blocks/orders/entry.json',
          content: '{"schemaVersion":1,"key":"orders"}\n',
          language: 'json',
        },
      ],
    });

    expect(result.files.map((file) => file.path)).toEqual([
      'src/client/entry.json',
      'src/client/index.tsx',
      'src/client/title.ts',
      'src/shared/models/row.ts',
    ]);
    const entry = result.files.find((file) => file.path === result.entryPath)?.content || '';
    expect(entry).toContain('from "./title"');
    expect(entry).toContain("import('../shared/models/row').Row");
    expect(result.files.some((file) => file.path.endsWith('/unused.ts'))).toBe(false);
    const compiled = await compileRunJSSourceWorkspace({
      entry: result.entryPath,
      files: result.files,
      surfaceStyle: 'render',
    });
    expect(compiled.failureCode, JSON.stringify(compiled.artifact.diagnostics, null, 2)).toBeUndefined();
  });

  it('does not cross into a sibling Template through an ImportType reference', () => {
    expect(() =>
      collectAndRelocateInlineFiles({
        entryPath: 'src/client/js-blocks/sales/index.ts',
        files: [
          {
            path: 'src/client/js-blocks/sales/index.ts',
            content: `type Sibling = import('../sibling/types').Sibling;\nreturn null as unknown as Sibling;`,
          },
          {
            path: 'src/client/js-blocks/sibling/types.ts',
            content: 'export interface Sibling { value: string }',
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: 'JS_TEMPLATE_INVALID_INPUT' }));
  });

  it('resolves and rewrites a shared index re-export during relocation', () => {
    const files = collectAndRelocateInlineFiles({
      entryPath: 'src/client/js-blocks/sales/index.tsx',
      files: [
        {
          path: 'src/client/js-blocks/sales/index.tsx',
          content: "export { format } from '../../../shared/format';\nctx.render(<div />);\n",
        },
        { path: 'src/shared/format/index.ts', content: 'export const format = true;\n' },
      ],
    });

    expect(files.find((file) => file.path === 'src/client/index.tsx')?.content).toContain(
      "from '../shared/format/index'",
    );
  });

  it.each([
    {
      label: 'duplicate normalized paths',
      entryPath: 'src/client/js-blocks/sales/index.tsx',
      files: [
        { path: 'src/client/js-blocks/sales/index.tsx', content: 'ctx.render(<div />);' },
        { path: './src/client/js-blocks/sales/index.tsx', content: 'ctx.render(<div />);' },
      ],
    },
    {
      label: 'a dependency outside the entry and shared roots',
      entryPath: 'src/client/js-blocks/sales/index.tsx',
      files: [
        { path: 'src/client/js-blocks/sales/index.tsx', content: "import '../../../other';\nctx.render(<div />);" },
        { path: 'src/other.ts', content: 'export const other = true;\n' },
      ],
    },
    {
      label: 'an absolute workspace path',
      entryPath: 'src/client/js-blocks/sales/index.tsx',
      files: [{ path: '/src/client/js-blocks/sales/index.tsx', content: 'ctx.render(<div />);' }],
    },
    {
      label: 'a post-relocation collision',
      entryPath: 'src/client/js-blocks/sales/main.ts',
      files: [
        { path: 'src/client/js-blocks/sales/main.ts', content: "import './index';\nctx.render(<div />);" },
        { path: 'src/client/js-blocks/sales/index.ts', content: 'export const value = true;' },
      ],
    },
  ])('rejects $label', ({ entryPath, files }) => {
    expect(() => collectAndRelocateInlineFiles({ entryPath, files })).toThrowError(
      expect.objectContaining({ code: 'JS_TEMPLATE_INVALID_INPUT' }),
    );
  });

  it('rewrites the current multi-file workspace and excludes internal metadata', () => {
    const files = createJsTemplateWorkspaceFromRunJS({
      kind: 'js-block',
      templateName: 'sales-kpi',
      templateTitle: 'Sales KPI',
      entryPath: 'src/main.ts',
      files: [
        { path: '.nocobase/runjs-source.json', content: '{}' },
        {
          path: 'src/main.ts',
          content:
            "import { helper } from './helper';\nimport { value } from '../shared/value';\nreturn helper(value);\n",
        },
        { path: 'src/helper.ts', content: 'export const helper = (value: unknown) => value;\n' },
        { path: 'shared/value.ts', content: 'export const value = 1;\n' },
      ],
    });

    expect(files.map((file) => file.path).sort()).toEqual([
      'src/client/js-blocks/sales-kpi/__workspace/shared/value.ts',
      'src/client/js-blocks/sales-kpi/entry.json',
      'src/client/js-blocks/sales-kpi/helper.ts',
      'src/client/js-blocks/sales-kpi/index.ts',
    ]);
    expect(files.find((file) => file.path.endsWith('/index.ts'))?.content).toContain(
      "from './__workspace/shared/value'",
    );
    expect(files.some((file) => file.path.includes('.nocobase'))).toBe(false);
  });

  it.each([
    ['js-block', 'src/client/js-blocks', null],
    ['js-field', 'src/client/js-fields', 'js-field'],
    ['js-action', 'src/client/js-actions', null],
    ['js-item', 'src/client/js-items', null],
  ] as const)('projects the canonical %s descriptor while preserving supported metadata', (kind, root, category) => {
    const settings = {
      enabled: { type: 'boolean', default: false },
      advanced: { type: 'object', properties: { hiddenValue: { type: 'string', default: 'kept' } } },
    };
    const files = createJsTemplateWorkspaceFromRunJS({
      kind,
      templateName: 'normalize-order',
      templateTitle: 'Normalize order',
      category,
      entryPath: 'src/client/nested/index.ts',
      files: [
        { path: 'src/client/nested/index.ts', content: 'return input;' },
        {
          path: 'src/client/entry.json',
          content: JSON.stringify({
            schemaVersion: 99,
            key: 'old-key',
            title: 'Old title',
            description: 'Keep this description',
            category: 'old-category',
            icon: 'CodeOutlined',
            tags: ['inline', 'configuration'],
            sort: 20,
            settings,
            settingsSchema: { type: 'object', properties: { legacy: { type: 'string' } } },
            unknown: true,
          }),
        },
        { path: 'src/client/nested/meta.json', content: '{"key":"legacy"}' },
        { path: 'src/client/nested/settings.json', content: '{"type":"object"}' },
      ],
    });

    expect(files.map((file) => file.path).sort()).toEqual([
      `${root}/normalize-order/entry.json`,
      `${root}/normalize-order/index.ts`,
    ]);
    expect(JSON.parse(files.find((file) => file.path.endsWith('/entry.json'))?.content || '{}')).toEqual({
      schemaVersion: 1,
      key: 'normalize-order',
      title: 'Normalize order',
      description: 'Keep this description',
      category: category || 'old-category',
      icon: 'CodeOutlined',
      tags: ['inline', 'configuration'],
      sort: 20,
      settings,
    });
  });

  it('builds the canonical inline manifest and a sorted overwrite set that deletes stale files', () => {
    const manifest = createRunJSInlineManifestFile({
      entryPath: 'src/client/index.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
    });
    expect(JSON.parse(manifest.content)).toEqual({
      schemaVersion: 1,
      entry: 'src/client/index.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      compiler: { module: 'virtual-esm', jsx: true },
    });
    expect(
      buildJsTemplateInlineOverwriteChanges(
        [{ path: 'src/client/old.ts' }, { path: 'src/client/index.tsx' }],
        [{ path: 'src/client/index.tsx', content: 'ctx.render(<div />);\n' }, manifest],
      ),
    ).toEqual([
      { ...manifest, operation: 'upsert' },
      { path: 'src/client/index.tsx', content: 'ctx.render(<div />);\n', operation: 'upsert' },
      { path: 'src/client/old.ts', operation: 'delete' },
    ]);
  });
});
