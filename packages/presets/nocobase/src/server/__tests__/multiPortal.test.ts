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
const USERS_PACKAGE = '@nocobase/plugin-users';

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8'));
}

describe('plugin-multi-portal preset boundary', () => {
  it('includes Multi-Portal as an open built-in after UI Layout and Users', () => {
    const packageJson = readJson('packages/presets/nocobase/package.json');
    const ossPluginRoot = path.resolve(process.cwd(), 'packages/plugins/@nocobase/plugin-multi-portal');
    const multiPortalPackageJson = readJson('packages/plugins/@nocobase/plugin-multi-portal/package.json');

    expect(fs.existsSync(ossPluginRoot)).toBe(true);
    expect(packageJson.dependencies).toHaveProperty(MULTI_PORTAL_PACKAGE);
    expect(packageJson.builtIn).toContain(MULTI_PORTAL_PACKAGE);
    expect(packageJson.dependencies).toHaveProperty(UI_LAYOUT_PACKAGE);
    expect(packageJson.builtIn).toContain(UI_LAYOUT_PACKAGE);
    expect(packageJson.dependencies).toHaveProperty(USERS_PACKAGE);
    expect(packageJson.builtIn).toContain(USERS_PACKAGE);
    expect(packageJson.builtIn.indexOf(MULTI_PORTAL_PACKAGE)).toBeGreaterThan(
      packageJson.builtIn.indexOf(UI_LAYOUT_PACKAGE),
    );
    expect(packageJson.builtIn.indexOf(MULTI_PORTAL_PACKAGE)).toBeGreaterThan(
      packageJson.builtIn.indexOf(USERS_PACKAGE),
    );
    expect(multiPortalPackageJson.nocobase).not.toHaveProperty('editionLevel');
  });
});
