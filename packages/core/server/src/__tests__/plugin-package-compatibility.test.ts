/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { JS_TEMPLATE_PLUGIN_PACKAGE_COMPATIBILITY, parsePluginName } from '../../../utils/plugin-package';

const nodeModulesPath = path.resolve(__dirname, '../../../../../node_modules');
const expectedIdentity = {
  name: 'light-extension',
  packageName: '@nocobase/plugin-light-extension',
};

describe('JS Template plugin package compatibility', () => {
  it('normalizes canonical and legacy names to one runtime and package identity', async () => {
    expect(JS_TEMPLATE_PLUGIN_PACKAGE_COMPATIBILITY).toEqual({
      canonicalName: 'js-template',
      canonicalPackageName: '@nocobase/plugin-js-template',
      legacyName: 'light-extension',
      legacyPackageName: '@nocobase/plugin-light-extension',
      runtimeName: 'light-extension',
      runtimePackageName: '@nocobase/plugin-light-extension',
    });

    for (const nameOrPackage of [
      'js-template',
      '@nocobase/plugin-js-template',
      'light-extension',
      '@nocobase/plugin-light-extension',
    ]) {
      await expect(parsePluginName(nameOrPackage, { nodeModulesPath })).resolves.toEqual(expectedIdentity);
    }
  });

  it('does not change unrelated plugin identities', async () => {
    await expect(parsePluginName('@nocobase/plugin-users', { nodeModulesPath })).resolves.toEqual({
      name: 'users',
      packageName: '@nocobase/plugin-users',
    });
  });
});
