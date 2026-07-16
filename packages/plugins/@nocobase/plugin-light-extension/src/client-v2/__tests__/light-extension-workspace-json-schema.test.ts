/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_SCHEMA_URI, lightExtensionEntryV1Schema } from '@nocobase/light-extension-sdk/schema';
import { describe, expect, it } from 'vitest';

import {
  resolveInlineLightExtensionWorkspaceJsonSchema,
  resolveLightExtensionWorkspaceJsonSchema,
} from '../workspace/lightExtensionWorkspaceJsonSchema';

describe('resolveLightExtensionWorkspaceJsonSchema', () => {
  it.each([
    'src/client/js-blocks/sales-kpi/entry.json',
    'src/client/js-fields/customer-name/entry.json',
    'src/client/js-actions/approve/entry.json',
    'src/client/js-items/toolbar-help/entry.json',
  ])('binds the SDK canonical Schema to a managed Entry root: %s', (path) => {
    const resolved = resolveLightExtensionWorkspaceJsonSchema(path);

    expect(resolved).toEqual({
      schema: lightExtensionEntryV1Schema,
      uri: LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
    });
    expect(resolved?.schema).toBe(lightExtensionEntryV1Schema);
  });

  it.each([
    'src/shared/data.json',
    'src/client/js-blocks/sales-kpi/data.json',
    'src/client/js-blocks/sales-kpi/nested/entry.json',
    'src/client/entry.json',
    'entry.json',
    'src/client/js-blocks/sales-kpi/index.tsx',
  ])('does not bind the Entry Schema to ordinary workspace files: %s', (path) => {
    expect(resolveLightExtensionWorkspaceJsonSchema(path)).toBeUndefined();
  });

  it('binds the canonical Schema only to the inline RunJS descriptor path', () => {
    expect(resolveInlineLightExtensionWorkspaceJsonSchema('src/client/entry.json')).toEqual({
      schema: lightExtensionEntryV1Schema,
      uri: LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
    });
    expect(resolveInlineLightExtensionWorkspaceJsonSchema('src/client/nested/entry.json')).toBeUndefined();
  });
});
