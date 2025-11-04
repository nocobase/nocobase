---
pkg: "@nocobase/plugin-data-visualization"
---

# Overview

The NocoBase data visualization plugin provides visual data querying and a rich set of chart components. With simple configuration, you can quickly build dashboards, present insights, and support multi-dimensional analysis and display.


![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)


## Basic concepts
- Chart block: A configurable chart component on a page that supports data query, chart options, and interaction events.
- Data query (Builder/SQL): Configure visually with the Builder or write SQL to fetch data.
- Measures and Dimensions: Measures are used for numeric aggregation; Dimensions group data (for example, date, category, region).
- Field mapping: Map query result columns to core chart fields such as `xField`, `yField`, `seriesField`, or `Category / Value`.
- Chart options (Basic/Custom): Basic configures common properties visually; Custom returns a full ECharts `option` via JS.
- Run query: Run the query and fetch data in the configuration panel; switch to Table / JSON to inspect returned data.
- Preview and Save: Preview is temporary; clicking Save writes the configuration to the database and applies it.
- Context variables: Reuse page, user, and filter context (for example, `{{ ctx.user.id }}`) in queries and chart configuration.
- Filters and linkage: Page-level filter blocks collect unified conditions, automatically merge into chart queries, and refresh linked charts.
- Interaction events: Register events via `chart.on` to enable highlight, navigation, and drill-down.

## Installation
Data visualization is a built-in NocoBase plugin; it works out of the box with no separate installation required.