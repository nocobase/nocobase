/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';

const MULTI_PORTAL_PACKAGE = '@nocobase/plugin-multi-portal';
const UI_LAYOUT_PACKAGE = '@nocobase/plugin-ui-layout';

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8'));
}

describe('plugin-multi-portal preset integration', () => {
  it('should keep the Multi-Portal plugin scaffold isolated and layout-aware', () => {
    const pluginRoot = path.resolve(process.cwd(), 'packages/plugins/@nocobase/plugin-multi-portal');
    const requiredFiles = [
      'package.json',
      'client-v2.js',
      'client-v2.d.ts',
      'client.js',
      'client.d.ts',
      'server.js',
      'server.d.ts',
      'src/index.ts',
      'src/server/index.ts',
      'src/server/plugin.ts',
      'src/server/__tests__/plugin.test.ts',
      'src/client-v2/index.tsx',
      'src/client-v2/plugin.tsx',
      'src/client-v2/__tests__/plugin.test.tsx',
      'src/locale/en-US.json',
      'src/locale/zh-CN.json',
    ];

    expect(fs.existsSync(pluginRoot)).toBe(true);
    for (const file of requiredFiles) {
      expect(fs.existsSync(path.join(pluginRoot, file))).toBe(true);
    }

    const packageJson = readJson('packages/plugins/@nocobase/plugin-multi-portal/package.json');
    expect(packageJson).toMatchObject({
      name: MULTI_PORTAL_PACKAGE,
      displayName: 'Multi-portal',
      'displayName.zh-CN': '多工作区',
    });
    expect(packageJson.peerDependencies).toMatchObject({
      '@nocobase/client-v2': '2.x',
      '@nocobase/database': '2.x',
      '@nocobase/flow-engine': '2.x',
      [UI_LAYOUT_PACKAGE]: '2.x',
      '@nocobase/resourcer': '2.x',
      '@nocobase/server': '2.x',
      '@nocobase/test': '2.x',
    });
    expect(packageJson.devDependencies).toMatchObject({
      '@ant-design/icons': '5.x',
      ahooks: '3.x',
      antd: '5.x',
      react: '^18.2.0',
    });
  });

  it('should declare Multi-Portal after UI Layout in the NocoBase preset dependencies and built-ins', () => {
    const packageJson = readJson('packages/presets/nocobase/package.json');
    const dependencyNames = Object.keys(packageJson.dependencies);
    const uiLayoutIndex = dependencyNames.indexOf(UI_LAYOUT_PACKAGE);
    const multiPortalIndex = dependencyNames.indexOf(MULTI_PORTAL_PACKAGE);
    const builtInNames = packageJson.builtIn;
    const uiLayoutBuiltInIndex = builtInNames.indexOf(UI_LAYOUT_PACKAGE);
    const multiPortalBuiltInIndex = builtInNames.indexOf(MULTI_PORTAL_PACKAGE);

    expect(uiLayoutIndex).toBeGreaterThanOrEqual(0);
    expect(multiPortalIndex).toBeGreaterThanOrEqual(0);
    expect(multiPortalIndex).toBeGreaterThan(uiLayoutIndex);
    expect(packageJson.dependencies[MULTI_PORTAL_PACKAGE]).toBe(packageJson.version);
    expect(uiLayoutBuiltInIndex).toBeGreaterThanOrEqual(0);
    expect(multiPortalBuiltInIndex).toBeGreaterThanOrEqual(0);
    expect(multiPortalBuiltInIndex).toBeGreaterThan(uiLayoutBuiltInIndex);
  });
});
