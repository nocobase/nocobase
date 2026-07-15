/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { loadNodeRunJSTypeLibraryFiles } from '../compiler/node-type-library';
import { buildRunJSTypeScriptContextDeclaration } from '../typescript-project';

describe('RunJS Node Ant Design and Icons declarations', () => {
  it('keeps NocoBase imperative overlays without an ambient antd module stub', () => {
    const baseDeclaration = buildRunJSTypeScriptContextDeclaration();

    expect(baseDeclaration).toContain('interface RunJSMessage');
    expect(baseDeclaration).toContain('interface RunJSNotification');
    expect(baseDeclaration).toContain('interface RunJSModal');
    expect(baseDeclaration).not.toContain("declare module 'antd'");
  });

  it('loads component and icon group closures without unrelated groups', () => {
    const files = loadNodeRunJSTypeLibraryFiles([
      { kind: 'symbol', libraryName: 'antd', packId: 'antd/Button', symbol: 'Button' },
      { kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/P', symbol: 'PlusOutlined', group: 'P' },
    ]);
    const roots = files.rootFiles.map((file) => file.path);

    expect(roots).toEqual(
      expect.arrayContaining([
        '/__runjs__/type-packs/antd/button-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/base-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/p-bridge.d.ts',
      ]),
    );
    expect(roots.some((fileName) => fileName.endsWith('/antd-icons/m-bridge.d.ts'))).toBe(false);
    expect(new Set(files.dependencyFiles.map((file) => file.path)).size).toBe(files.dependencyFiles.length);
  });

  it('reuses loaded full fallbacks for later symbol requests', () => {
    const fullFiles = loadNodeRunJSTypeLibraryFiles([
      { kind: 'full', libraryName: 'antd', packId: 'antd/full' },
      { kind: 'full', libraryName: 'antdIcons', packId: 'antd-icons/full' },
    ]);
    const reusedFiles = loadNodeRunJSTypeLibraryFiles([
      { kind: 'symbol', libraryName: 'antd', packId: 'antd/Input', symbol: 'Input' },
      { kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/P', symbol: 'PlusOutlined', group: 'P' },
    ]);
    const fullRoots = fullFiles.rootFiles.map((file) => file.path);
    const reusedRoots = reusedFiles.rootFiles.map((file) => file.path);

    expect(fullRoots).toEqual(
      expect.arrayContaining([
        '/__runjs__/type-packs/antd/full-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/full-bridge.d.ts',
      ]),
    );
    expect(reusedRoots).toEqual(
      expect.arrayContaining([
        '/__runjs__/type-packs/antd/full-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/full-bridge.d.ts',
      ]),
    );
    expect(reusedRoots.some((fileName) => fileName.endsWith('/antd/input-bridge.d.ts'))).toBe(false);
    expect(reusedRoots.some((fileName) => fileName.endsWith('/antd-icons/p-bridge.d.ts'))).toBe(false);
  });
});
