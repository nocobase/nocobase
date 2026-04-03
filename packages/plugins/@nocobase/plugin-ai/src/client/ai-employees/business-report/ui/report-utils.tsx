/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { i18n } from '@nocobase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { renderToStaticMarkup } from 'react-dom/server';

export type BusinessReportChart = {
  title?: string;
  summary?: string;
  options: Record<string, any>;
};

export type BusinessReport = {
  title: string;
  summary?: string;
  markdown: string;
  charts?: BusinessReportChart[];
  fileName?: string;
  generatedAt?: string;
};

export function getReportFileName(report: BusinessReport) {
  const raw = report.fileName || report.title || 'business-analysis-report';
  return raw.replace(/[\\/:*?"<>|]+/g, '-').trim();
}

export function buildReportMarkdown(report: BusinessReport) {
  const parts: string[] = [`# ${report.title}`];

  if (report.generatedAt) {
    parts.push(`_Generated at: ${report.generatedAt}_`);
  }

  if (report.summary) {
    parts.push(`> ${report.summary}`);
  }

  if (report.markdown?.trim()) {
    parts.push(report.markdown.trim());
  }

  (report.charts || []).forEach((chart, index) => {
    parts.push(`## ${chart.title || `Chart ${index + 1}`}`);
    if (chart.summary) {
      parts.push(chart.summary);
    }
    parts.push(`<echarts>${JSON.stringify(chart.options, null, 2)}</echarts>`);
  });

  return parts.filter(Boolean).join('\n\n');
}

function buildReportBodyHtml(markdown: string) {
  const charts: Array<{ id: string; options: Record<string, any> }> = [];
  let chartIndex = 0;

  const body = renderToStaticMarkup(
    <ReactMarkdown
      components={{
        // @ts-ignore
        echarts: ({ children }) => {
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
      }}
      rehypePlugins={[
        rehypeRaw,
        [
          rehypeSanitize,
          {
            ...defaultSchema,
            tagNames: [...defaultSchema.tagNames, 'echarts'],
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

export function buildReportHtml(report: BusinessReport, options?: { autoPrint?: boolean; printMode?: boolean }) {
  const markdown = buildReportMarkdown(report);
  const { body, charts } = buildReportBodyHtml(markdown);
  const printMode = options?.printMode === true;
  const renderer = 'canvas';
  const htmlLang = getReportHtmlLang(report);
  const fontFamily = getReportFontFamily(htmlLang);
  const bodyBackground = printMode ? '#ffffff' : '#f5f7fb';
  const shellStyles = printMode
    ? 'max-width: 190mm; margin: 0 auto; padding: 0;'
    : 'max-width: 960px; margin: 0 auto; padding: 32px 24px 64px;';
  const paperStyles = printMode
    ? 'background: #fff; border: 0; border-radius: 0; padding: 0; box-shadow: none; width: 100%;'
    : 'background: #fff; border: 1px solid #d0d5dd; border-radius: 20px; padding: 40px 48px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);';
  const chartHeight = printMode ? 320 : 360;

  return `<!DOCTYPE html>
<html lang="${escapeHtml(htmlLang)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(report.title)}</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
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
      <article class="report-paper">${body}</article>
    </div>
    <script>
      const reportFontFamily = ${JSON.stringify(fontFamily)};
      const charts = ${JSON.stringify(charts)};
      const chartInstances = [];
      charts.forEach(({ id, options }) => {
        const el = document.getElementById(id);
        if (!el || !window.echarts) return;
        const chart = window.echarts.init(el, null, { renderer: '${renderer}' });
        chart.setOption({ textStyle: { fontFamily: reportFontFamily } });
        chart.setOption(options);
        chartInstances.push({ id, chart, el });
      });
      ${
        options?.autoPrint
          ? `
      async function waitForPrintableReady() {
        await renderChartsForPrint();
        if (document.fonts?.ready) {
          try {
            await document.fonts.ready;
          } catch (error) {
            console.error('Failed to wait for fonts before printing:', error);
          }
        }
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      }

      window.addEventListener('load', async () => {
        try {
          await waitForPrintableReady();
        } finally {
          setTimeout(() => window.print(), 150);
        }
      });
      `
          : printMode
            ? `
      window.addEventListener('load', async () => {
        try {
          await renderChartsForPrint();
        } catch (error) {
          console.error('Failed to render report charts for print:', error);
        }
      });
      `
            : ''
      }

      function waitForChartFinished(chart) {
        return new Promise((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            chart.off('finished', finish);
            resolve();
          };
          chart.on('finished', finish);
          setTimeout(finish, 300);
        });
      }

      function normalizeChartOptionsForPrint(options) {
        const normalized = {
          ...options,
          animation: false,
          toolbox: { show: false },
        };
        if (options.grid) {
          normalized.grid = Array.isArray(options.grid)
            ? options.grid.map((grid) => ({ containLabel: true, ...grid }))
            : { containLabel: true, ...options.grid };
        }
        return normalized;
      }

      function waitForNextFrame() {
        return new Promise((resolve) => requestAnimationFrame(() => resolve()));
      }

      async function renderChartsForPrint() {
        if (!${printMode ? 'true' : 'false'}) {
          return;
        }
        for (const { chart, el } of chartInstances) {
          try {
            const width = el.clientWidth || ${printMode ? 718 : 960};
            const height = ${chartHeight};
            chart.setOption(normalizeChartOptionsForPrint(chart.getOption()), true);
            chart.resize({ width, height, silent: true });
            await waitForNextFrame();
            await waitForNextFrame();
            await waitForChartFinished(chart);
            const dataUrl = chart.getDataURL({
              type: 'png',
              pixelRatio: 3,
              backgroundColor: '#ffffff',
              excludeComponents: ['toolbox'],
            });
            const img = document.createElement('img');
            img.className = 'report-chart-image';
            img.src = dataUrl;
            img.alt = '';
            el.replaceWith(img);
            chart.dispose();
          } catch (error) {
            console.error('Failed to rasterize report chart:', error);
          }
        }
        chartInstances.length = 0;
      }
    </script>
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

export function printReport(report: BusinessReport) {
  if (typeof window === 'undefined') {
    return false;
  }

  const html = buildReportHtml(report, { autoPrint: true, printMode: true });
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeParseChartOptions(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, any>;
    }
  } catch (error) {
    console.error('Failed to parse business report chart options:', error);
  }
  return null;
}

function getReportHtmlLang(report: BusinessReport) {
  const currentLanguage = normalizeLanguageTag(i18n.language);
  if (currentLanguage) {
    return currentLanguage;
  }

  const sample = [report.title, report.summary, report.markdown].filter(Boolean).join('\n');
  if (containsJapanese(sample)) {
    return 'ja-JP';
  }
  if (containsKorean(sample)) {
    return 'ko-KR';
  }
  if (containsChinese(sample)) {
    return 'zh-CN';
  }
  return 'en-US';
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

  const lower = value.toLowerCase();
  if (lower === 'zh' || lower.startsWith('zh-cn') || lower.startsWith('zh-hans')) {
    return 'zh-CN';
  }
  if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk') || lower.startsWith('zh-hant')) {
    return 'zh-TW';
  }
  if (lower === 'ja' || lower.startsWith('ja-')) {
    return 'ja-JP';
  }
  if (lower === 'ko' || lower.startsWith('ko-')) {
    return 'ko-KR';
  }
  if (lower === 'en' || lower.startsWith('en-')) {
    return 'en-US';
  }
  if (/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(value)) {
    return value;
  }
  return null;
}

function containsChinese(value: string) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(value);
}

function containsJapanese(value: string) {
  return /[\u3040-\u30ff]/.test(value);
}

function containsKorean(value: string) {
  return /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(value);
}
