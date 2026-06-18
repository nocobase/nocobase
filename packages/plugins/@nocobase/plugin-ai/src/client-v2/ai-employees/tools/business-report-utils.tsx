/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as echarts from 'echarts';
import { jsonrepair } from 'jsonrepair';

export type ReportChartOptions = Record<string, unknown>;

export type BusinessReportChart = {
  title?: string;
  summary?: string;
  options: ReportChartOptions;
};

export type BusinessReport = {
  title: string;
  summary?: string;
  markdown: string;
  charts?: BusinessReportChart[] | string;
  fileName?: string;
};

export type BusinessReportRenderState = Omit<BusinessReport, 'charts'> & {
  charts?: BusinessReportChart[];
  generatedAt?: string | number | Date;
};

type ReportRenderOptions = {
  locale?: string;
  t?: (key: string) => string;
};

type BusinessReportInput = Partial<Omit<BusinessReportRenderState, 'charts'>> & {
  charts?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const cloneRecord = (value: ReportChartOptions): ReportChartOptions =>
  JSON.parse(JSON.stringify(value)) as ReportChartOptions;

function getStringProperty(value: unknown, key: string) {
  return isRecord(value) && typeof value[key] === 'string' ? value[key] : undefined;
}

function normalizeBusinessReportChartOptions(options: ReportChartOptions) {
  if (!isRecord(options)) {
    return options;
  }

  const cloned = cloneRecord(options);
  const dataset = cloned.dataset;
  const source = Array.isArray(dataset)
    ? isRecord(dataset[0])
      ? dataset[0].source
      : undefined
    : isRecord(dataset)
      ? dataset.source
      : undefined;
  const seriesRaw = cloned.series;
  const series = Array.isArray(seriesRaw) ? seriesRaw : seriesRaw ? [seriesRaw] : [];

  if (!Array.isArray(source) || source.length === 0) {
    return cloned;
  }

  const first = source[0];
  if (!isRecord(first)) {
    return cloned;
  }

  const pieSeries = series.filter((item) => isRecord(item) && item.type === 'pie');
  if (!pieSeries.length) {
    return cloned;
  }

  const encode = isRecord(pieSeries[0].encode) ? pieSeries[0].encode : undefined;
  const encodedValue = encode?.value;
  let valueDimension = Array.isArray(encodedValue) ? encodedValue[0] : encodedValue;
  if (typeof valueDimension !== 'string' || !valueDimension) {
    if (Object.prototype.hasOwnProperty.call(first, 'value')) {
      valueDimension = 'value';
    }
  }

  if (typeof valueDimension !== 'string' || !valueDimension) {
    return cloned;
  }

  const replaceValuePlaceholder = (template: string) =>
    template.includes('{c}') ? template.replace(/\{c\}/g, '{@' + valueDimension + '}') : template;

  for (const item of pieSeries) {
    const label = isRecord(item.label) ? item.label : undefined;
    if (typeof label?.formatter === 'string') {
      label.formatter = replaceValuePlaceholder(label.formatter);
    }
    const tooltip = isRecord(item.tooltip) ? item.tooltip : undefined;
    if (typeof tooltip?.formatter === 'string') {
      tooltip.formatter = replaceValuePlaceholder(tooltip.formatter);
    }
  }

  const tooltip = isRecord(cloned.tooltip) ? cloned.tooltip : undefined;
  if (typeof tooltip?.formatter === 'string') {
    tooltip.formatter = replaceValuePlaceholder(tooltip.formatter);
  }

  return cloned;
}

function isBusinessReportChart(value: unknown): value is BusinessReportChart {
  return isRecord(value) && isRecord(value.options);
}

export function normalizeBusinessReportCharts(charts: unknown): BusinessReportChart[] {
  const parseCharts = (value: unknown) =>
    Array.isArray(value)
      ? value.filter(isBusinessReportChart).map((chart) => ({
          ...chart,
          options: normalizeBusinessReportChartOptions(chart.options),
        }))
      : [];

  if (Array.isArray(charts)) {
    return parseCharts(charts);
  }

  if (typeof charts !== 'string') {
    return [];
  }

  const raw = charts.trim();
  if (!raw) {
    return [];
  }

  try {
    return parseCharts(JSON.parse(raw) as unknown);
  } catch (error) {
    try {
      return parseCharts(JSON.parse(jsonrepair(raw)) as unknown);
    } catch (repairError) {
      return [];
    }
  }
}

export function normalizeBusinessReport<T extends BusinessReportInput | undefined | null>(report: T) {
  if (!report) {
    return {} as Partial<BusinessReportRenderState>;
  }

  return {
    ...report,
    markdown: report.markdown,
    charts: normalizeBusinessReportCharts(report.charts),
  } as Partial<BusinessReportRenderState>;
}

export function getReportFileName(report: Partial<BusinessReportRenderState>) {
  const normalizedReport = normalizeBusinessReport(report);
  const raw = normalizedReport.fileName || normalizedReport.title || 'business-analysis-report';
  return raw.replace(/[\\/:*?"<>|]+/g, '-').trim();
}

export function buildReportMarkdown(report: Partial<BusinessReportRenderState>, options?: ReportRenderOptions) {
  const normalizedReport = normalizeBusinessReport(report);
  const parts: string[] = [
    `# ${normalizedReport.title || options?.t?.('Business analysis report') || 'Business analysis report'}`,
  ];
  const generatedAt = formatReportGeneratedAt(normalizedReport.generatedAt, options?.locale);

  if (generatedAt) {
    parts.push(`_${options?.t?.('Generated at') || 'Generated at'}: ${generatedAt}_`);
  }

  if (normalizedReport.summary) {
    parts.push(`> ${normalizedReport.summary}`);
  }

  if (normalizedReport.markdown?.trim()) {
    parts.push(insertChartsIntoMarkdown(normalizedReport.markdown.trim(), normalizedReport.charts || []));
  }

  getRemainingCharts(normalizedReport.markdown, normalizedReport.charts || []).forEach((chart, index) => {
    parts.push(buildChartMarkdownBlock(chart, index));
  });

  return parts.filter(Boolean).join('\n\n');
}

function insertChartsIntoMarkdown(markdown: string, charts: BusinessReportChart[]) {
  if (!markdown || !charts.length) {
    return markdown;
  }

  return markdown.replace(/\{\{\s*chart\s*:\s*(\d+)\s*\}\}/gi, (match, rawIndex) => {
    const index = Number(rawIndex) - 1;
    const chart = charts[index];
    if (!chart) {
      return match;
    }
    return buildChartMarkdownBlock(chart, index);
  });
}

function getRemainingCharts(markdown: string | undefined, charts: BusinessReportChart[]) {
  if (!charts.length) {
    return [];
  }

  const usedIndexes = new Set<number>();
  const placeholderPattern = /\{\{\s*chart\s*:\s*(\d+)\s*\}\}/gi;
  const source = markdown || '';
  let match: RegExpExecArray | null;

  while ((match = placeholderPattern.exec(source))) {
    const index = Number(match[1]) - 1;
    if (index >= 0 && index < charts.length) {
      usedIndexes.add(index);
    }
  }

  return charts.filter((_, index) => !usedIndexes.has(index));
}

function buildChartMarkdownBlock(chart: BusinessReportChart, index: number) {
  const parts = [`## ${chart.title || `Chart ${index + 1}`}`];
  if (chart.summary) {
    parts.push(chart.summary);
  }
  parts.push(`<echarts>${JSON.stringify(chart.options, null, 2)}</echarts>`);
  return parts.join('\n\n');
}

export function buildReportHtml(
  report: Partial<BusinessReportRenderState>,
  options?: ReportRenderOptions & { autoPrint?: boolean },
) {
  const markdown = buildReportMarkdown(report, options);
  const title = report.title || options?.t?.('Business analysis report') || 'Business analysis report';
  const htmlLang = normalizeLanguageTag(options?.locale) || 'en-US';
  const escapedMarkdown = escapeHtml(markdown);

  return `<!DOCTYPE html>
<html lang="${escapeHtml(htmlLang)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; color: #1f2937; background: #f5f7fb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .report-shell { max-width: 960px; margin: 0 auto; padding: 32px 24px 64px; }
      .report-paper { background: #fff; border: 1px solid #d0d5dd; border-radius: 20px; padding: 40px 48px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08); }
      pre { white-space: pre-wrap; word-break: break-word; line-height: 1.7; }
      @media print {
        body { background: #fff; }
        .report-shell { max-width: 100%; padding: 0; margin: 0; }
        .report-paper { border: 0; border-radius: 0; box-shadow: none; padding: 0; }
      }
    </style>
  </head>
  <body>
    <div class="report-shell">
      <article class="report-paper"><pre>${escapedMarkdown}</pre></article>
    </div>
    ${
      options?.autoPrint
        ? `<script>
      window.addEventListener('load', () => {
        requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
      });
    </script>`
        : ''
    }
  </body>
</html>`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function printReport(report: Partial<BusinessReportRenderState>, options?: ReportRenderOptions) {
  if (typeof window === 'undefined') {
    return false;
  }

  const html = buildReportHtml(report, { ...options, autoPrint: true });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    URL.revokeObjectURL(url);
    return false;
  }
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);
  return true;
}

export function normalizeChartOptionsForExport(options: ReportChartOptions) {
  const normalized: ReportChartOptions = {
    ...options,
    animation: false,
    toolbox: { show: false },
  };

  const grid = options.grid;
  if (Array.isArray(grid)) {
    normalized.grid = grid.map((item) => (isRecord(item) ? { containLabel: true, ...item } : item));
  } else if (isRecord(grid)) {
    normalized.grid = { containLabel: true, ...grid };
  }

  return normalized as echarts.EChartsOption;
}

function formatReportGeneratedAt(value: string | number | Date | undefined, locale?: string) {
  const parsed = parseReportGeneratedAt(value);
  if (!parsed) {
    return null;
  }

  const normalizedLocale = normalizeLanguageTag(locale) || 'en-US';
  try {
    return new Intl.DateTimeFormat(normalizedLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(parsed);
  } catch (error) {
    console.error('Failed to format business report generatedAt:', error);
    return parsed.toLocaleString();
  }
}

function parseReportGeneratedAt(value?: string | number | Date) {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    return parseTimestampNumber(value);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return parseTimestampNumber(Number(trimmed));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseTimestampNumber(value: number) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const normalized = value < 1e12 ? value * 1000 : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeLanguageTag(input?: string) {
  if (!input) {
    return null;
  }
  const value = input.trim().replace(/_/g, '-');
  if (!value) {
    return null;
  }
  return value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
