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

describe('RunJS Node official dayjs and lodash source inspection', () => {
  it('matches browser official types for valid usage', () => {
    expect(
      inspect(`
const date = ctx.dayjs('2026-07-14').add(1, 'day');
const label: string = ctx.libs.dayjs(date).format('YYYY-MM-DD');
const record = { profile: { name: 'Ada' } };
const name: string = ctx.libs.lodash.get(record, 'profile.name');
const debounced = ctx.libs.lodash.debounce((value: number) => value + 1, 10);
debounced.cancel();
const flushed: number | undefined = debounced.flush();
void label;
void name;
void flushed;
`),
    ).toEqual([]);
  });

  it('reports official errors and keeps unavailable dayjs plugins hidden', () => {
    const messages = inspect(`
ctx.libs.dayjs().formatt('YYYY');
ctx.dayjs.utc();
ctx.libs.lodash.clonDeep({ value: 1 });
ctx.libs.lodash.debounce(123, 10);
`).map((diagnostic) => diagnostic.message);

    expect(messages.some((message) => /formatt/.test(message))).toBe(true);
    expect(messages.some((message) => /utc/.test(message))).toBe(true);
    expect(messages.some((message) => /clonDeep/.test(message))).toBe(true);
    expect(messages.some((message) => /number|callable|Function/.test(message))).toBe(true);
  });

  it('loads only requested Node declaration closures', () => {
    const none = loadNodeRunJSTypeLibraryFiles([]);
    const dayjsOnly = loadNodeRunJSTypeLibraryFiles([{ kind: 'library', libraryName: 'dayjs', packId: 'dayjs' }]);
    const lodashOnly = loadNodeRunJSTypeLibraryFiles([{ kind: 'library', libraryName: 'lodash', packId: 'lodash' }]);

    expect(none).toEqual({ dependencyFiles: [], rootFiles: [] });
    expect(dayjsOnly.rootFiles.map((file) => file.path)).toEqual(['/__runjs__/type-packs/dayjs-bridge.d.ts']);
    expect(dayjsOnly.dependencyFiles.some((file) => file.path.includes('/@types/lodash/'))).toBe(false);
    expect(lodashOnly.rootFiles.map((file) => file.path)).toEqual(['/__runjs__/type-packs/lodash-bridge.d.ts']);
    expect(lodashOnly.dependencyFiles.some((file) => file.path.includes('/dayjs/'))).toBe(false);
  });
});
