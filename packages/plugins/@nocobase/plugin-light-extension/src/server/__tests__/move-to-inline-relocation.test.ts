/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { collectAndRelocateInlineFiles } from '../services/MoveToInlineService';

// Old case -> new owner:
// move-to-inline / copies the entry descriptor together with runtime-reachable entry and shared modules -> this suite.
// move-to-inline / rewrites JS Page SDK and settings types without touching other kind imports or source text -> this suite.

const entryPath = 'src/client/js-blocks/sales/index.tsx';
const descriptorPath = 'src/client/js-blocks/sales/entry.json';

describe('move-to-inline relocation', () => {
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

  it('rewrites JS Page SDK and settings types without touching other kind imports or source text', () => {
    const pageEntryPath = 'src/client/js-pages/orders/index.tsx';
    const files = collectAndRelocateInlineFiles({
      entryPath: pageEntryPath,
      kind: 'js-page',
      files: [
        {
          path: pageEntryPath,
          content:
            'import { type JSPageContext, defineSettings } from "@nocobase/light-extension-sdk/client";\n' +
            'import type * as SDK from "@nocobase/light-extension-sdk/shared";\n' +
            'import type { Settings } from "light-extension:settings/client/js-page/orders";\n' +
            'import type { Settings as BlockSettings } from "light-extension:settings/client/js-block/sales";\n' +
            'type ImportedSettings = import("light-extension:settings/client/js-page/orders").Settings;\n' +
            'type ImportedContext = import("@nocobase/light-extension-sdk/client").JSPageContext<ImportedSettings>;\n' +
            'const untouched = "light-extension:settings/client/js-page/orders";\n' +
            '// light-extension:settings/client/js-page/orders\n' +
            'const settings = defineSettings({ enabled: true });\n' +
            'export default function render(context: JSPageContext<Settings>, shared: SDK.JSPageContext<ImportedSettings>, imported: ImportedContext, block: BlockSettings) { ctx.render([context.page, shared.page, imported.page, block, untouched]); }\n',
        },
      ],
    });

    const code = files[0]?.content || '';
    expect(code).toContain('function defineSettings(value) { return value; }');
    expect(code).not.toContain('import { defineSettings }');
    expect(code).not.toContain('@nocobase/light-extension-sdk/');
    expect(code).toContain('light-extension:settings/client/js-block/sales');
    expect(code.match(/light-extension:settings\/client\/js-page\/orders/gu)).toHaveLength(2);
    expect(code).toContain('type JSPageContext<TSettings = Record<string, unknown>>');
    expect(code).toContain('type Settings = Record<string, unknown>;');
    expect(code).toContain('declare namespace SDK');
    expect(code).toContain('export type JSPageContext<TSettings = Record<string, unknown>>');
    expect(code).toContain('type ImportedSettings = Record<string, unknown>;');
    expect(code).toContain('type ImportedContext = (typeof ctx & { settings: ImportedSettings });');
  });
});
