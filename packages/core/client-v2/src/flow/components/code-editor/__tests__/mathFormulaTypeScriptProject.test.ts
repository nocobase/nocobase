/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Diagnostic } from '@codemirror/lint';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import {
  shutdownTypeScriptProjectSessionSuite,
  withTypeScriptProjectSession,
} from './helpers/withTypeScriptProjectSession';
import { generatedRunJSTypeLibraryPackManifest } from '../type-packs/generated/manifest';
import {
  clearRunJSTypeLibraryPackRegistryForTests,
  getRunJSTypeLibraryPackRegistryDebugState,
} from '../typescriptLibraryRegistry';
import { clearTypeScriptProjectCachesForTests } from '../typescriptProject';

function errorMessages(diagnostics: Diagnostic[]): string[] {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'error').map((diagnostic) => diagnostic.message);
}

function project(code: string) {
  return {
    currentFilePath: 'src/main.ts',
    files: [{ path: 'src/main.ts', content: code }],
  };
}

afterEach(() => {
  clearRunJSTypeLibraryPackRegistryForTests();
  clearTypeScriptProjectCachesForTests();
});

afterAll(shutdownTypeScriptProjectSessionSuite);

describe('RunJS official mathjs and Formula.js TypeScript project', () => {
  it('uses official expression, matrix, numeric, and spreadsheet formula types', async () => {
    const code = `
const evaluated = ctx.libs.math.evaluate('2 + 3');
const rounded: number = ctx.libs.math.round(2.345, 2);
const matrix = ctx.libs.math.matrix([[1, 2], [3, 4]]);
const matrixSize: number[] = matrix.size();
const total: number = ctx.libs.formula.SUM(1, 2, 3);
const average: number = ctx.libs.formula.AVERAGE(1, 2, 3);
const { round } = ctx.libs.math;
const { ABS } = ctx.libs.formula;
const absolute: number | Error = ABS(-5);
void evaluated;
void rounded;
void matrixSize;
void total;
void average;
void round;
void absolute;
`;
    await withTypeScriptProjectSession(async (session) => {
      expect(errorMessages(await session.getDiagnostics(project(code), code))).toEqual([]);
      expect(getRunJSTypeLibraryPackRegistryDebugState().loadingPackCount).toBe(2);
      const state = session.getDebugState();
      expect(state.rootFileNames).toContain('/__runjs__/type-packs/mathjs-bridge.d.ts');
      expect(state.rootFileNames).toContain('/__runjs__/type-packs/formulajs-bridge.d.ts');
    });
  });

  it('reports official invalid calls and misspelled members', async () => {
    const code = `
ctx.libs.math.evaluate();
ctx.libs.math.round('2.5', 2);
ctx.libs.math.matrx([[1, 2]]);
ctx.libs.formula.ABS();
ctx.libs.formula.ROUND(1);
ctx.libs.formula.AVERGE(1, 2);
`;
    await withTypeScriptProjectSession(async (session) => {
      const messages = errorMessages(await session.getDiagnostics(project(code), code));

      expect(messages.some((message) => /Expected 1-2 arguments/.test(message))).toBe(true);
      expect(messages.some((message) => /No overload matches this call/.test(message))).toBe(true);
      expect(messages.some((message) => /matrx/.test(message))).toBe(true);
      expect(messages.some((message) => /ABS|Expected 1 arguments/.test(message))).toBe(true);
      expect(messages.some((message) => /AVERGE/.test(message))).toBe(true);
    });
  });

  it('records independent manifest contracts', () => {
    expect(generatedRunJSTypeLibraryPackManifest).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'mathjs', sourcePackage: 'mathjs', rootFileCount: 1 }),
        expect.objectContaining({
          id: 'formulajs',
          sourcePackage: '@formulajs/formulajs',
          rootFileCount: 1,
        }),
      ]),
    );
  });
});
