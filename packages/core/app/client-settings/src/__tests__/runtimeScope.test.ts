/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { resolveSettingsRuntimeScope } from '../runtimeScope';

describe('Settings runtime scope', () => {
  it('keeps the main application on the configured public path', () => {
    expect(resolveSettingsRuntimeScope('/nocobase/', '/nocobase/settings/system-settings')).toEqual({
      appName: undefined,
      basename: '/nocobase/',
      rootPublicPath: '/nocobase/',
    });
  });

  it.each(['apps', '_app'])('derives %s application scope from the document path', (scope) => {
    expect(resolveSettingsRuntimeScope('/nocobase/', `/nocobase/${scope}/demo/settings/workflow`)).toEqual({
      appName: 'demo',
      basename: `/nocobase/${scope}/demo/`,
      rootPublicPath: '/nocobase/',
    });
  });
});
