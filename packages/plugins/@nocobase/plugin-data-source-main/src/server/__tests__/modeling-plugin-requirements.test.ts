/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_REQUIREMENTS } from '../modeling/constants';

describe('modeling plugin requirements', () => {
  it('should require the unified markdown plugin for vditor fields', () => {
    expect(PLUGIN_REQUIREMENTS.vditor).toEqual({
      runtimeName: 'markdown',
      packageName: '@nocobase/plugin-markdown',
      capability: 'vditor field',
    });
  });
});
