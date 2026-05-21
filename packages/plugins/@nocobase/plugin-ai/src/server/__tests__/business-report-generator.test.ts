/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import businessReportGenerator from '../../ai/skills/business-analysis-report/tools/businessReportGenerator';

describe('business report generator tool', () => {
  it('should define a zod schema for tool binding', () => {
    expect(businessReportGenerator.definition.name).toBe('businessReportGenerator');
    expect(businessReportGenerator.definition.schema).toBeTruthy();
  });

  it('should count charts from string payloads in invoke result', async () => {
    const result = await businessReportGenerator.invoke(
      null as any,
      {
        title: 'April report',
        markdown: '# Body',
        charts: '[{"title":"Orders","options":{"series":[]}}]',
      },
      null as any,
    );

    expect(JSON.parse(result.content)).toEqual({
      title: 'April report',
      chartCount: 1,
      fileName: null,
    });
  });

  it('should repair loose chart JSON strings before counting charts', async () => {
    const result = await businessReportGenerator.invoke(
      null as any,
      {
        title: 'April report',
        markdown: '# Body',
        charts: '[{title:"Orders",options:{series:[{type:"pie",data:[{name:"Paid",value:2}]}]}}]',
      },
      null as any,
    );

    expect(result.status).toBe('success');
    expect(JSON.parse(result.content)).toMatchObject({
      title: 'April report',
      chartCount: 1,
      fileName: null,
      warnings: ['Charts JSON was repaired before parsing. Prefer sending strict JSON next time.'],
    });
  });

  it('should return chart definition errors instead of silently reporting zero charts', async () => {
    const result = await businessReportGenerator.invoke(
      null as any,
      {
        title: 'April report',
        markdown: '# Body',
        charts: '[{"title":"Orders"}]',
      },
      null as any,
    );

    const content = JSON.parse(result.content);

    expect(result.status).toBe('error');
    expect(content.chartCount).toBe(0);
    expect(content.errors[0]).toContain('Invalid chart definitions');
  });
});
