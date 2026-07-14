/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Diagnostic } from '@codemirror/lint';
import { afterEach, describe, expect, it } from 'vitest';

import { generatedRunJSTypeLibraryPackManifest } from '../type-packs/generated/manifest';
import {
  clearRunJSTypeLibraryPackRegistryForTests,
  getRunJSTypeLibraryPackRegistryDebugState,
} from '../typescriptLibraryRegistry';
import { clearTypeScriptProjectCachesForTests, createTypeScriptProjectSession } from '../typescriptProject';

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

describe('RunJS official dayjs and lodash TypeScript project', () => {
  it('uses official callable, instance, overload, generic, and debounce types', async () => {
    const code = `
const date = ctx.dayjs('2026-07-14').add(2, 'day');
const sameDate = ctx.libs.dayjs(date);
const label: string = sameDate.format('YYYY-MM-DD');
const record = { profile: { name: 'Ada' }, count: 1 };
const name: string = ctx.libs.lodash.get(record, 'profile.name');
const cloned = ctx.libs.lodash.cloneDeep(record);
const updated = ctx.libs.lodash.set(cloned, 'count', 2);
const debounced = ctx.libs.lodash.debounce((value: number) => value + updated.count, 20);
debounced.cancel();
const flushed: number | undefined = debounced.flush();
void label;
void name;
void flushed;
`;
    const session = createTypeScriptProjectSession();

    expect(errorMessages(await session.getDiagnostics(project(code), code))).toEqual([]);
    expect(getRunJSTypeLibraryPackRegistryDebugState().loadingPackCount).toBe(2);
    const state = session.getDebugState();
    expect(state.rootFileNames).toContain('/__runjs__/type-packs/dayjs-bridge.d.ts');
    expect(state.rootFileNames).toContain('/__runjs__/type-packs/lodash-bridge.d.ts');
  });

  it('reports official invalid calls, misspelled members, and unavailable dayjs plugins', async () => {
    const code = `
ctx.dayjs().add('two', 'day');
ctx.libs.dayjs().formatt('YYYY');
ctx.dayjs.utc();
ctx.libs.lodash.clonDeep({ value: 1 });
ctx.libs.lodash.debounce(123, 20);
const count: number = ctx.libs.lodash.get({ name: 'Ada' }, 'name');
`;
    const session = createTypeScriptProjectSession();
    const messages = errorMessages(await session.getDiagnostics(project(code), code));

    expect(messages.some((message) => /formatt/.test(message))).toBe(true);
    expect(messages.some((message) => /utc/.test(message))).toBe(true);
    expect(messages.some((message) => /clonDeep/.test(message))).toBe(true);
    expect(messages.some((message) => /number|callable|Function/.test(message))).toBe(true);
    expect(messages.some((message) => /string/.test(message) && /number/.test(message))).toBe(true);
  });

  it('records installed versions and keeps the loaders declaration-body free', async () => {
    expect(generatedRunJSTypeLibraryPackManifest).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'dayjs', sourcePackage: 'dayjs', version: '1.11.13', rootFileCount: 1 }),
        expect.objectContaining({ id: 'lodash', sourcePackage: '@types/lodash', version: '4.17.24', rootFileCount: 1 }),
      ]),
    );
    const loaderSource = await import('../type-packs/generated/loaders?raw').then((module) => module.default as string);
    expect(loaderSource).not.toContain('interface Dayjs');
    expect(loaderSource).not.toContain('interface LoDashStatic');
  });
});
