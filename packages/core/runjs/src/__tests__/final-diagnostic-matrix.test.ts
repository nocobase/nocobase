/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSCompileDiagnostic } from '..';
import { compileRunJSSourceWorkspace } from '../compiler';
import { createNodeRunJSTypeLibraryRegistry, type NodeRunJSTypeLibraryRegistry } from '../compiler/node-type-library';
import { inspectRunJSSourceWorkspace } from '../compiler/source-inspection';
import {
  runJSTypeScriptFinalDiagnosticMatrix,
  type RunJSTypeScriptDiagnosticCore,
  type RunJSTypeScriptFinalMatrixCase,
} from './fixtures/runjs-typescript-final-matrix';

const compilerGateCaseIds = new Set(['ordinary-valid', 'ordinary-invalid-assignment', 'react-valid-hooks-and-jsx']);

function createMatrixRegistry(): NodeRunJSTypeLibraryRegistry {
  const registry = createNodeRunJSTypeLibraryRegistry();
  registry.register({
    contentHash: 'matrix-custom-pack',
    id: 'matrix-custom',
    libraryName: 'matrixCustom',
    moduleNames: ['matrix-custom'],
    version: '1.0.0',
    load: () => ({
      dependencyFiles: [
        {
          content: 'export const answer: 42; export function greet(name: string): string;',
          contentHash: 'matrix-custom-declaration',
          path: '/node_modules/matrix-custom/index.d.ts',
        },
      ],
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
    }),
  });
  return registry;
}

function legacy(caseDefinition: RunJSTypeScriptFinalMatrixCase) {
  return caseDefinition.modelUse
    ? {
        language: caseDefinition.path.endsWith('x') ? ('tsx' as const) : ('typescript' as const),
        metadata: { modelUse: caseDefinition.modelUse },
        surfaceStyle: 'action' as const,
        version: 'v2',
      }
    : undefined;
}

function inspect(
  caseDefinition: RunJSTypeScriptFinalMatrixCase,
  registry: NodeRunJSTypeLibraryRegistry,
): RunJSCompileDiagnostic[] {
  return inspectRunJSSourceWorkspace({
    entry: caseDefinition.path,
    files: [{ content: caseDefinition.source, path: caseDefinition.path }],
    legacy: legacy(caseDefinition),
    surfaceStyle: 'action',
    typeLibraryIds: caseDefinition.typeLibraryIds,
    typeLibraryRegistry: registry,
  });
}

function expectDiagnosticCore(
  diagnostics: readonly RunJSCompileDiagnostic[],
  expected: readonly RunJSTypeScriptDiagnosticCore[],
) {
  expect(diagnostics).toHaveLength(expected.length);
  for (const expectation of expected) {
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringMatching(
            new RegExp(
              expectation.messageIncludes
                .map(escapeRegExp)
                .map((part) => `(?=.*${part})`)
                .join(''),
              's',
            ),
          ),
          details: expect.objectContaining({ tsCode: expectation.tsCode }),
        }),
      ]),
    );
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('RunJS final shared TypeScript diagnostic matrix', () => {
  it.each(runJSTypeScriptFinalDiagnosticMatrix)('matches Node source inspection for $id', (caseDefinition) => {
    const registry = createMatrixRegistry();
    try {
      expectDiagnosticCore(inspect(caseDefinition, registry), caseDefinition.expectedDiagnostics);
    } finally {
      registry.dispose();
    }
  });

  it.each(runJSTypeScriptFinalDiagnosticMatrix.filter((caseDefinition) => compilerGateCaseIds.has(caseDefinition.id)))(
    'matches the compiler gate for $id',
    async (caseDefinition) => {
      const result = await compileRunJSSourceWorkspace({
        entry: caseDefinition.path,
        files: [{ content: caseDefinition.source, path: caseDefinition.path }],
        legacy: legacy(caseDefinition),
        surfaceStyle: 'action',
      });

      expectDiagnosticCore(result.artifact.diagnostics, caseDefinition.expectedDiagnostics);
      expect(result.failureCode).toBe(caseDefinition.expectedDiagnostics.length ? 'RUNJS_COMPILE_FAILED' : undefined);
    },
  );
});
