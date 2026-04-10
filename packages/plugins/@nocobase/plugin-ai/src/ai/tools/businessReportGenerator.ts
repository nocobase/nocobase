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
// @ts-ignore
import pkg from '../../../package.json';

function coerceChartsInput(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const raw = value.trim();
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch (error) {
    return undefined;
  }
}

const chartSchema = z.object({
  title: z.string().optional().describe('Chart title shown in the report.'),
  summary: z.string().optional().describe('Short explanation of what this chart shows.'),
  options: z.object({}).catchall(z.any()).describe('Valid ECharts options object.'),
});

export default defineTools({
  scope: 'GENERAL',
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
        .preprocess(coerceChartsInput, z.array(chartSchema).optional())
        .optional()
        .describe(
          'Charts included in the report. Put full ECharts options here directly instead of generating charts in a separate step. If chart data is unavailable, omit this field instead of retrying the tool.',
        ),
      fileName: z.string().optional().describe('Optional export file name without extension.'),
    }),
  },
  invoke: async (_ctx, args) => {
    return {
      status: 'success',
      content: JSON.stringify({
        title: args.title,
        chartCount: args.charts?.length ?? 0,
        fileName: args.fileName ?? null,
      }),
    };
  },
});
