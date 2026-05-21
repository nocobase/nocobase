/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowSurfaceBadRequestError, throwBadRequest } from '../flow-surfaces/errors';

describe('flow surfaces error helpers', () => {
  it('throws bad request errors with options-only input', () => {
    try {
      throwBadRequest('flowSurfaces field is invalid', {
        path: '$.defaults.collections.demo.fieldGroups',
        ruleId: 'demo-rule',
        details: { fieldGroups: ['title'] },
      });
      throw new Error('expected throwBadRequest to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      const badRequest = error as FlowSurfaceBadRequestError;
      expect(badRequest.message).toBe('flowSurfaces field is invalid');
      expect(badRequest.code).toBe('FLOW_SURFACE_BAD_REQUEST');
      expect(badRequest.options).toEqual({
        path: '$.defaults.collections.demo.fieldGroups',
        ruleId: 'demo-rule',
        details: { fieldGroups: ['title'] },
      });
    }
  });

  it('throws bad request errors with explicit code and options', () => {
    const options = { path: '$.defaults', ruleId: 'custom-rule' };

    try {
      throwBadRequest('flowSurfaces field is invalid', 'FLOW_SURFACE_CUSTOM_RULE', options);
      throw new Error('expected throwBadRequest to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
      const badRequest = error as FlowSurfaceBadRequestError;
      expect(badRequest.code).toBe('FLOW_SURFACE_CUSTOM_RULE');
      expect(badRequest.options).toEqual(options);
    }
  });
});
