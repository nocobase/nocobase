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
  normalizeBusinessReport,
  normalizeBusinessReportCharts,
} from '../../ai-employees/business-report/ui/report-utils';

describe('business report utils', () => {
  it('should parse chart arrays from string input safely', () => {
    expect(
      normalizeBusinessReportCharts('[{"title":"Orders","options":{"xAxis":{"data":["2026-04-10"]}}}]'),
    ).toHaveLength(1);
    expect(normalizeBusinessReportCharts('[invalid')).toEqual([]);
    expect(normalizeBusinessReportCharts('{"title":"Orders"}')).toEqual([]);
  });

  it('should repair loose chart JSON strings for rendering', () => {
    expect(
      normalizeBusinessReportCharts('[{title:"Orders",options:{series:[{type:"pie",data:[{name:"Paid",value:2}]}]}}]'),
    ).toHaveLength(1);
  });

  it('should normalize malformed report payloads for rendering', () => {
    const report = normalizeBusinessReport({
      title: 'April report',
      markdown: '# Body',
      charts: '[{"title":"Orders","options":{"series":[]}}]',
    });

    expect(report.markdown).toBe('# Body');
    expect(report.charts).toHaveLength(1);
  });

  it('should rewrite pie tooltip formatter for dataset object sources', () => {
    const [chart] = normalizeBusinessReportCharts([
      {
        title: 'Revenue share',
        options: {
          dataset: {
            source: [
              { category: 'A', amount: 120 },
              { category: 'B', amount: 80 },
            ],
          },
          tooltip: {
            formatter: '{b}: {c}',
          },
          series: [
            {
              type: 'pie',
              encode: {
                itemName: 'category',
                value: 'amount',
              },
              label: {
                formatter: '{b}: {c}',
              },
            },
          ],
        },
      },
    ]);

    expect(chart.options.tooltip.formatter).toBe('{b}: {@amount}');
    expect(chart.options.series[0].label.formatter).toBe('{b}: {@amount}');
  });
});
