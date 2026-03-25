/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import swagger from '../index';

const nullableParentIdSchema = [{ type: 'integer' }, { type: 'string' }, { type: 'null' }];

describe('plugin client swagger', () => {
  it('should model nullable desktop route parentId with explicit null unions', () => {
    const schemas: Record<string, any> = swagger.components.schemas;

    expect(schemas.DesktopRoute.properties.parentId).toEqual({
      anyOf: nullableParentIdSchema,
    });
    expect(schemas.DesktopRouteCreateValues.properties.parentId).toEqual({
      anyOf: nullableParentIdSchema,
    });
    expect(schemas.DesktopRouteCreateV2Request.properties.parentId).toEqual({
      anyOf: nullableParentIdSchema,
    });
    expect(schemas.DesktopRouteCreateV2Response.properties.page.properties.parentId).toEqual({
      anyOf: nullableParentIdSchema,
    });
  });
});
