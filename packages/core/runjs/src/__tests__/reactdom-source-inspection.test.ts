/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import reactDOMPackage from 'react-dom/package.json';
import reactDOMTypesPackage from '@types/react-dom/package.json';

import { inspectRunJSSourceWorkspace } from '../compiler';
import { loadNodeRunJSTypeLibraryFiles } from '../compiler/node-type-library';
import { collectRunJSTypeDeclarationGraphSync } from '../type-packs/generator';

function inspectReactDOM(code: string) {
  return inspectRunJSSourceWorkspace({
    entry: 'src/main.tsx',
    files: [{ path: 'src/main.tsx', content: code }],
    legacy: {
      language: 'tsx',
      metadata: { modelUse: 'JSBlockModel' },
      surfaceStyle: 'action',
      version: 'v2',
    },
    surfaceStyle: 'action',
  });
}

describe('RunJS Node official ReactDOM source inspection', () => {
  it('accepts official Root APIs and the NocoBase ElementProxy overlay', () => {
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

    expect(inspectReactDOM(code)).toEqual([]);
  });

  it('rejects unsupported ReactDOM inputs with official diagnostics', () => {
    const messages = inspectReactDOM(`
const root = ctx.ReactDOM.createRoot('invalid');
ctx.libs.ReactDOM.createRoot(document.createElement('div'), { missingOption: true });
root.render({ invalid: true });
root.unmount('unexpected');
`).map((diagnostic) => diagnostic.message);

    expect(
      messages.some((message) => /string/.test(message) && /container|RunJSSafeElement|Container/i.test(message)),
    ).toBe(true);
    expect(messages.some((message) => /missingOption/.test(message))).toBe(true);
    expect(messages.some((message) => /invalid/.test(message) && /ReactNode/.test(message))).toBe(true);
    expect(messages.some((message) => /Expected 0 arguments/.test(message))).toBe(true);
  });

  it('shares the official React dependency closure without duplicate files', () => {
    const files = loadNodeRunJSTypeLibraryFiles([
      { kind: 'library', libraryName: 'ReactDOM', packId: 'react-dom/client' },
    ]);
    const allFiles = [...files.rootFiles, ...files.dependencyFiles];
    const graph = collectRunJSTypeDeclarationGraphSync(process.cwd(), 'react-dom/client');

    expect(files.rootFiles.map((file) => file.path)).toEqual([
      '/__runjs__/type-packs/react-bridge.d.ts',
      '/__runjs__/type-packs/react-dom-client-bridge.d.ts',
    ]);
    expect(new Set(allFiles.map((file) => file.path)).size).toBe(allFiles.length);
    expect(graph.sourcePackage).toBe('@types/react-dom');
    expect(graph.version).toBe(reactDOMTypesPackage.version);
    expect(graph.version.split('.')[0]).toBe(reactDOMPackage.version.split('.')[0]);
  });
});
