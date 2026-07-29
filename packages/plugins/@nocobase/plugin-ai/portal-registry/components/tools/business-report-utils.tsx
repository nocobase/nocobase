import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type BusinessReportChart = {
  title?: string;
  summary?: string;
  options: Record<string, unknown>;
};

export type BusinessReportData = {
  title: string;
  summary?: string;
  markdown?: string;
  charts: BusinessReportChart[];
  fileName?: string;
};

export type BusinessReportMarkdownPart =
  | { type: "markdown"; content: string }
  | { type: "chart"; options: Record<string, unknown> };

const chartTagPattern = /<echarts>([\s\S]*?)<\/echarts>/gi;
const chartPlaceholderPattern = /\{\{\s*chart\s*:\s*(\d+)\s*\}\}/gi;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function normalizeBusinessReportCharts(
  value: unknown
): BusinessReportChart[] {
  let charts = value;
  if (typeof value === "string") {
    try {
      charts = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(charts)) return [];
  return charts.flatMap((item) => {
    if (!isRecord(item) || !isRecord(item.options)) return [];
    return [
      {
        title: typeof item.title === "string" ? item.title : undefined,
        summary: typeof item.summary === "string" ? item.summary : undefined,
        options: item.options,
      },
    ];
  });
}

const buildChartMarkdownBlock = (
  chart: BusinessReportChart,
  index: number
) => {
  const parts = [`## ${chart.title || `Chart ${index + 1}`}`];
  if (chart.summary) parts.push(chart.summary);
  parts.push(`<echarts>${JSON.stringify(chart.options, null, 2)}</echarts>`);
  return parts.join("\n\n");
};

export function buildBusinessReportMarkdown(report: BusinessReportData) {
  const usedIndexes = new Set<number>();
  const body = (report.markdown ?? "").replace(
    chartPlaceholderPattern,
    (placeholder, rawIndex: string) => {
      const index = Number(rawIndex) - 1;
      const chart = report.charts[index];
      if (!chart) return placeholder;
      usedIndexes.add(index);
      return buildChartMarkdownBlock(chart, index);
    }
  );
  const sections = [`# ${report.title}`];
  if (report.summary) sections.push(`> ${report.summary}`);
  if (body.trim()) sections.push(body.trim());
  report.charts.forEach((chart, index) => {
    if (!usedIndexes.has(index)) {
      sections.push(buildChartMarkdownBlock(chart, index));
    }
  });
  return sections.join("\n\n");
}

export function splitBusinessReportMarkdown(
  markdown: string
): BusinessReportMarkdownPart[] {
  const result: BusinessReportMarkdownPart[] = [];
  let offset = 0;
  for (const match of markdown.matchAll(chartTagPattern)) {
    const index = match.index ?? 0;
    const before = markdown.slice(offset, index);
    if (before.trim()) result.push({ type: "markdown", content: before });
    try {
      const options = JSON.parse(match[1]) as unknown;
      if (isRecord(options)) result.push({ type: "chart", options });
    } catch {
      result.push({ type: "markdown", content: match[0] });
    }
    offset = index + match[0].length;
  }
  const remainder = markdown.slice(offset);
  if (remainder.trim()) result.push({ type: "markdown", content: remainder });
  return result;
}

export function getBusinessReportFileName(report: BusinessReportData) {
  return (report.fileName || report.title || "business-analysis-report")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim();
}

export function downloadBusinessReportFile(
  filename: string,
  content: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function renderBusinessReportMarkdownToHtml(markdown: string) {
  // Static rendering is intentionally loaded only for HTML export/preview.
  // Rendering through a temporary client root can lose a section when the
  // root is unmounted immediately after a synchronous render.
  const { prerender } = await import("react-dom/static.browser");
  const { prelude } = await prerender(
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
  );
  return new Response(prelude as unknown as BodyInit).text();
}

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

async function renderChartImage(options: Record<string, unknown>) {
  const { prepareEChartsRuntime } = await import("./echarts-runtime");
  const echarts = await prepareEChartsRuntime(options);
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.width = "900px";
  host.style.height = "360px";
  host.style.pointerEvents = "none";
  document.body.appendChild(host);
  let chart: ReturnType<typeof echarts.init> | undefined;
  try {
    chart = echarts.init(host, "default", { renderer: "canvas" });
    chart.setOption(
      {
        ...options,
        animation: false,
        backgroundColor: "#ffffff",
        toolbox: { show: false },
      },
      true
    );
    await nextFrame();
    await nextFrame();
    const source = chart.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      excludeComponents: ["toolbox"],
    });
    return source;
  } finally {
    chart?.dispose();
    host.remove();
  }
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function buildBusinessReportHtml(
  report: BusinessReportData,
  options: { autoPrint?: boolean; printMode?: boolean } = {}
) {
  const markdown = buildBusinessReportMarkdown(report);
  const parts = splitBusinessReportMarkdown(markdown);
  const body: string[] = [];
  for (const part of parts) {
    if (part.type === "markdown") {
      body.push(await renderBusinessReportMarkdownToHtml(part.content));
      continue;
    }
    try {
      const source = await renderChartImage(part.options);
      body.push(`<img class="report-chart" src="${source}" alt="" />`);
    } catch (error) {
      body.push(
        `<pre class="chart-error">${escapeHtml(
          error instanceof Error ? error.message : "Unable to render chart"
        )}</pre>`
      );
    }
  }
  const printMode = options.printMode === true;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(report.title)}</title>
    <style>
      * { box-sizing: border-box; }
      html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { margin: 0; color: #1f2937; background: ${
        printMode ? "#fff" : "#f5f5f5"
      }; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .report-shell { max-width: ${
        printMode ? "190mm" : "960px"
      }; margin: 0 auto; padding: ${printMode ? "0" : "32px 24px 64px"}; }
      .report-paper { background: #fff; border: ${
        printMode ? "0" : "1px solid #d4d4d4"
      }; border-radius: ${printMode ? "0" : "16px"}; padding: ${
        printMode ? "0" : "40px 48px"
      }; }
      h1, h2, h3 { color: #171717; break-after: avoid-page; }
      h1 { margin-top: 0; font-size: 32px; }
      p, li { line-height: 1.7; }
      blockquote { margin: 16px 0; padding: 12px 16px; border-left: 4px solid #525252; background: #f5f5f5; color: #525252; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d4d4d4; padding: 10px 12px; text-align: left; }
      pre { overflow: auto; white-space: pre-wrap; word-break: break-word; }
      .report-chart { display: block; width: 100%; height: auto; margin: 24px 0 32px; border: 1px solid #d4d4d4; break-inside: avoid; }
      .chart-error { color: #b91c1c; }
      @page { size: A4; margin: 12mm; }
      @media print { body { background: #fff; } .report-shell { max-width: none; padding: 0; } .report-paper { border: 0; padding: 0; } }
    </style>
  </head>
  <body>
    <main class="report-shell"><article class="report-paper">${body.join(
      ""
    )}</article></main>
    ${
      options.autoPrint
        ? `<script>
      window.addEventListener('load', async () => {
        if (document.fonts?.ready) {
          try {
            await document.fonts.ready;
          } catch {}
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => window.print());
        });
      });
    </script>`
        : ""
    }
  </body>
</html>`;
}

export async function printBusinessReport(report: BusinessReportData) {
  const html = await buildBusinessReportHtml(report, {
    autoPrint: true,
    printMode: true,
  });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(url);
    return false;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
