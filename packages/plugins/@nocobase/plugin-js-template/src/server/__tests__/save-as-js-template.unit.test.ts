/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { createJsTemplateWorkspaceFromRunJS } from '../services/SaveAsJsTemplateService';
import { collectAndRelocateInlineFiles } from '../services/conversion/jsTemplateToInlineWorkspace';
import { JsTemplateWorkspaceCompilerBridge } from '../services/JsTemplateWorkspaceCompilerBridge';

// Old case -> new owner:
// detach-to-inline / copies the entry descriptor together with runtime-reachable entry and shared modules -> this suite.
// detach-to-inline / rewrites JS Block SDK and settings types without touching other kind imports or source text -> this suite.

const entryPath = 'src/client/js-blocks/sales/index.tsx';
const descriptorPath = 'src/client/js-blocks/sales/entry.json';

describe('Save as JS Template source relocation', () => {
  it('prepares JS Template compiler input and metadata without producing a runtime artifact', () => {
    const preparation = new JsTemplateWorkspaceCompilerBridge().prepareEntry({
      projectId: 'jtp_sales',
      templateId: 'jtt_sales',
      operation: 'runtimeCompile',
      kind: 'js-block',
      templateName: 'sales',
      entryPath: 'src/client/index.tsx',
      runtimeVersion: 'v2',
      files: [
        {
          path: 'src/client/index.tsx',
          content:
            'import { defineSettings } from "@nocobase/runjs/js-template/client";\n' +
            'import type { Settings } from "js-template:settings/client/js-block/sales";\n' +
            'const settings = defineSettings({ enabled: true });\n' +
            'ctx.render(<div>{settings.enabled as Settings}</div>);\n',
        },
        { path: 'src/client/entry.json', content: '{"schemaVersion":1,"key":"sales","settings":{}}', language: 'json' },
      ],
    });

    expect(preparation).not.toHaveProperty('artifact');
    expect(preparation).toMatchObject({
      accepted: true,
      diagnostics: [],
      runtimeVersion: 'v2',
      metadata: {
        target: 'client',
        projectId: 'jtp_sales',
        templateId: 'jtt_sales',
        kind: 'js-block',
        templateName: 'sales',
        modelUse: 'JSBlockModel',
        surface: 'js-model.render',
        surfaceStyle: 'render',
        compilerSurfaceStyle: 'render',
      },
    });
    expect(preparation.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/entry.json',
          content: '{"schemaVersion":1,"key":"sales","settings":{}}',
        }),
        expect.objectContaining({
          path: 'src/client/index.tsx',
          content: expect.stringContaining('function defineSettings<TSettings>(settings: TSettings): TSettings'),
        }),
      ]),
    );
    expect(preparation.files.find((file) => file.path === 'src/client/index.tsx')?.content).not.toContain(
      '@nocobase/runjs/js-template/client',
    );
  });

  it.each([
    {
      label: 'extensionless local import',
      statement: "import { helper } from './helper';",
      dependencyPath: 'src/client/js-blocks/sales/helper.ts',
      expected: "from './helper'",
    },
    {
      label: 'shared index re-export',
      statement: "export { format } from '../../../shared/format';",
      dependencyPath: 'src/shared/format/index.ts',
      expected: "from '../shared/format/index'",
    },
  ])('relocates a $label through the shared relative-import resolver', ({ statement, dependencyPath, expected }) => {
    const files = collectAndRelocateInlineFiles({
      entryPath,
      files: [
        { path: entryPath, content: `${statement}\nctx.render(<div />);\n` },
        { path: dependencyPath, content: 'export const helper = true; export const format = true;\n' },
      ],
    });

    expect(files.find((file) => file.path === 'src/client/index.tsx')?.content).toContain(expected);
  });

  it.each([
    {
      label: 'duplicate normalized paths',
      files: [
        { path: entryPath, content: 'ctx.render(<div />);' },
        { path: `./${entryPath}`, content: 'ctx.render(<div />);' },
      ],
    },
    {
      label: 'an entry dependency outside its directory and shared root',
      files: [
        { path: entryPath, content: "import '../../../other';\nctx.render(<div />);" },
        { path: 'src/other.ts', content: 'export const other = true;\n' },
      ],
    },
    {
      label: 'an absolute workspace path',
      files: [{ path: `/${entryPath}`, content: 'ctx.render(<div />);' }],
    },
    {
      label: 'two reachable files that collide after relocation',
      files: [
        {
          path: 'src/client/js-blocks/sales/main.ts',
          content: "import './index';\nctx.render(<div />);",
        },
        { path: 'src/client/js-blocks/sales/index.ts', content: 'export const value = true;' },
      ],
      entryPath: 'src/client/js-blocks/sales/main.ts',
    },
  ])('rejects $label', ({ files, entryPath: currentEntryPath = entryPath }) => {
    expect(() => collectAndRelocateInlineFiles({ entryPath: currentEntryPath, files })).toThrowError(
      expect.objectContaining({ code: 'JS_TEMPLATE_INVALID_INPUT' }),
    );
  });

  it('copies the entry descriptor together with runtime-reachable entry and shared modules', () => {
    const canonicalDescriptorContent = `${JSON.stringify(
      {
        schemaVersion: 1,
        key: 'sales',
        title: 'Sales',
        settings: {
          showCard: { type: 'boolean', default: false },
        },
      },
      null,
      2,
    )}\n`;
    const descriptorContent = `\ufeff${canonicalDescriptorContent.replace(/\n/gu, '\r\n')}`;
    const files = collectAndRelocateInlineFiles({
      entryPath,
      files: [
        {
          path: entryPath,
          content: [
            "import './local';",
            "import type { TypeOnly } from '../../../shared/type-only';",
            "export type { ExportTypeOnly } from '../../../shared/export-type-only';",
            "export { reexported } from '../../../shared/reexported';",
            'ctx.render(<div />);',
          ].join('\n'),
        },
        {
          path: descriptorPath,
          content: descriptorContent,
          language: 'json',
        },
        {
          path: 'src/client/js-blocks/sales/local.ts',
          content: "import { used } from '../../../shared/used';\nvoid used;\n",
        },
        {
          path: 'src/shared/used.ts',
          content: "import './transitive';\nexport const used = true;\n",
        },
        { path: 'src/shared/transitive.ts', content: 'export const transitive = true;\n' },
        { path: 'src/shared/reexported.ts', content: 'export const reexported = true;\n' },
        { path: 'src/shared/type-only.ts', content: 'export type TypeOnly = string;\n' },
        { path: 'src/shared/export-type-only.ts', content: 'export type ExportTypeOnly = string;\n' },
        { path: 'src/shared/unused.ts', content: 'export const unused = true;\n' },
        { path: 'src/client/js-blocks/other/index.tsx', content: 'ctx.render(<div>Other</div>);\n' },
      ],
    });

    expect(files.map((file) => file.path)).toEqual([
      'src/client/entry.json',
      'src/client/index.tsx',
      'src/client/local.ts',
      'src/shared/export-type-only.ts',
      'src/shared/reexported.ts',
      'src/shared/transitive.ts',
      'src/shared/type-only.ts',
      'src/shared/used.ts',
    ]);
    expect(files.find((file) => file.path === 'src/client/entry.json')).toEqual({
      path: 'src/client/entry.json',
      content: descriptorContent,
      language: 'json',
    });
    expect(files.find((file) => file.path === 'src/client/index.tsx')?.content).toContain(
      "export { reexported } from '../shared/reexported'",
    );
    expect(files.find((file) => file.path === 'src/client/index.tsx')?.content).toContain(
      "import type { TypeOnly } from '../shared/type-only'",
    );
    expect(files.find((file) => file.path === 'src/client/index.tsx')?.content).toContain(
      "export type { ExportTypeOnly } from '../shared/export-type-only'",
    );
    expect(files.some((file) => file.path.endsWith('/unused.ts'))).toBe(false);
    expect(files.some((file) => file.path.includes('/other/'))).toBe(false);
  });

  it('preserves JS Block SDK and settings authoring imports for compiler preparation', () => {
    const pageEntryPath = 'src/client/js-blocks/orders/index.tsx';
    const files = collectAndRelocateInlineFiles({
      entryPath: pageEntryPath,
      files: [
        {
          path: pageEntryPath,
          content:
            'import { type JSBlockContext, defineSettings } from "@nocobase/runjs/js-template/client";\n' +
            'import type * as SDK from "@nocobase/runjs/js-template/client";\n' +
            'import type { Settings } from "js-template:settings/client/js-block/orders";\n' +
            'import type { Settings as BlockSettings } from "js-template:settings/client/js-block/sales";\n' +
            'type ImportedSettings = import("js-template:settings/client/js-block/orders").Settings;\n' +
            'type ImportedContext = import("@nocobase/runjs/js-template/client").JSBlockContext<ImportedSettings>;\n' +
            'const untouched = "js-template:settings/client/js-block/orders";\n' +
            '// js-template:settings/client/js-block/orders\n' +
            'const settings = defineSettings({ enabled: true });\n' +
            'export default function render(context: JSBlockContext<Settings>, shared: SDK.JSBlockContext<ImportedSettings>, imported: ImportedContext, block: BlockSettings) { ctx.render([context.record, shared.record, imported.record, block, untouched]); }\n',
        },
      ],
    });

    const code = files[0]?.content || '';
    expect(code).toContain('import { type JSBlockContext, defineSettings } from "@nocobase/runjs/js-template/client";');
    expect(code).toContain('import type * as SDK from "@nocobase/runjs/js-template/client";');
    expect(code).toContain('import type { Settings } from "js-template:settings/client/js-block/orders";');
    expect(code).toContain(
      'import type { Settings as BlockSettings } from "js-template:settings/client/js-block/sales";',
    );
    expect(code).toContain('type ImportedSettings = import("js-template:settings/client/js-block/orders").Settings;');
    expect(code).toContain(
      'type ImportedContext = import("@nocobase/runjs/js-template/client").JSBlockContext<ImportedSettings>;',
    );
    expect(code).toContain('const untouched = "js-template:settings/client/js-block/orders";');
    expect(code).toContain('// js-template:settings/client/js-block/orders');
    expect(code).not.toContain('function defineSettings<TSettings>(settings: TSettings): TSettings');
    expect(code).not.toContain('type __jsTemplateAuthoring_SDK_JSBlockContext<TSettings = unknown>');
  });

  it('relocates the current multi-file workspace and rewrites relative imports', () => {
    const files = createJsTemplateWorkspaceFromRunJS({
      kind: 'js-block',
      templateName: 'sales-kpi',
      templateTitle: 'Sales KPI',
      entryPath: 'src/main.ts',
      files: [
        {
          path: '.nocobase/runjs-source.json',
          content: '{}',
        },
        {
          path: 'src/main.ts',
          content:
            "import { helper } from './helper';\nimport { value } from '../shared/value';\nreturn helper(value);\n",
        },
        {
          path: 'src/helper.ts',
          content: 'export const helper = (value: unknown) => value;\n',
        },
        {
          path: 'shared/value.ts',
          content: 'export const value = 1;\n',
        },
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
    expect(JSON.parse(files.find((file) => file.path.endsWith('/entry.json'))?.content || '{}')).toEqual({
      schemaVersion: 1,
      key: 'sales-kpi',
      title: 'Sales KPI',
    });
    expect(files.some((file) => file.path.includes('.nocobase'))).toBe(false);
  });

  it.each([
    ['js-block', 'src/client/js-blocks', null],
    ['js-field', 'src/client/js-fields', 'js-field'],
    ['js-action', 'src/client/js-actions', null],
    ['js-item', 'src/client/js-items', null],
  ] as const)('overrides the source key when relocating %s', (kind, root, category) => {
    const settings = {
      enabled: { type: 'boolean', default: false },
      retryCount: { type: 'integer', default: 0 },
      label: { type: 'string', default: '' },
      advanced: {
        type: 'object',
        properties: {
          hiddenValue: { type: 'string', default: 'kept' },
        },
      },
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
});
