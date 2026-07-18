/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Configuration, RuleSetRule } from '@rspack/core';

import { addWasmUrlAssetRule, WASM_URL_ASSET_FILENAME } from '../../rsbuildWasmUrlAsset';

describe('addWasmUrlAssetRule', () => {
  it('emits ?url WASM imports outside the server-proxied static path', () => {
    const config: Configuration = {};

    addWasmUrlAssetRule(config);

    const rule = config.module?.rules?.[0] as RuleSetRule;
    expect(rule.test).toEqual(/\.wasm$/i);
    expect(rule.resourceQuery).toEqual(/^\?url$/);
    expect(rule.type).toBe('asset/resource');
    expect(rule.generator).toMatchObject({
      filename: WASM_URL_ASSET_FILENAME,
    });
    expect(WASM_URL_ASSET_FILENAME.startsWith('static/')).toBe(false);
  });
});
