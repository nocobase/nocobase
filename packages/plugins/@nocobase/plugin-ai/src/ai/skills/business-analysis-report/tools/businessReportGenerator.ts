/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineTools } from '@nocobase/ai';
import { z } from 'zod';
import { jsonrepair } from 'jsonrepair';
// @ts-ignore
import pkg from '../../../../../package.json';

function normalizeChartsInput(value: unknown) {
  const result: {
    charts?: unknown[];
    errors: string[];
    warnings: string[];
  } = {
    errors: [],
    warnings: [],
  };

  if (value == null || value === '') {
    return result;
  }

  if (Array.isArray(value)) {
    result.charts = value;
    return result;
  }

  if (typeof value !== 'string') {
    result.errors.push(`Expected charts to be an array or a JSON string array, but received ${typeof value}.`);
    return result;
  }

  const raw = value.trim();
  if (!raw) {
    return result;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      result.charts = parsed;
    } else {
      result.errors.push('Expected charts JSON to parse to an array.');
    }
  } catch (error) {
    try {
      const repaired = jsonrepair(raw);
      const parsed = JSON.parse(repaired);
      if (Array.isArray(parsed)) {
        result.charts = parsed;
        result.warnings.push('Charts JSON was repaired before parsing. Prefer sending strict JSON next time.');
      } else {
        result.errors.push('Expected repaired charts JSON to parse to an array.');
      }
    } catch (repairError) {
      const message = repairError instanceof Error ? repairError.message : String(repairError);
      result.errors.push(`Failed to parse charts JSON: ${message}`);
    }
  }

  return result;
}

function isValidChart(value: unknown) {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !!(value as { options?: unknown }).options &&
    typeof (value as { options?: unknown }).options === 'object' &&
    !Array.isArray((value as { options?: unknown }).options)
  );
}

const chartSchema = z.object({
  title: z.string().optional().describe('Chart title shown in the report.'),
  summary: z.string().optional().describe('Short explanation of what this chart shows.'),
  options: z.object({}).catchall(z.any()).describe('Valid ECharts options object.'),
});

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("ai.tools.businessReportGenerator.title", { ns: "${pkg.name}" })}}`,
    about: `{{t("ai.tools.businessReportGenerator.about", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'businessReportGenerator',
    description:
      'Generate a complete business analysis report with markdown content and embedded ECharts charts in a single tool call. Call this tool once per report and stop after it succeeds.',
    schema: z.object({
      title: z.string().describe('Report title.'),
      summary: z.string().optional().describe('Short executive summary shown in the report header.'),
      markdown: z
        .string()
        .describe(
          'Main report body in markdown. Use sections for findings, risks, and recommendations. To place a chart inline at a specific position, insert placeholders like {{chart:1}}, {{chart:2}}. Do not include any generated-at footer because the platform renders that automatically.',
        ),
      charts: z
        .union([z.array(chartSchema), z.string()])
        .optional()
        .describe(
          'Charts included in the report. Put full ECharts options here directly instead of generating charts in a separate step. If chart data is unavailable, omit this field instead of retrying the tool.',
        ),
      fileName: z.string().optional().describe('Optional export file name without extension.'),
    }),
  },
  invoke: async (_ctx, args) => {
    const { charts, errors, warnings } = normalizeChartsInput(args.charts);
    const validCharts = Array.isArray(charts) ? charts.filter(isValidChart) : [];
    if (Array.isArray(charts) && validCharts.length !== charts.length) {
      errors.push(
        `Invalid chart definitions: expected each chart to include an options object. Valid charts: ${validCharts.length}/${charts.length}.`,
      );
    }

    return {
      status: errors.length ? 'error' : 'success',
      content: JSON.stringify({
        title: args.title,
        chartCount: validCharts.length,
        fileName: args.fileName ?? null,
        ...(warnings.length ? { warnings } : {}),
        ...(errors.length ? { errors } : {}),
      }),
    };
  },
});
