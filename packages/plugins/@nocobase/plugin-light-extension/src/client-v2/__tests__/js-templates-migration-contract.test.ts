/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_SOURCE_MODE as CORE_LIGHT_EXTENSION_SOURCE_MODE } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';

import {
  LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT,
  LIGHT_EXTENSION_SOURCE_BINDING_TYPE,
  LIGHT_EXTENSION_SOURCE_MODE,
} from '../../constants';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import {
  createLightExtensionRunJSResolver,
  isLightExtensionRuntimeSourceBinding,
} from '../resolvers/LightExtensionRunJSResolver';

describe('JS templates persisted RunJS contract', () => {
  it('keeps light-extension as the canonical resolver and persisted source mode', () => {
    const api: ApiClientLike = { request: vi.fn() };
    const resolver = createLightExtensionRunJSResolver(api);

    expect(CORE_LIGHT_EXTENSION_SOURCE_MODE).toBe('light-extension');
    expect(LIGHT_EXTENSION_SOURCE_MODE).toBe(CORE_LIGHT_EXTENSION_SOURCE_MODE);
    expect(resolver.sourceMode).toBe(LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT.sourceMode);
  });

  it('accepts only the legacy light-extension-entry binding discriminator', () => {
    const binding = {
      type: LIGHT_EXTENSION_SOURCE_BINDING_TYPE,
      repoId: 'repo_1',
      entryId: 'entry_1',
      kind: 'js-block',
    };

    expect(isLightExtensionRuntimeSourceBinding(binding)).toBe(true);
    expect(isLightExtensionRuntimeSourceBinding({ ...binding, type: 'js-template-entry' })).toBe(false);
    expect(LIGHT_EXTENSION_SOURCE_BINDING_TYPE).toBe('light-extension-entry');
  });
});
