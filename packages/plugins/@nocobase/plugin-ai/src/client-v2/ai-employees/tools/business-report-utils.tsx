/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import * as echarts from 'echarts';
import { jsonrepair } from 'jsonrepair';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { renderToStaticMarkup } from 'react-dom/server';

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

function buildReportBodyHtml(markdown: string) {
  const charts: Array<{ id: string; options: ReportChartOptions }> = [];
  let chartIndex = 0;
  const components = {
    echarts: ({ children }: { children?: React.ReactNode }) => {
      const raw = Array.isArray(children) ? children.join('') : String(children ?? '');
      const id = `report-chart-${chartIndex++}`;
      const options = safeParseChartOptions(raw);
      if (options) {
        charts.push({
          id,
          options,
        });
      }
      return <div id={id} className="report-chart" />;
    },
  } as unknown as Components;

  const body = renderToStaticMarkup(
    <ReactMarkdown
      components={components}
      rehypePlugins={[
        rehypeRaw,
        [
          rehypeSanitize,
          {
            ...defaultSchema,
            tagNames: [...(defaultSchema.tagNames ?? []), 'echarts'],
          },
        ],
      ]}
      remarkPlugins={[remarkGfm]}
    >
      {markdown}
    </ReactMarkdown>,
  );

  return { body, charts };
}

