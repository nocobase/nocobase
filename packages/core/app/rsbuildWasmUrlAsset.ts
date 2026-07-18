/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Configuration } from '@rspack/core';

export const WASM_URL_ASSET_FILENAME = 'assets/[name]-[contenthash:8][ext]';

export function addWasmUrlAssetRule(config: Configuration): void {
  config.module ||= {};
  config.module.rules ||= [];
  config.module.rules.push({
    test: /\.wasm$/i,
    resourceQuery: /^\?url$/,
    type: 'asset/resource',
    generator: {
      filename: WASM_URL_ASSET_FILENAME,
    },
  });
}
