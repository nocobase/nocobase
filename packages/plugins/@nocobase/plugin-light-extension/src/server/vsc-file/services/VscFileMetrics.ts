/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const vscFileMetricCounterNames = [
  'blobContentQueryCount',
  'blobContentRowCount',
  'treeNormalizationCount',
] as const;

export type VscFileMetricCounterName = (typeof vscFileMetricCounterNames)[number];

export interface VscFileMetricsCollector {
  increment(counter: VscFileMetricCounterName, value?: number): void | Promise<void>;
}

export function incrementVscFileMetric(
  collector: VscFileMetricsCollector | undefined,
  counter: VscFileMetricCounterName,
  value = 1,
): void {
  if (!collector || !Number.isInteger(value) || value < 0) {
    return;
  }

  try {
    const result = collector.increment(counter, value);
    if (result) {
      result.catch(() => undefined);
    }
  } catch {
    // Metrics are best-effort and must never alter VSC behavior.
  }
}
