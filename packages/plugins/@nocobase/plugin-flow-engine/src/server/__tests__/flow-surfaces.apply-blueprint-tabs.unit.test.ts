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

  it('should compile dynamic block types into public compose payloads', () => {
    const document = prepareFlowSurfaceApplyBlueprintDocument({
      version: '1',
      mode: 'create',
      page: {
        title: 'Timeline',
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'timeline',
              type: 'gantt',
              title: 'Ignored static title',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'tasks',
              },
              settings: {
                titleField: 'title',
                startField: 'startAt',
                endField: 'endAt',
              },
            },
            {
              key: 'timelineByParams',
              type: 'gantt',
              initParams: {
                collectionName: 'tasks',
              },
              settings: {
                titleField: 'title',
                startField: 'startAt',
                endField: 'endAt',
              },
            },
          ],
        },
      ],
    });
    const program = compileFlowSurfaceApplyBlueprintRequest(document, {
      dynamicBlockTypes: new Set(['gantt']),
    });
    const composeStep = program.steps.find((step) => step.action === 'compose');
    const [block, initParamsBlock] = composeStep?.values?.blocks || [];

    expect(block).toMatchObject({
      key: 'Overview.timeline',
      type: 'gantt',
      resource: {
        dataSourceKey: 'main',
        collectionName: 'tasks',
      },
      settings: {
        titleField: 'title',
        startField: 'startAt',
        endField: 'endAt',
      },
    });
    expect(block).not.toHaveProperty('fields');
    expect(block).not.toHaveProperty('actions');
    expect(block).not.toHaveProperty('recordActions');
    expect(block).not.toHaveProperty('defaultFilter');
    expect(block.settings).not.toHaveProperty('title');
    expect(initParamsBlock).toMatchObject({
      key: 'Overview.timelineByParams',
      type: 'gantt',
      initParams: {
        collectionName: 'tasks',
      },
      settings: {
        titleField: 'title',
        startField: 'startAt',
        endField: 'endAt',
      },
    });
    expect(initParamsBlock).not.toHaveProperty('resource');
  });

  it('should compile registered dynamic block types so provider availability can gate writes', () => {
    const document = prepareFlowSurfaceApplyBlueprintDocument({
      version: '1',
      mode: 'create',
      page: {
        title: 'Disabled dynamic',
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'disabled',
              type: 'dryRun',
              initParams: {
                collectionName: 'tasks',
              },
              settings: {
                pageSize: 20,
              },
            },
          ],
        },
      ],
    });
    const program = compileFlowSurfaceApplyBlueprintRequest(document, {
      dynamicBlockTypes: new Set(['dryRun']),
    });
    const composeStep = program.steps.find((step) => step.action === 'compose');

    expect(composeStep?.values?.blocks?.[0]).toMatchObject({
      key: 'Overview.disabled',
      type: 'dryRun',
      initParams: {
        collectionName: 'tasks',
      },
      settings: {
        pageSize: 20,
      },
    });
  });
});
