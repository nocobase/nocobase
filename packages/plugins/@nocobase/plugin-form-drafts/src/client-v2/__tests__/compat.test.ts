/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import v1Default, { PluginFormDraftsClient as V1PluginFormDraftsClient } from '../../client';
import v2Default, { PluginFormDraftsClient as V2PluginFormDraftsClient } from '../index';

describe('plugin-form-drafts v1 compatibility entry', () => {
  it('re-exports the v2 plugin implementation', () => {
    expect(v1Default).toBe(v2Default);
    expect(V1PluginFormDraftsClient).toBe(V2PluginFormDraftsClient);
  });
});
