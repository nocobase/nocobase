/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ts from 'typescript';

import { generateClientSettingsTypes } from '../typegen';

describe('JS Template settings type generation across Templates', () => {
  it('isolates the same key across kinds and reports duplicates within one kind', () => {
    const result = generateClientSettingsTypes({
      files: [
        entry('js-blocks', 'one', 'shared', 'title'),
        entry('js-actions', 'two', 'shared', 'confirm'),
        entry('js-blocks', 'duplicate', 'shared', 'other'),
      ],
    });

    expect(result.templates.map((item) => item.entryKey)).toEqual([
      'client/js-action/shared',
      'client/js-block/shared',
    ]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: 'settings_typegen_entry_key_duplicate', kind: 'js-block' }),
    ]);
    const block = result.files.find((file) => file.path.includes('/js-block/shared.d.ts'))?.content || '';
    const action = result.files.find((file) => file.path.includes('/js-action/shared.d.ts'))?.content || '';
    expect(block).toContain('other?: string;');
    expect(block).not.toContain('title');
    expect(block).not.toContain('confirm');
    expect(action).toContain('confirm?: string;');
    expect(action).not.toContain('title');
  });

  it('keeps normalized identifier collisions isolated and generates order-independent declarations', () => {
    const files = [
      entry('js-blocks', 'single-hyphen', 'a-b', 'singleHyphen', 'string'),
      entry('js-blocks', 'double-hyphen', 'a--b', 'doubleHyphen', 'number'),
      entry('js-blocks', 'hyphen-number', 'a-1', 'hyphenNumber', 'boolean'),
      entry('js-blocks', 'plain-number', 'a1', 'plainNumber', 'string'),
      entry('js-actions', 'same-key-other-kind', 'a-b', 'actionValue', 'number'),
    ];
    const result = generateClientSettingsTypes({ files });
    const shuffled = generateClientSettingsTypes({ files: [files[3], files[0], files[4], files[1], files[2]] });

    expect(result.diagnostics).toEqual([]);
    expect(shuffled.diagnostics).toEqual([]);
    expect(shuffled.files).toEqual(result.files);

    const index = result.files.find((file) => file.path.endsWith('/index.d.ts'))?.content || '';
    expect(index).not.toContain('import type { Settings as');
    expect(index).toContain('"client/js-block/a-b": import("./client/js-block/a-b").Settings;');
    expect(index).toContain('"client/js-block/a--b": import("./client/js-block/a--b").Settings;');
    expect(index).toContain('"client/js-block/a-1": import("./client/js-block/a-1").Settings;');
    expect(index).toContain('"client/js-block/a1": import("./client/js-block/a1").Settings;');
    expect(index).toContain('"client/js-action/a-b": import("./client/js-action/a-b").Settings;');

    const diagnostics = getTypeScriptDiagnostics([
      ...result.files,
      {
        path: 'consumer.ts',
        content: [
          'import type { JsTemplateSettings } from "./.js-template/types/index";',
          'declare const singleHyphen: JsTemplateSettings<"client/js-block/a-b">;',
          'declare const doubleHyphen: JsTemplateSettings<"client/js-block/a--b">;',
          'declare const hyphenNumber: JsTemplateSettings<"client/js-block/a-1">;',
          'declare const plainNumber: JsTemplateSettings<"client/js-block/a1">;',
          'declare const action: JsTemplateSettings<"client/js-action/a-b">;',
          'const singleHyphenValue: string | undefined = singleHyphen.singleHyphen;',
          'const doubleHyphenValue: number | undefined = doubleHyphen.doubleHyphen;',
          'const hyphenNumberValue: boolean | undefined = hyphenNumber.hyphenNumber;',
          'const plainNumberValue: string | undefined = plainNumber.plainNumber;',
          'const actionValue: number | undefined = action.actionValue;',
          'export { actionValue, doubleHyphenValue, hyphenNumberValue, plainNumberValue, singleHyphenValue };',
          '',
        ].join('\n'),
      },
    ]);
    expect(diagnostics).toEqual([]);
  });
});

function entry(kindRoot: string, directoryName: string, key: string, propertyName: string, propertyType = 'string') {
  return {
    path: `src/client/${kindRoot}/${directoryName}/entry.json`,
    content: JSON.stringify({
      key,
      settings: { [propertyName]: { type: propertyType } },
    }),
  };
}

function getTypeScriptDiagnostics(files: Array<{ path: string; content: string }>): string[] {
  const fileMap = new Map(files.map((file) => [`/${file.path}`, file.content]));
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    noLib: true,
    skipLibCheck: true,
    strictNullChecks: true,
    target: ts.ScriptTarget.ES2020,
    types: [],
  };
  const service = ts.createLanguageService({
    directoryExists(directoryName) {
      return Array.from(fileMap.keys()).some((path) => path.startsWith(`${directoryName.replace(/\/$/, '')}/`));
    },
    fileExists: (fileName) => fileMap.has(fileName),
    getCompilationSettings: () => options,
    getCurrentDirectory: () => '/',
    getDefaultLibFileName: () => 'lib.d.ts',
    getDirectories: () => [],
    getScriptFileNames: () => Array.from(fileMap.keys()),
    getScriptSnapshot(fileName) {
      const content = fileMap.get(fileName);
      return typeof content === 'string' ? ts.ScriptSnapshot.fromString(content) : undefined;
    },
    getScriptVersion: () => '1',
    readFile: (fileName) => fileMap.get(fileName),
  });
  return Array.from(fileMap.keys()).flatMap((fileName) =>
    service
      .getSemanticDiagnostics(fileName)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
  );
}
