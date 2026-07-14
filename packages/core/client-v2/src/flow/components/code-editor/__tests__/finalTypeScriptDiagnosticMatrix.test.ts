/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPack } from '@nocobase/runjs/client-v2';
import { afterEach, describe, expect, it } from 'vitest';

import {
  runJSTypeScriptFinalDiagnosticMatrix,
  type RunJSTypeScriptDiagnosticCore,
} from '../../../../../../runjs/src/__tests__/fixtures/runjs-typescript-final-matrix';
import {
  clearTypeScriptProjectCachesForTests,
  createTypeScriptProjectSession,
  type CodeEditorTypeScriptDiagnostic,
} from '../typescriptProject';
import {
  clearRunJSTypeLibraryPackRegistryForTests,
  createRunJSTypeLibraryRegistry,
} from '../typescriptLibraryRegistry';

function customPack(): RunJSTypeLibraryPack {
  return {
    contentHash: 'matrix-custom-pack',
    dependencies: [],
    dependencyFiles: [
      {
        content: 'export const answer: 42; export function greet(name: string): string;',
        contentHash: 'matrix-custom-declaration',
        path: '/node_modules/matrix-custom/index.d.ts',
      },
    ],
    id: 'matrix-custom',
    libraryName: 'matrixCustom',
    rootFiles: [
      {
        content: `
type RunJSMatrixCustomLibrary = typeof import('matrix-custom');
interface RunJSLibraries { matrixCustom: RunJSMatrixCustomLibrary; }
`,
        contentHash: 'matrix-custom-bridge',
        path: '/__runjs__/matrix-custom-bridge.d.ts',
      },
    ],
    version: '1.0.0',
  };
}

function expectDiagnosticCore(
  diagnostics: readonly CodeEditorTypeScriptDiagnostic[],
  expected: readonly RunJSTypeScriptDiagnosticCore[],
): void {
  expect(diagnostics).toHaveLength(expected.length);
  for (const expectation of expected) {
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: expectation.tsCode,
          message: expect.stringMatching(
            new RegExp(
              expectation.messageIncludes
                .map(escapeRegExp)
                .map((part) => `(?=.*${part})`)
                .join(''),
              's',
            ),
          ),
        }),
      ]),
    );
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

afterEach(() => {
  clearTypeScriptProjectCachesForTests();
  clearRunJSTypeLibraryPackRegistryForTests();
});

describe('RunJS final browser TypeScript diagnostic matrix', () => {
  it('matches the shared Node diagnostic codes and stable message fragments', async () => {
    const registry = createRunJSTypeLibraryRegistry();
    registry.register({
      contentHash: 'matrix-custom-pack',
      id: 'matrix-custom',
      libraryName: 'matrixCustom',
      loader: () => customPack(),
      moduleNames: ['matrix-custom'],
      version: '1.0.0',
    });
    const session = createTypeScriptProjectSession();

    try {
      for (const caseDefinition of runJSTypeScriptFinalDiagnosticMatrix) {
        const diagnostics = (await session.getDiagnostics({
          currentFilePath: caseDefinition.path,
          files: [{ content: caseDefinition.source, path: caseDefinition.path }],
          runJSContext: caseDefinition.modelUse ? { modelUse: caseDefinition.modelUse } : undefined,
          typeLibraryIds: [...(caseDefinition.typeLibraryIds || [])],
          typeLibraryRegistry: registry,
        })) as CodeEditorTypeScriptDiagnostic[];

        try {
          expectDiagnosticCore(diagnostics, caseDefinition.expectedDiagnostics);
        } catch (error) {
          throw new Error(`Browser diagnostic matrix case failed: ${caseDefinition.id}`, { cause: error });
        }
      }
    } finally {
      session.dispose();
      registry.dispose();
    }
  });
});
