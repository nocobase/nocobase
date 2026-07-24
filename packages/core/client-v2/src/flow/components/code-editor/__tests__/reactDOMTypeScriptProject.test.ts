/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Diagnostic } from '@codemirror/lint';
import { RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION } from '@nocobase/runjs/client-v2';
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
import { clearTypeScriptProjectCachesForTests, type CodeEditorTypeScriptProject } from '../typescriptProject';

function reactDOMProject(code: string): CodeEditorTypeScriptProject {
  return {
    currentFilePath: 'src/main.tsx',
    files: [{ path: 'src/main.tsx', content: code }],
    runJSContext: { modelUse: 'JSBlockModel' },
  };
}

function errorMessages(diagnostics: Diagnostic[]) {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'error').map((diagnostic) => diagnostic.message);
}

afterEach(() => {
  clearRunJSTypeLibraryPackRegistryForTests();
  clearTypeScriptProjectCachesForTests();
});

afterAll(shutdownTypeScriptProjectSessionSuite);

describe('RunJS official ReactDOM TypeScript project', () => {
  it('loads ReactDOM with React once and leaves ordinary projects unloaded', async () => {
    const ordinaryCode = 'ctx.logger.info("ready");';
    await withTypeScriptProjectSession(async (ordinarySession) => {
      expect(await ordinarySession.getDiagnostics(reactDOMProject(ordinaryCode), ordinaryCode)).toEqual([]);
    });
    expect(getRunJSTypeLibraryPackRegistryDebugState().loadingPackCount).toBe(0);

    const code = 'const root = ctx.ReactDOM.createRoot(ctx.element); root.render(<div />); root.unmount();';
    await withTypeScriptProjectSession(async (session) => {
      expect(errorMessages(await session.getDiagnostics(reactDOMProject(code), code))).toEqual([]);
      expect(getRunJSTypeLibraryPackRegistryDebugState().loadingPackCount).toBe(2);
      const state = session.getDebugState();
      expect(new Set(state.allFileNames).size).toBe(state.allFileNames.length);
      expect(state.rootFileNames).toContain('/__runjs__/type-packs/react-bridge.d.ts');
      expect(state.rootFileNames).toContain('/__runjs__/type-packs/react-dom-client-bridge.d.ts');
    });
  });

  it('keeps the overlay minimal and records compatible official versions', () => {
    const reactPack = generatedRunJSTypeLibraryPackManifest.find((entry) => entry.id === 'react');
    const reactDOMPack = generatedRunJSTypeLibraryPackManifest.find((entry) => entry.id === 'react-dom/client');

    expect(reactDOMPack).toMatchObject({
      dependencies: [
        {
          contentHash: reactPack?.contentHash,
          id: 'react',
          version: reactPack?.version,
        },
      ],
      libraryName: 'react-dom',
      rootFileCount: 1,
      sourcePackage: '@types/react-dom',
    });
    expect(RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION).toContain("typeof import('react-dom/client')");
    expect(RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION).toContain('__nbRunjsInternalShim');
    expect(RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION).toContain(
      "container: import('react-dom/client').Container | RunJSSafeElement",
    );
    expect(RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION).not.toContain('unmount(');
    expect(RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION).not.toContain('render(');
  });
});
