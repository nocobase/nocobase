/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { loadNodeRunJSTypeLibraryFiles } from '../compiler/node-type-library';

describe('RunJS Node mathjs and Formula.js declarations', () => {
  it('loads the two official declaration closures independently', () => {
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