export async function buildReportHtml(
  report: Partial<BusinessReportRenderState>,
  options?: ReportRenderOptions & { autoPrint?: boolean; printMode?: boolean },
) {
  const markdown = buildReportMarkdown(report, options);
  const { body, charts } = buildReportBodyHtml(markdown);
  const printMode = options?.printMode === true;
  const htmlLang = getReportHtmlLang(options?.locale);
  const fontFamily = getReportFontFamily(htmlLang);
  const bodyBackground = printMode ? '#ffffff' : '#f5f7fb';
  const shellStyles = printMode
    ? 'max-width: 190mm; margin: 0 auto; padding: 0;'
    : 'max-width: 960px; margin: 0 auto; padding: 32px 24px 64px;';
  const paperStyles = printMode
    ? 'background: #fff; border: 0; border-radius: 0; padding: 0; box-shadow: none; width: 100%;'
    : 'background: #fff; border: 1px solid #d0d5dd; border-radius: 20px; padding: 40px 48px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);';
  const chartHeight = printMode ? 320 : 360;
  const chartImages = await renderChartsToImages(charts, {
    chartHeight,
    fontFamily,
    printMode,
  });
  const bodyWithCharts = replaceChartPlaceholders(body, chartImages);
  const title = report.title || options?.t?.('Business analysis report') || 'Business analysis report';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(htmlLang)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html, body { font-family: ${fontFamily}; }
      body { margin: 0; color: #1f2937; background: ${bodyBackground}; }
      .report-shell { ${shellStyles} }
      .report-paper { ${paperStyles} }
      h1, h2, h3 { color: #101828; }
      h1 { margin-top: 0; font-size: 32px; }
      h2, h3 { break-after: avoid-page; }
      p, li { line-height: 1.7; }
      blockquote { margin: 16px 0; padding: 12px 16px; border-left: 4px solid #0f766e; background: #f0fdfa; color: #667085; }
      pre, blockquote, table, .report-chart { break-inside: avoid; page-break-inside: avoid; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d0d5dd; padding: 10px 12px; text-align: left; }
      .report-chart { width: 100%; min-height: ${chartHeight}px; height: ${chartHeight}px; margin: 24px 0 32px; border: 1px solid #d0d5dd; border-radius: ${
        printMode ? 0 : 16
      }px; overflow: hidden; background: #fff; }
      .report-chart-image { display: block; width: 100%; height: auto; border: 1px solid #d0d5dd; background: #fff; margin: 24px 0 32px; break-inside: avoid; page-break-inside: avoid; }
      .report-paper > *:first-child { margin-top: 0; }
      .report-paper > *:last-child { margin-bottom: 0; }
      img, svg, canvas { max-width: 100%; }
      svg, svg text, svg tspan, canvas { font-family: ${fontFamily}; }
      @page { size: A4; margin: 12mm; }
      @media print {
        body { background: #fff; }
        .report-shell { max-width: 100%; padding: 0; margin: 0; }
        .report-paper { border: 0; border-radius: 0; box-shadow: none; padding: 0; width: 100%; }
        .report-chart { margin: 16px 0 24px; height: 320px; min-height: 320px; }
        .report-chart-image { margin: 16px 0 24px; }
      }
    </style>
  </head>
  <body>
    <div class="report-shell">
      <article class="report-paper">${bodyWithCharts}</article>
    </div>
    ${
      options?.autoPrint
        ? `<script>
      window.addEventListener('load', async () => {
        if (document.fonts?.ready) {
          try {
            await document.fonts.ready;
          } catch (error) {
            console.error('Failed to wait for fonts before printing:', error);
          }
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.print();
          });
        });
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

  const html = await buildReportHtml(report, { ...options, autoPrint: true, printMode: true });
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

async function renderChartsToImages(
  charts: Array<{ id: string; options: ReportChartOptions }>,
  options: { chartHeight: number; fontFamily: string; printMode: boolean },
) {
  if (typeof document === 'undefined' || !charts.length) {
    return new Map<string, string>();
  }

  const result = new Map<string, string>();
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-100000px';
  host.style.top = '0';
  host.style.width = `${options.printMode ? 718 : 960}px`;
  host.style.pointerEvents = 'none';
  host.style.opacity = '0';
  host.style.zIndex = '-1';
  document.body.appendChild(host);

  try {
    for (const chartItem of charts) {
      const container = document.createElement('div');
      container.style.width = host.style.width;
      container.style.height = `${options.chartHeight}px`;
      host.appendChild(container);

      try {
        const chart = echarts.init(container, 'default', { renderer: 'canvas' });
        chart.setOption(
          {
            ...normalizeChartOptionsForExport(chartItem.options),
            textStyle: {
              ...(isRecord(chartItem.options.textStyle) ? chartItem.options.textStyle : {}),
              fontFamily: options.fontFamily,
            },
          },
          true,
        );
        chart.resize({
          width: container.clientWidth || parseInt(host.style.width, 10),
          height: options.chartHeight,
          silent: true,
        });
        await waitForNextFrame();
        await waitForNextFrame();
        await waitForChartFinished(chart);
        result.set(
          chartItem.id,
          chart.getDataURL({
            type: 'png',
            pixelRatio: 3,
            backgroundColor: '#ffffff',
            excludeComponents: ['toolbox'],
          }),
        );
        chart.dispose();
      } catch (error) {
        console.error('Failed to render business report chart image:', error);
      } finally {
        container.remove();
      }
    }
  } finally {
    host.remove();
  }

  return result;
}

function replaceChartPlaceholders(body: string, chartImages: Map<string, string>) {
  return body.replace(/<div id="([^"]+)" class="report-chart"><\/div>/g, (match, id) => {
    const src = chartImages.get(id);
    if (!src) {
      return match;
    }
    return `<img class="report-chart-image" src="${src}" alt="" />`;
  });
}

function waitForChartFinished(chart: echarts.ECharts) {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      chart.off('finished', finish);
      resolve();
    };

    chart.on('finished', finish);
    window.setTimeout(finish, 400);
  });
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function safeParseChartOptions(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isRecord(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to parse business report chart options:', error);
  }
  return null;
}

function getReportHtmlLang(locale: string | undefined) {
  const currentLanguage = normalizeLanguageTag(locale);
  if (currentLanguage) {
    return currentLanguage;
  }
  return 'en-US';
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
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function parseTimestampNumber(value: number) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const normalized = value < 1e12 ? value * 1000 : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getReportFontFamily(lang: string) {
  if (lang.startsWith('zh')) {
    return '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Micro Hei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }
  if (lang.startsWith('ja')) {
    return '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "Noto Sans CJK JP", "Source Han Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }
  if (lang.startsWith('ko')) {
    return '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", "Source Han Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }
  return '"Inter", "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", -apple-system, BlinkMacSystemFont, sans-serif';
}

function normalizeLanguageTag(input?: string) {
  if (!input) {
    return null;
  }
  const value = input.trim().replace(/_/g, '-');
  if (!value) {
    return null;
  }

  if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(value)) {
    return null;
  }

  try {
    return Intl.DateTimeFormat.supportedLocalesOf([value])[0] || value;
  } catch (error) {
    return value;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
