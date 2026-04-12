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

  it('should normalize malformed report payloads for rendering', () => {
    const report = normalizeBusinessReport({
      title: 'April report',
      markdown: '# Body',
      charts: '[{"title":"Orders","options":{"series":[]}}]',
    });

    expect(report.markdown).toBe('# Body');
    expect(report.charts).toHaveLength(1);
  });
});
