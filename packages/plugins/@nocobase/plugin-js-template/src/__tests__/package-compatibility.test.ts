/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import canonicalServer, * as canonicalServerExports from '@nocobase/plugin-js-template/server';
import canonicalPackageJson from '@nocobase/plugin-js-template/package.json';
import legacyServer, * as legacyServerExports from '@nocobase/plugin-light-extension/server';
import legacyPackageJson from '@nocobase/plugin-light-extension/package.json';
import { describe, expect, it } from 'vitest';

const stablePluginSubpaths = ['.', './client', './client-v2', './server', './package.json'] as const;

describe('@nocobase/plugin-js-template package facade', () => {
  it('publishes the canonical package metadata and keeps the legacy package installed', () => {
    expect(canonicalPackageJson).toMatchObject({
      name: '@nocobase/plugin-js-template',
      displayName: 'JS Templates',
      'displayName.zh-CN': 'JS 模板',
    });
    expect(canonicalPackageJson.peerDependencies).toEqual({
      '@nocobase/plugin-light-extension': '2.x',
    });
    expect(canonicalPackageJson.devDependencies).toEqual({
      '@nocobase/plugin-light-extension': legacyPackageJson.version,
    });
    expect(legacyPackageJson).toMatchObject({
      name: '@nocobase/plugin-light-extension',
      displayName: 'JS Templates',
      'displayName.zh-CN': 'JS 模板',
    });
    for (const subpath of stablePluginSubpaths) {
      expect(canonicalPackageJson.exports).toHaveProperty(subpath);
      expect(legacyPackageJson.exports).toHaveProperty(subpath);
    }
    expect(canonicalPackageJson.exports['./client'].require).toBe('./client.cjs');
    expect(canonicalPackageJson.exports['./client-v2'].require).toBe('./client-v2.cjs');
  });

  it('uses the same server plugin implementation for canonical and legacy imports', () => {
    expect(canonicalServer).toBe(legacyServer);
    expect(canonicalServerExports).toEqual(legacyServerExports);
  });
});
