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

describe('plugin-multi-portal preset boundary', () => {
  it('should not include Multi-Portal in the default NocoBase preset', () => {
    const packageJson = readJson('packages/presets/nocobase/package.json');
    const ossPluginRoot = path.resolve(process.cwd(), 'packages/plugins/@nocobase/plugin-multi-portal');

    expect(fs.existsSync(ossPluginRoot)).toBe(false);
    expect(packageJson.dependencies).not.toHaveProperty(MULTI_PORTAL_PACKAGE);
    expect(packageJson.builtIn).not.toContain(MULTI_PORTAL_PACKAGE);
    expect(packageJson.dependencies).toHaveProperty(UI_LAYOUT_PACKAGE);
    expect(packageJson.builtIn).toContain(UI_LAYOUT_PACKAGE);
  });
});
