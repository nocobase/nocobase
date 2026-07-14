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
import { afterEach, describe, expect, it } from 'vitest';

import { generatedRunJSTypeLibraryPackManifest } from '../type-packs/generated/manifest';
import {
  clearRunJSTypeLibraryPackRegistryForTests,
  getRunJSTypeLibraryPackRegistryDebugState,
} from '../typescriptLibraryRegistry';
import {
  clearTypeScriptProjectCachesForTests,
  createTypeScriptProjectSession,
  type CodeEditorTypeScriptProject,
} from '../typescriptProject';

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

describe('RunJS official ReactDOM TypeScript project', () => {
  it('uses official Root APIs for native, fragment, and ElementProxy containers', async () => {
    const code = `
const nativeElement: Element = document.createElement('div');
const fragment: DocumentFragment = document.createDocumentFragment();
const nativeRoot = ctx.ReactDOM.createRoot(nativeElement, { identifierPrefix: 'native-' });
const fragmentRoot = ctx.libs.ReactDOM.createRoot(fragment);
const proxyRoot = ctx.ReactDOM.createRoot(ctx.element);
const unwrappedRoot = ctx.libs.ReactDOM.createRoot(ctx.element.__el);
const officialRoot: import('react-dom/client').Root = proxyRoot;
nativeRoot.render(<div>Native</div>);
fragmentRoot.render('Fragment');
officialRoot.render(ctx.React.createElement('span', null, 'Proxy'));
unwrappedRoot.unmount();
nativeRoot.unmount();
fragmentRoot.unmount();
`;
    const session = createTypeScriptProjectSession();

    expect(errorMessages(await session.getDiagnostics(reactDOMProject(code), code))).toEqual([]);
  });

  it('rejects unsupported containers, root children, and options', async () => {
    const code = `
const root = ctx.ReactDOM.createRoot('invalid');
ctx.libs.ReactDOM.createRoot(document.createElement('div'), { missingOption: true });
root.render({ invalid: true });
root.unmount('unexpected');
`;
    const session = createTypeScriptProjectSession();
    const messages = errorMessages(await session.getDiagnostics(reactDOMProject(code), code));

    expect(
      messages.some((message) => /string/.test(message) && /container|RunJSSafeElement|Container/i.test(message)),
    ).toBe(true);
    expect(messages.some((message) => /missingOption/.test(message))).toBe(true);
    expect(messages.some((message) => /invalid/.test(message) && /ReactNode/.test(message))).toBe(true);
    expect(messages.some((message) => /Expected 0 arguments/.test(message))).toBe(true);
  });

  it('loads ReactDOM with React once and leaves ordinary projects unloaded', async () => {
    const ordinaryCode = 'ctx.logger.info("ready");';
    const ordinarySession = createTypeScriptProjectSession();
    expect(await ordinarySession.getDiagnostics(reactDOMProject(ordinaryCode), ordinaryCode)).toEqual([]);
    expect(getRunJSTypeLibraryPackRegistryDebugState().loadingPackCount).toBe(0);

    const code = 'const root = ctx.ReactDOM.createRoot(ctx.element); root.render(<div />); root.unmount();';
    const session = createTypeScriptProjectSession();
    expect(errorMessages(await session.getDiagnostics(reactDOMProject(code), code))).toEqual([]);
    expect(getRunJSTypeLibraryPackRegistryDebugState().loadingPackCount).toBe(2);
    const state = session.getDebugState();
    expect(new Set(state.allFileNames).size).toBe(state.allFileNames.length);
    expect(state.rootFileNames).toContain('/__runjs__/type-packs/react-bridge.d.ts');
    expect(state.rootFileNames).toContain('/__runjs__/type-packs/react-dom-client-bridge.d.ts');
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
      version: '18.3.5',
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
