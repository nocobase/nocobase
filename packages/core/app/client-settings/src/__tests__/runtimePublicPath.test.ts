/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { resolveSettingsAssetPublicPath } from '../runtimePublicPath';

describe('Settings runtime asset public path', () => {
  it('uses the Settings asset path without a CDN', () => {
    expect(resolveSettingsAssetPublicPath(undefined, '/nocobase/')).toBe('/nocobase/settings/');
  });

  it('keeps Settings assets isolated under a CDN', () => {
    expect(resolveSettingsAssetPublicPath('https://cdn.example.com/releases/42/', '/nocobase/')).toBe(
      'https://cdn.example.com/releases/42/settings/',
    );
  });
});
