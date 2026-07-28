import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const {
    buildBusinessReportMarkdown,
    renderBusinessReportMarkdownToHtml,
    splitBusinessReportMarkdown,
  } = await server.ssrLoadModule(
    "/registry/nocobase-ai/components/tools/business-report-utils.tsx"
  );

  const markdown = buildBusinessReportMarkdown({
    title: "Quarterly report",
    summary: "A complete report summary.",
    markdown: `## KPI overview

| Metric | Value |
| --- | ---: |
| Revenue | 1286 |

{{chart:1}}

## Trend analysis

The trend continued after the first chart.

{{chart:2}}

## Recommendations

Keep the final section in the exported HTML.`,
    charts: [
      { title: "Trend", options: { series: [{ type: "line", data: [1, 2] }] } },
      { title: "Mix", options: { series: [{ type: "pie", data: [1, 2] }] } },
    ],
  });
  const parts = splitBusinessReportMarkdown(markdown);

  assert.equal(parts.length, 5);
  assert.equal(parts[0].type, "markdown");
  assert.match(parts[0].content, /Quarterly report/);
  assert.match(parts[0].content, /KPI overview/);
  assert.equal(parts[1].type, "chart");
  assert.match(parts[2].content, /Trend analysis/);
  assert.equal(parts[3].type, "chart");
  assert.match(parts[4].content, /Recommendations/);

  const firstSectionHtml = await renderBusinessReportMarkdownToHtml(
    parts[0].content
  );
  assert.match(firstSectionHtml, /<h1>Quarterly report<\/h1>/);
  assert.match(firstSectionHtml, /<h2>KPI overview<\/h2>/);
  assert.match(firstSectionHtml, /<table>/);
  assert.match(firstSectionHtml, /Revenue/);

  console.log("AI business report regression tests passed");
} finally {
  await server.close();
}

// React's browser prerender runtime keeps an internal MessagePort alive in
// Node even after the assertion and Vite server have completed.
process.exit(0);
