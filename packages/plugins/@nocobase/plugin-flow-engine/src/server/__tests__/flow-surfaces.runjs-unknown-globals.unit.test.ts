/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  collectFlowRegistryRunJsAuthoringErrors,
  collectRunJsAuthoringErrors,
  inspectRunJsAuthoringCode,
} from '../flow-surfaces/runjs-authoring';

const INVALID_BARE_API_CODE = [
  "const total = await api.resource('crm_accounts').count();",
  "ctx.render(ctx.React.createElement('div', null, total?.data?.count));",
].join('\n');

describe('flowSurfaces RunJS unknown global validation', () => {
  it('rejects bare api on JS render surfaces and suggests ctx.api', () => {
    const errors = inspectRunJsAuthoringCode({
      code: INVALID_BARE_API_CODE,
      path: '$.tabs[0].blocks[0].settings.code',
      modelUse: 'JSBlockModel',
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'api',
            suggestedCapability: 'ctx.api',
          }),
        }),
      ]),
    );
  });

  it('allows supported ctx APIs, declared aliases, and callback parameters', () => {
    expect(
      inspectRunJsAuthoringCode({
        code: [
          "const total = await ctx.api.resource('crm_accounts').count();",
          'ctx.render(String(total?.data?.count ?? 0));',
        ].join('\n'),
        path: '$.ctxApi.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'const api = ctx.api;',
          "const total = await api.resource('crm_accounts').count();",
          'ctx.render(String(total?.data?.count ?? 0));',
        ].join('\n'),
        path: '$.apiAlias.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: ['const totals = [1, 2, 3].map((api) => api + 1);', 'ctx.render(String(totals.length));'].join('\n'),
        path: '$.callbackParam.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
  });

  it('rejects a bare global before a later local alias declaration', () => {
    const errors = inspectRunJsAuthoringCode({
      code: [
        "const total = await api.resource('crm_accounts').count();",
        'const api = ctx.api;',
        'ctx.render(String(total?.data?.count ?? 0));',
      ].join('\n'),
      path: '$.apiAliasAfterUse.code',
      modelUse: 'JSBlockModel',
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'api',
            suggestedCapability: 'ctx.api',
          }),
        }),
      ]),
    );
  });

  it('preserves var hoisting and left-to-right destructuring defaults', () => {
    expect(
      inspectRunJsAuthoringCode({
        code: ['ctx.render(String(api));', 'var api = ctx.api;'].join('\n'),
        path: '$.varHoist.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: ['const { a = 1, b = a } = {};', 'ctx.render(String(b));'].join('\n'),
        path: '$.objectPatternDefaults.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    expect(
      inspectRunJsAuthoringCode({
        code: ['const [a = 1, b = a] = [];', 'ctx.render(String(b));'].join('\n'),
        path: '$.arrayPatternDefaults.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);
  });

  it('handles for-of loop head binding availability', () => {
    const unknownIterableErrors = inspectRunJsAuthoringCode({
      code: ['for (const api of api) {', '  console.log(api);', '}', "ctx.render('ok');"].join('\n'),
      path: '$.forOfUnknownIterable.code',
      modelUse: 'JSBlockModel',
    });

    expect(unknownIterableErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'api',
            suggestedCapability: 'ctx.api',
          }),
        }),
      ]),
    );

    expect(
      inspectRunJsAuthoringCode({
        code: [
          'let output = 0;',
          'for (const { a = 1, b = a } of [{}]) {',
          '  output = b;',
          '}',
          'ctx.render(String(output));',
        ].join('\n'),
        path: '$.forOfPatternDefaults.code',
        modelUse: 'JSBlockModel',
      }),
    ).toEqual([]);

    const unknownForInErrors = inspectRunJsAuthoringCode({
      code: ['for (const api in api) {', '  console.log(api);', '}', "ctx.render('ok');"].join('\n'),
      path: '$.forInUnknownIterable.code',
      modelUse: 'JSBlockModel',
    });

    expect(unknownForInErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'api',
            suggestedCapability: 'ctx.api',
          }),
        }),
      ]),
    );
  });

  it('preserves chart event bare globals', () => {
    expect(
      inspectRunJsAuthoringCode({
        code: "if (params?.name) {\n  chart.off('click');\n}",
        path: '$.chart.events.raw',
        modelUse: 'ChartEventsModel',
      }),
    ).toEqual([]);
  });

  it('rejects bare api through applyBlueprint RunJS collection', () => {
    const errors = collectRunJsAuthoringErrors('applyBlueprint', {
      tabs: [
        {
          blocks: [
            {
              type: 'jsBlock',
              settings: {
                code: INVALID_BARE_API_CODE,
              },
            },
          ],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].settings.code',
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'api',
            suggestedCapability: 'ctx.api',
          }),
        }),
      ]),
    );
  });

  it('rejects bare api through flowRegistry RunJS collection', () => {
    const errors = collectFlowRegistryRunJsAuthoringErrors(
      {
        submitFlow: {
          steps: {
            runTotals: {
              use: 'runjs',
              params: {
                code: "const total = await api.resource('crm_accounts').count();",
              },
            },
          },
        },
      },
      '$.customFlowRegistry',
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.customFlowRegistry.submitFlow.steps.runTotals.params.code',
          ruleId: 'runjs-global-unknown',
          details: expect.objectContaining({
            global: 'api',
            suggestedCapability: 'ctx.api',
          }),
        }),
      ]),
    );
  });
});
