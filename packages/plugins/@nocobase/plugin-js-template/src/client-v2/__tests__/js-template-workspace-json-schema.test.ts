/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_TEMPLATE_SCHEMA_URI, jsTemplateV1Schema } from '@nocobase/runjs/js-template/schema';
import { describe, expect, it } from 'vitest';

import {
  resolveInlineJsTemplateWorkspaceJsonSchema,
  resolveJsTemplateWorkspaceJsonSchema,
} from '../workspace/jsTemplateWorkspaceJsonSchema';

describe('resolveJsTemplateWorkspaceJsonSchema', () => {
  it.each([
    'src/client/js-blocks/sales-kpi/entry.json',
    'src/client/js-fields/customer-name/entry.json',
    'src/client/js-actions/approve/entry.json',
    'src/client/js-items/toolbar-help/entry.json',
  ])('binds the SDK canonical Schema to a managed Entry root: %s', (path) => {
    const resolved = resolveJsTemplateWorkspaceJsonSchema(path);

    expect(resolved).toEqual({
      schema: jsTemplateV1Schema,
      uri: JS_TEMPLATE_SCHEMA_URI,
    });
    expect(resolved?.schema).toBe(jsTemplateV1Schema);
  });

  it.each([
    'src/shared/data.json',
    'src/client/js-blocks/sales-kpi/data.json',
    'src/client/js-blocks/sales-kpi/nested/entry.json',
    'src/client/entry.json',
    'entry.json',
    'src/client/js-blocks/sales-kpi/index.tsx',
  ])('does not bind the Entry Schema to ordinary workspace files: %s', (path) => {
    expect(resolveJsTemplateWorkspaceJsonSchema(path)).toBeUndefined();
  });

  it('binds the canonical Schema only to the inline RunJS descriptor path', () => {
    expect(resolveInlineJsTemplateWorkspaceJsonSchema('src/client/entry.json')).toEqual({
      schema: jsTemplateV1Schema,
      uri: JS_TEMPLATE_SCHEMA_URI,
    });
    expect(resolveInlineJsTemplateWorkspaceJsonSchema('src/client/nested/entry.json')).toBeUndefined();
  });
});
