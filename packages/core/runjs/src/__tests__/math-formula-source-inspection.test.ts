/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { inspectRunJSSourceWorkspace } from '../compiler';
import { loadNodeRunJSTypeLibraryFiles } from '../compiler/node-type-library';

function inspect(code: string) {
  return inspectRunJSSourceWorkspace({
    entry: 'src/main.ts',
    files: [{ path: 'src/main.ts', content: code }],
    surfaceStyle: 'action',
  });
}

describe('RunJS Node official mathjs and Formula.js source inspection', () => {
  it('matches browser official types for valid usage', () => {
    expect(
      inspect(`
const rounded: number = ctx.libs.math.round(2.345, 2);
const matrix = ctx.libs.math.matrix([[1, 2], [3, 4]]);
const matrixSize: number[] = matrix.size();
const total: number = ctx.libs.formula.SUM(1, 2, 3);
const average: number = ctx.libs.formula.AVERAGE(1, 2, 3);
void rounded;
void matrixSize;
void total;
void average;
`),
    ).toEqual([]);
  });

  it('reports official member and argument diagnostics', () => {
    const messages = inspect(`
ctx.libs.math.evaluate();
ctx.libs.math.round('2.5', 2);
ctx.libs.math.matrx([[1, 2]]);
ctx.libs.formula.ABS();
ctx.libs.formula.AVERGE(1, 2);
`).map((diagnostic) => diagnostic.message);

    expect(messages.some((message) => /Expected 1-2 arguments/.test(message))).toBe(true);
    expect(messages.some((message) => /No overload matches this call/.test(message))).toBe(true);
    expect(messages.some((message) => /matrx/.test(message))).toBe(true);
    expect(messages.some((message) => /ABS|Expected 1 arguments/.test(message))).toBe(true);
    expect(messages.some((message) => /AVERGE/.test(message))).toBe(true);
  });

  it('loads mathjs and Formula.js closures independently', () => {
    const mathOnly = loadNodeRunJSTypeLibraryFiles([{ kind: 'library', libraryName: 'math', packId: 'mathjs' }]);
    const formulaOnly = loadNodeRunJSTypeLibraryFiles([
      { kind: 'library', libraryName: 'formula', packId: 'formulajs' },
    ]);

    expect(mathOnly.rootFiles.map((file) => file.path)).toEqual(['/__runjs__/type-packs/mathjs-bridge.d.ts']);
    expect(mathOnly.dependencyFiles.some((file) => file.path.includes('/@formulajs/formulajs/'))).toBe(false);
    expect(formulaOnly.rootFiles.map((file) => file.path)).toEqual(['/__runjs__/type-packs/formulajs-bridge.d.ts']);
    expect(formulaOnly.dependencyFiles.some((file) => file.path.includes('/mathjs/'))).toBe(false);
  });
});
