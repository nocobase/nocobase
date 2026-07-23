/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import reactPackage from 'react/package.json';
import reactTypesPackage from '@types/react/package.json';

import { collectRunJSTypeDeclarationGraphSync } from '../type-packs/generator';

describe('RunJS Node official React source inspection', () => {
  it('uses the installed official declaration closure with a compatible React major version', () => {
    const graph = collectRunJSTypeDeclarationGraphSync(process.cwd(), 'react');

    expect(graph.sourcePackage).toBe('@types/react');
    expect(graph.version).toBe(reactTypesPackage.version);
    expect(graph.dependencyFiles.some((file) => file.path.endsWith('/@types/react/index.d.ts'))).toBe(true);
    expect(graph.dependencyFiles.some((file) => file.path.endsWith('/csstype/index.d.ts'))).toBe(true);
    expect(graph.version.split('.')[0]).toBe(reactPackage.version.split('.')[0]);
  });
});
