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
  createNodeRunJSTypeLibraryRegistry,
  type NodeRunJSTypeLibraryFiles,
  type NodeRunJSTypeLibraryRegistry,
} from '../compiler/node-type-library';
import { inspectRunJSSourceWorkspace } from '../compiler/source-inspection';

const fakeFiles: NodeRunJSTypeLibraryFiles = {
  dependencyFiles: [
    {
      content: 'export const answer: 42; export function greet(name: string): string;',
      contentHash: 'fake-declaration',
      path: '/node_modules/fake-lib/index.d.ts',
    },
  ],
  rootFiles: [
    {
      content: `
type RunJSFakeLibrary = typeof import('fake-lib');
interface RunJSLibraries { fakeLib: RunJSFakeLibrary; }
interface RunJSContext { fakeLib: RunJSFakeLibrary; }
`,
      contentHash: 'fake-bridge',
      path: '/__runjs__/fake-lib-bridge.d.ts',
    },
  ],
};

function registerFake(registry: NodeRunJSTypeLibraryRegistry, load = vi.fn(() => fakeFiles)): typeof load {
  registry.register({
    contentHash: 'fake-pack',
    id: 'fake-lib',
    libraryName: 'fakeLib',
    load,
    moduleNames: ['fake-lib'],
    version: '1.0.0',
  });
  return load;
}

function inspect(code: string, registry: NodeRunJSTypeLibraryRegistry, typeLibraryIds?: readonly string[]) {
  return inspectRunJSSourceWorkspace({
    entry: 'src/main.ts',
    files: [{ content: code, path: 'src/main.ts' }],
    surfaceStyle: 'action',
    typeLibraryIds,
    typeLibraryRegistry: registry,
  });
}

describe('custom Node RunJS TypeScript library provider', () => {
  it('matches browser diagnostics and stays lazy', () => {
    const registry = createNodeRunJSTypeLibraryRegistry();
    const load = registerFake(registry);

    expect(inspect('ctx.logger.info("ready");', registry)).toEqual([]);
    expect(load).not.toHaveBeenCalled();
    expect(inspect('const answer: 42 = ctx.libs.fakeLib.answer; ctx.libs.fakeLib.greet("Ada");', registry)).toEqual([]);
    expect(load).toHaveBeenCalledTimes(1);

    const messages = inspect('ctx.libs.fakeLib.greet(1); ctx.libs.fakeLib.missing;', registry).map(
      (diagnostic) => diagnostic.message,
    );
    expect(messages.some((message) => /string/.test(message))).toBe(true);
    expect(messages.some((message) => /missing/.test(message))).toBe(true);
  });

  it('supports explicit ids and isolated provider scopes', () => {
    const first = createNodeRunJSTypeLibraryRegistry();
    const second = createNodeRunJSTypeLibraryRegistry();
    const firstLoad = registerFake(first);
    const secondFiles: NodeRunJSTypeLibraryFiles = {
      ...fakeFiles,
      dependencyFiles: [
        { content: 'export const answer: 7;', contentHash: 'fake-seven', path: '/node_modules/fake-lib/index.d.ts' },
      ],
    };
    const secondLoad = registerFake(
      second,
      vi.fn(() => secondFiles),
    );

    expect(inspect('const answer: 42 = ctx.fakeLib.answer;', first, ['fake-lib'])).toEqual([]);
    expect(inspect('const answer: 7 = ctx.fakeLib.answer;', second, ['fake-lib'])).toEqual([]);
    expect(firstLoad).toHaveBeenCalledTimes(1);
    expect(secondLoad).toHaveBeenCalledTimes(1);

    first.dispose();
    expect(first.getDebugState()).toEqual({ disposed: true, providerCount: 0 });
    expect(() => inspect('ctx.libs.fakeLib.answer;', first)).toThrow(/disposed/);
    expect(second.getDebugState().disposed).toBe(false);
  });

  it('rejects duplicate ids, dependency version conflicts, and file hash conflicts', () => {
    const registry = createNodeRunJSTypeLibraryRegistry();
    registerFake(registry);
    expect(() => registerFake(registry)).toThrow(/already registered/);

    registry.register({
      dependencies: [{ contentHash: 'fake-pack', id: 'fake-lib', version: '2.0.0' }],
      id: 'fake-dependent',
      libraryName: 'fakeDependent',
      load: () => ({ dependencyFiles: [], rootFiles: [] }),
    });
    expect(() => registry.load(registry.createExplicitRequests(['fake-dependent']))).toThrow(/dependency mismatch/);

    const conflicting = createNodeRunJSTypeLibraryRegistry();
    registerFake(conflicting);
    conflicting.register({
      id: 'fake-extra',
      libraryName: 'fakeExtra',
      load: () => ({
        dependencyFiles: [
          { content: 'export const answer: 0;', contentHash: 'different', path: '/node_modules/fake-lib/index.d.ts' },
        ],
        rootFiles: [],
      }),
    });
    expect(() => conflicting.load(conflicting.createExplicitRequests(['fake-lib', 'fake-extra']))).toThrow(
      /Conflicting.*fake-lib\/index\.d\.ts/,
    );
  });
});
