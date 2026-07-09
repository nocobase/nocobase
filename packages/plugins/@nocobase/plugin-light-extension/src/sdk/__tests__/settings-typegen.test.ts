/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ts from 'typescript';

import { generateClientSettingsTypes } from '../settings-typegen';

describe('light extension settings typegen', () => {
  it('generates a namespaced client entry settings type file and registry', () => {
    const result = generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/product-list/settings.json',
          content: JSON.stringify({
            type: 'object',
            required: ['collection'],
            properties: {
              title: {
                type: 'string',
                default: 'Products',
              },
              collection: {
                type: 'string',
                'x-component': 'CollectionSelect',
              },
              pageSize: {
                type: 'integer',
                minimum: 1,
                maximum: 20,
                default: 5,
              },
              highlight: {
                type: 'boolean',
                default: true,
              },
            },
          }),
        },
      ],
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.files.map((file) => file.path)).toEqual([
      '.light-extension/types/client/js-block/product-list.d.ts',
      '.light-extension/types/modules.d.ts',
      '.light-extension/types/index.d.ts',
      '.light-extension/types/settings.d.ts',
    ]);
    expect(result.files[0].content).toContain('import type { JSBlockContext }');
    expect(result.files[0].content).toContain('virtualImport: "light-extension:settings/client/js-block/product-list"');
    expect(result.files[0].content).toContain('title: string;');
    expect(result.files[0].content).toContain('collection: string;');
    expect(result.files[0].content).toContain('pageSize: number;');
    expect(result.files[0].content).toContain('highlight: boolean;');
    expect(result.files[1].content).toContain('declare module "light-extension:settings/client/js-block/product-list"');
    expect(result.files[2].content).toContain('"client/js-block/product-list": ClientJsBlockProductListSettings;');
    expect(result.files[3].content).toContain('ClientJsBlockProductListSettings');
  });

  it('generates virtual modules that resolve namespaced settings imports in the browser authoring project', () => {
    const result = generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/product-list/settings.json',
          content: '{"type":"object","properties":{"title":{"type":"string"}}}',
        },
      ],
    });
    const diagnostics = getTypeScriptDiagnostics([
      ...result.files,
      {
        path: 'src/shared/light-extension-sdk.d.ts',
        content:
          'declare module "@nocobase/light-extension-sdk/client" { export interface JSBlockContext<TSettings = unknown> { settings: TSettings; } }',
      },
      {
        path: 'src/client/js-blocks/product-list/index.tsx',
        content:
          'import type { Settings } from "light-extension:settings/client/js-block/product-list";\nconst settings: Settings = { title: "Products" };\nsettings.title;\n',
      },
    ]);

    expect(diagnostics).toEqual([]);
  });

  it('reports ambiguous and stale settings type paths in preview diagnostics', () => {
    const result = generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/product-list/index.tsx',
          content: 'import type { Settings } from "light-extension:settings/product-list";\n',
        },
        {
          path: '.light-extension/types/client/js-block/deleted-entry.d.ts',
          content: 'export interface Settings {}\n',
        },
        {
          path: 'src/client/js-blocks/product-list/settings.json',
          content: '{"type":"object","properties":{"title":{"type":"string"}}}',
        },
      ],
    });

    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining(['settings_type_import_ambiguous', 'settings_type_stale_file']),
    );
  });

  it('reports ambiguous settings import type references in preview diagnostics', () => {
    const result = generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/product-list/index.tsx',
          content:
            'type ProductSettings = import("light-extension:settings/client/js-block/product-list").Settings;\ntype AmbiguousSettings = import("light-extension:settings/product-list").Settings;\n',
        },
        {
          path: 'src/client/js-blocks/product-list/settings.json',
          content: '{"type":"object","properties":{"title":{"type":"string"}}}',
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: 'settings_type_import_ambiguous',
        details: {
          specifier: 'light-extension:settings/product-list',
        },
      }),
    ]);
  });
});

function getTypeScriptDiagnostics(files: Array<{ path: string; content: string }>): string[] {
  const fileMap = new Map(files.map((file) => [`/${file.path}`, file.content]));
  const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    noLib: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    types: [],
  };
  const service = ts.createLanguageService({
    directoryExists(directoryName) {
      const normalizedDirectory = directoryName.replace(/\/$/, '');
      return Array.from(fileMap.keys()).some((path) => path.startsWith(`${normalizedDirectory}/`));
    },
    fileExists(fileName) {
      return fileMap.has(fileName);
    },
    getCompilationSettings() {
      return compilerOptions;
    },
    getCurrentDirectory() {
      return '/';
    },
    getDefaultLibFileName() {
      return 'lib.d.ts';
    },
    getDirectories() {
      return [];
    },
    getScriptFileNames() {
      return Array.from(fileMap.keys());
    },
    getScriptSnapshot(fileName) {
      const content = fileMap.get(fileName);
      return typeof content === 'string' ? ts.ScriptSnapshot.fromString(content) : undefined;
    },
    getScriptVersion() {
      return '1';
    },
    readFile(fileName) {
      return fileMap.get(fileName);
    },
  });

  return Array.from(fileMap.keys()).flatMap((fileName) =>
    service
      .getSemanticDiagnostics(fileName)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
  );
}
