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

import { loadNodeRunJSTypeLibraryFiles } from '../compiler/node-type-library';
import { collectRunJSTypeDeclarationGraphSync } from '../type-packs/generator';

describe('RunJS Node official ReactDOM source inspection', () => {
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
