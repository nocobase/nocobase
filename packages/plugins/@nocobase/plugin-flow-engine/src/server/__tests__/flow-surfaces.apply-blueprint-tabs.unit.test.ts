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
  compileFlowSurfaceApplyBlueprintRequest,
  prepareFlowSurfaceApplyBlueprintDocument,
} from '../flow-surfaces/blueprint';

describe('flowSurfaces applyBlueprint tab normalization', () => {
  it('should force single-tab blueprints to disable page tabs before planning', () => {
    const document = prepareFlowSurfaceApplyBlueprintDocument({
      version: '1',
      mode: 'create',
      page: {
        title: 'Single tab',
        enableTabs: true,
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              type: 'jsBlock',
              settings: {
                code: "ctx.render('ok');",
              },
            },
          ],
        },
      ],
    });
    const program = compileFlowSurfaceApplyBlueprintRequest(document);
    const createPageStep = program.steps.find((step) => step.id === 'blueprintPage');

    expect(document.page?.enableTabs).toBe(false);
    expect(createPageStep?.values).toMatchObject({
      enableTabs: false,
    });
  });

  it('should preserve explicit multi-tab enableTabs true', () => {
    const document = prepareFlowSurfaceApplyBlueprintDocument({
      version: '1',
      mode: 'create',
      page: {
        title: 'Multi tab',
        enableTabs: true,
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              type: 'jsBlock',
              settings: {
                code: "ctx.render('one');",
              },
            },
          ],
        },
        {
          title: 'Summary',
          blocks: [
            {
              type: 'jsBlock',
              settings: {
                code: "ctx.render('two');",
              },
            },
          ],
        },
      ],
    });
    const program = compileFlowSurfaceApplyBlueprintRequest(document);
    const createPageStep = program.steps.find((step) => step.id === 'blueprintPage');

    expect(document.page?.enableTabs).toBe(true);
    expect(createPageStep?.values).toMatchObject({
      enableTabs: true,
    });
  });
});
