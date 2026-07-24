/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { loadNodeRunJSTypeLibraryFiles } from '../compiler/node-type-library';

describe('RunJS Node dayjs and lodash declarations', () => {
  it('loads only requested closures and reuses cached declaration files', () => {
    const request = { kind: 'library' as const, libraryName: 'dayjs', packId: 'dayjs' };
    const none = loadNodeRunJSTypeLibraryFiles([]);
    const dayjsFirst = loadNodeRunJSTypeLibraryFiles([request]);
    const dayjsSecond = loadNodeRunJSTypeLibraryFiles([request]);
    const lodashOnly = loadNodeRunJSTypeLibraryFiles([{ kind: 'library', libraryName: 'lodash', packId: 'lodash' }]);

    expect(none).toEqual({ dependencyFiles: [], rootFiles: [] });
    expect(dayjsFirst.rootFiles.map((file) => file.path)).toEqual(['/__runjs__/type-packs/dayjs-bridge.d.ts']);
    expect(dayjsFirst.dependencyFiles.some((file) => file.path.includes('/@types/lodash/'))).toBe(false);
    expect(dayjsSecond.rootFiles[0]).toBe(dayjsFirst.rootFiles[0]);
    expect(dayjsSecond.dependencyFiles[0]).toBe(dayjsFirst.dependencyFiles[0]);
    expect(lodashOnly.rootFiles.map((file) => file.path)).toEqual(['/__runjs__/type-packs/lodash-bridge.d.ts']);
    expect(lodashOnly.dependencyFiles.some((file) => file.path.includes('/dayjs/'))).toBe(false);
  });
});
