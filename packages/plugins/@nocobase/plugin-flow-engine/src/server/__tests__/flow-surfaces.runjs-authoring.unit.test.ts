/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { inspectRunJsAuthoringCode } from '../flow-surfaces/runjs-authoring';

describe('flowSurfaces RunJS authoring unit validation', () => {
  it('should reject MultiRecordResource getCount in KPI blocks', () => {
    const errors = inspectRunJsAuthoringCode({
      code: [
        'const React = ctx.React || ctx.libs.React;',
        "const resource = ctx.makeResource('MultiRecordResource');",
        "resource.setResourceName('claims');",
        'resource.refresh();',
        "ctx.render(React.createElement('div', null, resource.getCount() || 0));",
      ].join('\n'),
      path: '$.runjs.resourceCount.code',
      modelUse: 'JSBlockModel',
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.runjs.resourceCount.code',
          ruleId: 'runjs-flow-resource-method-invalid',
          details: expect.objectContaining({
            method: 'getCount',
            repairClass: 'resource-runtime-contract-stop',
            suggestedMethod: 'getData',
          }),
        }),
      ]),
    );
  });
});
