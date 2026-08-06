/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { performance } from 'node:perf_hooks';
import { vi } from 'vitest';

import { createJsTemplateUsageServiceFixture, createUsageRecord } from './usage-test-helpers';

const EFFECTIVE_USAGE_COUNT = 5_000;
const PAGE_SIZE = 20;
const USAGE_VISIBILITY_SCAN_METRICS = Symbol.for('nocobase.js-template.usage-visibility-scan-metrics');

describe('JS Template Usage scaling', () => {
  it('keeps restricted visibility scanning bounded while preserving exact pagination metadata', async () => {
    const usages = Array.from({ length: EFFECTIVE_USAGE_COUNT }, (_, index) =>
      createUsageRecord({ id: `jtu_scale_${index}`, modelUid: `flow_scale_${index}` }),
    );
    const flowModels = Array.from({ length: EFFECTIVE_USAGE_COUNT }, (_, index) => ({
      uid: `flow_scale_${index}`,
      visible: index % 2 === 0,
      options: { uid: `flow_scale_${index}`, title: `Scaling owner ${index}` },
    }));
    const { service, repositories } = createJsTemplateUsageServiceFixture({ flowModels, usages });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'readUsages') {
        return {};
      }
      if (resource === 'flowModels' && action === 'findOne') {
        return { params: { filter: { visible: true } } };
      }
      return false;
    });
    const visibilityScanMetrics = {
      usagePageCalls: 0,
      visibilityResolutions: 0,
      maxRetainedBatches: 0,
      maxRetainedUsageRecords: 0,
      maxRetainedLocations: 0,
    };

    const startedAt = performance.now();
    const result = await service.listUsages(
      { templateId: 'jtt_sales_kpi', page: 1, pageSize: PAGE_SIZE },
      { can, [USAGE_VISIBILITY_SCAN_METRICS]: visibilityScanMetrics },
    );
    const durationMs = performance.now() - startedAt;

    expect(result.data).toHaveLength(PAGE_SIZE);
    expect(result.data[0].ownerLocator).toMatchObject({ modelUid: 'flow_scale_0' });
    expect(result.data[PAGE_SIZE - 1].ownerLocator).toMatchObject({ modelUid: 'flow_scale_38' });
    expect(result.meta).toEqual({
      page: 1,
      pageSize: PAGE_SIZE,
      count: EFFECTIVE_USAGE_COUNT / 2,
      totalPage: EFFECTIVE_USAGE_COUNT / 2 / PAGE_SIZE,
      effectiveCount: EFFECTIVE_USAGE_COUNT,
      hiddenCount: EFFECTIVE_USAGE_COUNT / 2,
    });
    expect(repositories.jsTemplateUsages.find).toHaveBeenCalledTimes(EFFECTIVE_USAGE_COUNT / 100);
    expect(visibilityScanMetrics).toMatchObject({
      usagePageCalls: EFFECTIVE_USAGE_COUNT / 100,
      visibilityResolutions: EFFECTIVE_USAGE_COUNT / 100,
    });
    expect(visibilityScanMetrics.maxRetainedBatches).toBeLessThanOrEqual(4);
    expect(visibilityScanMetrics.maxRetainedUsageRecords).toBeLessThanOrEqual(400);
    expect(visibilityScanMetrics.maxRetainedLocations).toBeLessThanOrEqual(200);

    process.stdout.write(
      `[usage-scaling] ${JSON.stringify({
        effectiveUsages: EFFECTIVE_USAGE_COUNT,
        visibleUsages: result.meta.count,
        hiddenUsages: result.meta.hiddenCount,
        pageSize: PAGE_SIZE,
        durationMs: Number(durationMs.toFixed(2)),
        ...visibilityScanMetrics,
      })}\n`,
    );
  });
});
