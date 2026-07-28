/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  appendRunDiagnostics,
  buildRunJSImportModuleCompletionSignature,
  buildRunJSTypeScriptProject,
} from '../studioUtils';
import type { RunJSWorkspaceFile } from '../types';
import { runJSManifestPath } from '../workspaceUtils';

function workspaceFile(path: string, content = ''): RunJSWorkspaceFile {
  return { content, path };
}

describe('buildRunJSTypeScriptProject', () => {
  it('uses file revisions when available and content as the compatibility fallback', () => {
    expect(
      buildRunJSImportModuleCompletionSignature([workspaceFile('src/client/helper.ts', 'one')], 'src/client/index.tsx'),
    ).not.toBe(
      buildRunJSImportModuleCompletionSignature([workspaceFile('src/client/helper.ts', 'two')], 'src/client/index.tsx'),
    );
    expect(
      buildRunJSImportModuleCompletionSignature(
        [{ ...workspaceFile('src/client/helper.ts', 'one'), revision: 1 }],
        'src/client/index.tsx',
      ),
    ).toBe(
      buildRunJSImportModuleCompletionSignature(
        [{ ...workspaceFile('src/client/helper.ts', 'two'), revision: 1 }],
        'src/client/index.tsx',
      ),
    );
  });

  it('returns no project when the active file is missing or is not a TypeScript project file', () => {
    const files = [workspaceFile('src/main.ts', 'export const value = 1;'), workspaceFile('src/data.json', '{}')];

    expect(buildRunJSTypeScriptProject(files)).toBeUndefined();
    expect(buildRunJSTypeScriptProject(files, files[1])).toBeUndefined();
  });

  it('builds a multi-file project with source and JSON files while excluding manifest and non-code assets', () => {
    const activeFile = workspaceFile('src/main.tsx', "import data from './data.json';\nexport default data;");
    const files = [
      activeFile,
      workspaceFile('src/helper.ts', 'export const helper = 42;'),
      workspaceFile('src/component.jsx', 'export const Component = () => null;'),
      workspaceFile('src/data.json', '{"enabled":true}'),
      workspaceFile('src/styles.css', '.root {}'),
      workspaceFile('README.md', '# Workspace'),
      workspaceFile(runJSManifestPath, '{"entry":"src/main.tsx"}'),
    ];

    expect(buildRunJSTypeScriptProject(files, activeFile)).toEqual({
      currentFilePath: 'src/main.tsx',
      forbidTypeScriptSuppressionDirectives: true,
      ignoredDiagnosticCodes: [1108],
      rewriteBuiltInAutoImports: true,
      suppressUnknownTypeDiagnostics: true,
      typeLibraryIds: ['react'],
      files: [
        { content: activeFile.content, path: activeFile.path },
        { content: 'export const helper = 42;', path: 'src/helper.ts' },
        { content: 'export const Component = () => null;', path: 'src/component.jsx' },
        { content: '{"enabled":true}', path: 'src/data.json' },
      ],
    });
  });

  it('forwards the RunJS model and global context types to the editor project', () => {
    const activeFile = workspaceFile('src/main.ts', 'ctx.model;');

    expect(
      buildRunJSTypeScriptProject([activeFile], activeFile, {
        declarationFiles: [workspaceFile('types/context.d.ts', 'type CustomRunJSContext = RunJSContext;')],
        globalContextType: 'CustomRunJSContext',
        modelUse: 'JSFieldModel',
      }),
    ).toEqual({
      currentFilePath: 'src/main.ts',
      declarationFiles: [{ content: 'type CustomRunJSContext = RunJSContext;', path: 'types/context.d.ts' }],
      forbidTypeScriptSuppressionDirectives: true,
      ignoredDiagnosticCodes: [1108],
      rewriteBuiltInAutoImports: true,
      suppressUnknownTypeDiagnostics: true,
      typeLibraryIds: ['react'],
      files: [{ content: 'ctx.model;', path: 'src/main.ts' }],
      runJSContext: {
        globalContextType: 'CustomRunJSContext',
        modelUse: 'JSFieldModel',
      },
    });
  });
});

describe('appendRunDiagnostics', () => {
  it('shows a captured render error once in the Studio console', () => {
    const appendConsole = vi.fn();

    appendRunDiagnostics(
      {
        execution: { finished: true, started: true, timeout: false },
        issues: [{ type: 'runtime', ruleId: 'render-error', message: 'rawData.some is not a function' }],
        logs: [{ level: 'error', message: 'rawData.some is not a function' }],
      },
      appendConsole,
    );

    expect(appendConsole).toHaveBeenCalledTimes(1);
    expect(appendConsole).toHaveBeenCalledWith({
      column: undefined,
      level: 'error',
      line: undefined,
      message: 'rawData.some is not a function',
      path: undefined,
    });
  });
});
