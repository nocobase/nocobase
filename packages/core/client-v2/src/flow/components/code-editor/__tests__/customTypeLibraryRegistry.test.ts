/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPack } from '@nocobase/runjs/client-v2';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { withTypeScriptProjectSession } from './helpers/withTypeScriptProjectSession';
import type { CodeEditorTypeScriptProject } from '../typescriptProject';
import {
  clearRunJSTypeLibraryPackRegistryForTests,
  createRunJSTypeLibraryRegistry,
  type RunJSTypeLibraryRegistry,
} from '../typescriptLibraryRegistry';

const bridge = `
type RunJSFakeLibrary = typeof import('fake-lib');
interface RunJSLibraries { fakeLib: RunJSFakeLibrary; }
interface RunJSContext { fakeLib: RunJSFakeLibrary; }
`;

function fakePack(version = '1.0.0', answer = 42): RunJSTypeLibraryPack {
  return {
    contentHash: `fake-pack-${version}`,
    dependencies: [],
    dependencyFiles: [
      {
        content: '{"name":"fake-lib","types":"index.d.ts"}',
        contentHash: 'fake-package-json',
        path: '/node_modules/fake-lib/package.json',
      },
      {
        content: `export const answer: ${answer}; export function greet(name: string): string;`,
        contentHash: `fake-declaration-${answer}`,
        path: '/node_modules/fake-lib/index.d.ts',
      },
    ],
    id: 'fake-lib',
    libraryName: 'fakeLib',
    rootFiles: [{ content: bridge, contentHash: 'fake-bridge', path: '/__runjs__/fake-lib-bridge.d.ts' }],
    version,
  };
}

function registerFake(registry: RunJSTypeLibraryRegistry, loader = vi.fn(() => fakePack())): typeof loader {
  registry.register({
    completionCatalog: () => [{ label: 'greet', type: 'function' }],
    contentHash: 'fake-pack-1.0.0',
    id: 'fake-lib',
    libraryName: 'fakeLib',
    loader,
    moduleNames: ['fake-lib'],
    version: '1.0.0',
  });
  return loader;
}

function project(
  code: string,
  registry: RunJSTypeLibraryRegistry,
  typeLibraryIds?: string[],
): CodeEditorTypeScriptProject {
  return {
    currentFilePath: 'src/main.ts',
    files: [{ content: code, path: 'src/main.ts' }],
    typeLibraryIds,
    typeLibraryRegistry: registry,
  };
}

afterEach(() => clearRunJSTypeLibraryPackRegistryForTests());

describe('custom RunJS TypeScript library registry', () => {
  it('loads a fake library on demand with completion, hover, and diagnostics', async () => {
    const registry = createRunJSTypeLibraryRegistry();
    const loader = registerFake(registry);
    await withTypeScriptProjectSession(async (session) => {
      expect(await session.getDiagnostics(project('ctx.logger.info("ready");', registry))).toEqual([]);
      expect(loader).not.toHaveBeenCalled();

      const code = 'ctx.libs.fakeLib.greet("Ada"); ctx.libs.fakeLib.';
      const completion = await session.getCompletionResult(project(code, registry), code.length, code, true);
      expect(completion?.options.some((option) => option.label === 'answer')).toBe(true);
      expect(completion?.options.some((option) => option.label === 'greet')).toBe(true);
      const hover = await session.getHover(project(code, registry), code.indexOf('greet') + 2, code);
      expect(`${hover?.detail}\n${hover?.message}`).toContain('greet');
      expect(await session.getDiagnostics(project('ctx.libs.fakeLib.greet(1);', registry))).toEqual([
        expect.objectContaining({ message: expect.stringMatching(/string/) }),
      ]);
      expect(loader).toHaveBeenCalledTimes(1);
      expect(await registry.loadCompletionCatalog('fake-lib')).toEqual([{ label: 'greet', type: 'function' }]);
    });
  });

  it('supports explicit ids while preserving declarationFiles and unknown libraries', async () => {
    const registry = createRunJSTypeLibraryRegistry();
    const loader = registerFake(registry);
    const explicit = project('ctx.fakeLib.greet(customGlobal);', registry, ['fake-lib']);
    explicit.declarationFiles = [{ content: 'declare const customGlobal: string;', path: 'src/custom.d.ts' }];

    await withTypeScriptProjectSession(async (session) => {
      expect(await session.getDiagnostics(explicit)).toEqual([]);
    });
    expect(loader).toHaveBeenCalledTimes(1);

    const unknown = await withTypeScriptProjectSession((session) =>
      session.getDiagnostics(project('ctx.libs.notRegistered.call();', registry)),
    );
    expect(unknown.some((diagnostic) => /unknown/.test(diagnostic.message))).toBe(true);
  });

  it('isolates registries and releases registrations', async () => {
    const first = createRunJSTypeLibraryRegistry();
    const second = createRunJSTypeLibraryRegistry();
    const firstLoader = registerFake(
      first,
      vi.fn(() => fakePack('1.0.0', 42)),
    );
    const secondLoader = registerFake(
      second,
      vi.fn(() => fakePack('1.0.0', 7)),
    );

    await withTypeScriptProjectSession(async (session) => {
      expect(
        await session.getDiagnostics(project('ctx.libs.fakeLib.answer satisfies 42;', first, ['fake-lib'])),
      ).toEqual([]);
    });
    await withTypeScriptProjectSession(async (session) => {
      expect(
        await session.getDiagnostics(project('ctx.libs.fakeLib.answer satisfies 7;', second, ['fake-lib'])),
      ).toEqual([]);
    });
    expect(firstLoader).toHaveBeenCalledTimes(1);
    expect(secondLoader).toHaveBeenCalledTimes(1);

    first.dispose();
    expect(first.getDebugState()).toEqual(expect.objectContaining({ disposed: true, registrationCount: 0 }));
    await expect(first.loadPacks([])).rejects.toThrow(/disposed/);
    expect(second.getDebugState().disposed).toBe(false);
  });

  it('rejects duplicate ids, version mismatches, and file hash conflicts', async () => {
    const registry = createRunJSTypeLibraryRegistry();
    registerFake(registry);
    expect(() => registerFake(registry)).toThrow(/already registered/);

    const mismatched = createRunJSTypeLibraryRegistry();
    mismatched.register({ id: 'fake-lib', libraryName: 'fakeLib', loader: () => fakePack('2.0.0'), version: '1.0.0' });
    await expect(mismatched.loadPacks(mismatched.createExplicitRequests(['fake-lib']))).rejects.toThrow(
      /version mismatch/,
    );

    const conflicting = createRunJSTypeLibraryRegistry();
    registerFake(conflicting);
    conflicting.register({
      id: 'fake-extra',
      libraryName: 'fakeExtra',
      loader: () => ({
        ...fakePack(),
        contentHash: 'fake-extra',
        dependencyFiles: [
          { content: 'export const answer: 0;', contentHash: 'conflicting', path: '/node_modules/fake-lib/index.d.ts' },
        ],
        id: 'fake-extra',
        libraryName: 'fakeExtra',
      }),
    });
    const onInternalError = vi.fn();
    const conflictingProject = project('ctx.libs.fakeLib.answer;', conflicting, ['fake-lib', 'fake-extra']);
    conflictingProject.onInternalError = onInternalError;
    await withTypeScriptProjectSession(async (session) => {
      expect(await session.getDiagnostics(conflictingProject)).toEqual([]);
    });
    expect(onInternalError).toHaveBeenCalledWith(expect.objectContaining({ code: 'TYPE_LIBRARY_FILE_CONFLICT' }));
  });
});
