---
title: "Use NocoBase to build a linkable operational dashboard"
description: "Taking the work order operation dashboard as an example, the chart block, filter block and JS block are combined to achieve unified filtering, KPI, chart drill-down and custom styles."
keywords: "NocoBase, operational dashboard, data visualization, chart block, filter block, JS block, chart drill-down"
---

# Use NocoBase to build a linkable operational dashboard

This article takes the operation dashboard of the "work order system" as an example to introduce how to use NocoBase's chart block, filter block and JS block in combination to build a data dashboard that supports filter linkage, chart drill-down and custom styles.

Although the examples are from work order scenarios, these methods are also applicable to business systems such as CRM, equipment operations, project management, approval flow, customer success, etc.

:::tip
What this article wants to introduce is not "how to use JS blocks to write a large screen", but how to combine NocoBase's native block capabilities and JS blocks: Let the native blocks be responsible for standard capabilities, and let the JS blocks complement the personalized experience.
:::

![](https://static-docs.nocobase.com/202607121920705.png)

## scene target

We hope to build an Operations dashboard to help the operation or service team quickly determine the current workload:

- How many open work orders are there currently?
- Which work orders are at SLA risk?
- What is the trend in new work orders?
- What is the status and priority distribution of work orders?
- After clicking on a chart, you can view the corresponding details

The page can be roughly divided into four layers:

1. Top filter area: time, service group, request type, priority, SLA status
2. KPI statistics area: Open backlog, Unassigned, SLA warning, etc.
3. Chart analysis area: trend, status, SLA, priority distribution
4. Drill-down detail area: Click on the chart to display matching records

## First, clarify a construction idea

When many people make data dashboards, they tend to think of the problem as one of two options:

Either use all NocoBase's native blocks, which are simple to configure, but worry that the style and interaction are not flexible enough; or simply write a large JS block and control the query, chart, filtering, and drill-down by yourself, but this will lose the convenience brought by low-code configuration.

In fact, the more recommended way is to combine the two.

In this Operations dashboard, we did not write the entire page as a large JS screen, but split it according to responsibilities:

- Top filtering uses the filtering block that comes with the NocoBase system;
- Trend charts, status distribution, and SLA distribution use native chart blocks;
- KPI cards and drill-down details use JS blocks;
- Filter blocks affect both chart blocks and JS blocks;
- After the chart is clicked, the drill-down conditions are passed to the JS detail block below.

The advantage of this is that standard statistics and filtering still retain the configuration capabilities of NocoBase, while personalized display and complex interactions are completed by JS blocks. The page is neither "configurable only" nor "all code", but configuration and code each perform their own duties.

---

## 1. How to customize the style of the chart block

![](https://static-docs.nocobase.com/202607121920941.png)

The chart block of NocoBase can first use Query builder to define the statistical caliber, and then use the custom ECharts option to adjust the style.

Taking "work order status statistics" as an example, Query builder can be configured as:

- Datasheet: tickets
- Metrics: id count, alias ticketCount
- Dimensions: status

The key is that when customizing the style, you do not need to rewrite the query, you only need to process the chart display based on `ctx.data.objects`.

```javascript
const rows = Array.isArray(ctx.data?.objects) ? ctx.data.objects : [];
```

This line of code reads the chart query results. Then define status labels and colors:

```javascript
const labels = {
  new: ctx.t('New'),
  open: ctx.t('Open'),
  pending_customer: ctx.t('Pending customer'),
  resolved: ctx.t('Resolved'),
  closed: ctx.t('Closed'),
};

const colors = {
  new: '#1677ff',
  open: '#22a06b',
  pending_customer: '#f59f00',
  resolved: '#13c2c2',
  closed: '#8c8c8c',
};
```

It is recommended that all visible copywriting use `ctx.t()` to facilitate subsequent multi-language support.

When generating chart data, you can attach drill-down information to each chart data point:

```javascript
const data = rows.map((row) => ({
  value: Number(row.ticketCount || 0),
  itemStyle: {
    color: colors[row.status] || '#8c8c8c',
    borderRadius: [6, 6, 0, 0],
  },
  ticketingDrilldown: {
    label: ctx.t('Status') + ': ' + (labels[row.status] || row.status),
    filter: { status: { $eq: row.status } },
  },
}));
```

The most critical thing here is `ticketingDrilldown`. It is not a standard field of ECharts, but a business context that we put in ourselves, which will be used when clicking on the chart later.

Finally return to ECharts option:

```javascript
return {
  grid: { top: 28, right: 22, bottom: 48, left: 42 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: rows.map((row) => labels[row.status] || row.status),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: ctx.t('Tickets'),
      type: 'bar',
      barWidth: 36,
      data,
    },
  ],
};
```

The core idea of ​​this part is:

- Query builder is responsible for statistics;
- Custom option is responsible for visual expression;
- Custom fields are responsible for carrying drill-down context.

---

## 2. Let the system filter block become the observation scope of the entire page

![](https://static-docs.nocobase.com/202607121920687.png)

The filter area in the operational dashboard should not be just an isolated form. It represents the current observation diameter of the entire page.

For example, if the user selects a service group, a request type, and a creation time, then KPIs, trend charts, status distribution, and drill-down details should all be displayed based on the same set of conditions. Otherwise, the numbers in different blocks on the page will fight with each other, and it will be difficult for users to judge which data is the result within the current range.

Here we directly use the filtering block that comes with the NocoBase system instead of writing a filtering component ourselves. Native filter blocks can be naturally bound to chart blocks, allowing the chart block to continue to use the Query builder, permissions, refresh and filter mechanisms.

Top `Dashboard scope` can configure these filter items:

- Created at
- Service group
- Request type
- Priority
- SLA status

For JS blocks, you only need to read the same set of filter conditions in the code and then convert them into query filters. In this way, KPIs and drill-down details can also be consistent with the native chart.

The combination of filter conditions can be encapsulated into a small function:

```javascript
function combineFilters(...filters) {
  const parts = filters.filter(Boolean);
  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}
```

Count by filter:

```javascript
async function countTickets(filter) {
  const resource = ctx.makeResource('MultiRecordResource');
  resource.setResourceName('tickets');
  resource.setPageSize(1);

  if (filter) {
    resource.setFilter(filter);
  }

  await resource.refresh();

  const meta = resource.getMeta?.() || {};
  return Number(meta.count || meta.total || 0);
}
```

The key points here are:

```javascript
resource.setFilter(filter);
await resource.refresh();
```

The JS block queries business data through resources instead of writing SQL directly. This makes it easier to keep consistent with NocoBase's permissions, data sources, and page runtimes.

---

## 3. Use JS blocks to display KPI cards

![](https://static-docs.nocobase.com/202607121920374.png)

KPIs are better suited to use JS blocks. Because KPI is usually not a single query, but a combination of multiple business calibers: unfinished, unassigned, SLA warning, SLA breached, new, resolved, etc.

The JS block can requery data based on the current filtering range and render it into a statistical card.

```javascript
const { Card, Col, Row, Statistic, Tag } = ctx.libs.antd;

const scopeFilter = getDashboardScopeFilter();

const openBacklog = await countTickets(
  combineFilters(scopeFilter, {
    status: { $notIn: ['resolved', 'closed', 'cancelled'] },
  }),
);

ctx.render(
  <Row gutter={[12, 12]}>
    <Col span={6}>
      <Card size="small">
        <Tag color="blue">{ctx.t('Active')}</Tag>
        <Statistic title={ctx.t('Open backlog')} value={openBacklog} />
      </Card>
    </Col>
  </Row>,
);
```

The key points of JS blocks are:

- Use `ctx.makeResource()` to query data;
- Use `ctx.libs.antd` to render the interface;
- Use `ctx.render()` to output content;
- Re-render JS chunks after filtering changes.

In a real page, the filter button and reset button can configure the event flow so that they refresh the KPI JS block and drill-down JS block at the same time after completing the native filter action. In this way, the user clicks once to filter, and both charts and custom content will be updated based on the same range.

---

## 4. Chart linkage JS block for drill-down

![](https://static-docs.nocobase.com/202607121921577.png)

Clicking on the chart to drill down is a very practical interaction in the dashboard.

In the work order scenario, the user clicks the "Status: Open" column, and all Open work orders are displayed in the detail area below; when the user clicks "SLA breached", all overtime work orders are displayed below.

The implementation idea is:

1. Chart data points carry `ticketingDrilldown`;
2. The chart event reads this drill-down information;
3. Write drill-down information into the target JS block context;
4. Trigger the target JS block to re-render.

The key code in the chart event is as follows. First find the drill-down JS block:

```javascript
const DRILLDOWN_TARGET_UID = 'v7mioopm6rm';

function getDrilldownTarget() {
  if (typeof ctx.getModel === 'function') {
    return ctx.getModel(DRILLDOWN_TARGET_UID);
  }

  const engine =
    ctx.model?.flowEngine || ctx.model?.context?.flowEngine || ctx.engine;
  return engine?.getModel?.(DRILLDOWN_TARGET_UID);
}
```

Then write the drill-down conditions obtained by clicking on the chart into the target block:

```javascript
function applyDrilldown(drilldown) {
  if (!drilldown?.filter) return;

  const target = getDrilldownTarget();
  if (!target?.context?.defineProperty) return;

  target.context.defineProperty('ticketingDashboardDrilldown', {
    value: drilldown,
  });

  target.rerender?.();
}
```

The most critical are these two lines:

```javascript
target.context.defineProperty('ticketingDashboardDrilldown', {
  value: drilldown,
});
target.rerender?.();
```

The first line passes the drill-down condition to the JS block, and the second line triggers the JS block refresh.

Finally bind the chart click event:

```javascript
const clickHandler = (params) => {
  applyDrilldown(params?.data?.ticketingDrilldown);
};

chart.on('click', clickHandler);

return () => chart.off('click', clickHandler);
```

It is recommended here that you must return cleanup:

```javascript
return () => chart.off('click', clickHandler);
```

In this way, when the chart is reconfigured or re-rendered, old events can be cleaned up to avoid repeated binding.

The above click event-related code is applicable to [v2.2.0-beta.10](https://github.com/nocobase/nocobase/releases/tag/v2.2.0-beta.10) and above versions. Reference to the old version code:

```javascript
chart.off('click');
chart.on('click', clickHandler);
```

---

## 5. How to display details in drill-down JS blocks

![](https://static-docs.nocobase.com/202607121921601.png)

Drill down into the JS block to read the `ticketingDashboardDrilldown` just written, and then query the data according to the filter in it.

```javascript
const drilldown = ctx.model?.context?.ticketingDashboardDrilldown;

if (!drilldown) {
  ctx.render(
    <Alert
      type="info"
      showIcon
      message={ctx.t('Select a chart segment to inspect matching tickets')}
    />,
  );
  return;
}
```

If the user has not clicked on the chart, display a prompt. After clicking, query the work order based on `drilldown.filter`:

```javascript
const resource = ctx.makeResource('MultiRecordResource');
resource.setResourceName('tickets');
resource.setFilter(drilldown.filter);
resource.setPageSize(10);
await resource.refresh();

const rows = resource.getData?.() || [];
```

Then render the table:

```javascript
const { Table, Typography } = ctx.libs.antd;

ctx.render(
  <>
    <Typography.Title level={5}>
      {ctx.t('Drilldown')}: {drilldown.label}
    </Typography.Title>

    <Table
      size="small"
      rowKey="id"
      dataSource={rows}
      pagination={false}
      columns={[
        { title: ctx.t('Ticket No'), dataIndex: 'ticketNo' },
        { title: ctx.t('Title'), dataIndex: 'title' },
        { title: ctx.t('Status'), dataIndex: 'status' },
        { title: ctx.t('Priority'), dataIndex: 'priority' },
      ]}
    />
  </>,
);
```

If you need to clear drill-down conditions, you can refer to

```javascript
function clearChartDrilldown() {
  if (ctx.model?.context?.defineProperty) {
    ctx.model.context.defineProperty('ticketingDashboardDrilldown', {
      value: null,
    });
  }
  if (typeof ctx.model?.rerender === 'function') {
    ctx.model.rerender();
  }
}
```

The key points in this part are:

- The chart is only responsible for passing the filter;
- The JS block is responsible for querying and displaying details;
- Click on different charts to share the same drill-down block.

---

## Practical suggestions

### 1. Don’t rush to code the complex page as a whole

The most important lesson from this page is: don’t pit native capabilities against JS capabilities.

If a capability is already a native capability of NocoBase, such as filtering, chart query, table display, and permission control, the native block will be used first. In this way, when fields, filter conditions, and chart caliber are subsequently adjusted, they can still be configured on the interface.

JS blocks are more suitable for processing parts that native blocks are not good at, such as combining multiple indicators into a set of KPIs, special card styles, displaying a set of custom details after clicking on the chart, or passing business context between different blocks.

In other words, the native block is responsible for "configurable standard capabilities", and the JS block is responsible for "business-oriented personalized experience". This is also the most reusable construction idea for this dashboard.

### 2. For simple statistics, use the chart block Query builder first.

This preserves NocoBase's standard query, permissions, filtering and refreshing capabilities. Only when the default chart style cannot express the business focus, use the customized ECharts option for visual optimization.

### 3. KPI cards give priority to using JS blocks

KPIs often require multiple queries, condition combinations, and custom layouts, and JS blocks are more flexible. Especially when KPIs need to respond to the same set of system filter conditions, it will be clearer to use JS blocks to handle them uniformly.

### 4. Chart events should return cleanup

Recommended writing method:

```javascript
const handler = (params) => {
  // handle click
};

chart.on('click', handler);

return () => chart.off('click', handler);
```

Do not directly use `chart.off('click')` to clear all click events, as this may accidentally delete the chart block or configure the panel's own monitoring.

---

## Let AI help you build it

This type of dashboard is very suitable for AI-assisted generation because it involves data models, statistical calibers, chart styles, and page interactions at the same time. You can hand it the content of this article and ask questions using the prompt words below.

You can ask questions like this:

```markdown
I am using NocoBase to build an operational dashboard for a work order system.
Please take the work order scenario as an example and help me design an Operations dashboard.

The data table tickets contains:
ticketNo、title、status、priority、slaStatus、
requestType、serviceGroup、assignee、createdAt、updatedAt。

The page requires:

1. Top filter: Created at, Service group, Request type, Priority, SLA status.
2. KPI cards: Open backlog, Unassigned, SLA warning, SLA breached, New tickets, Resolved tickets.
3. Chart: Created tickets trend, Ticket status, SLA status, Priority mix.
4. After clicking on the chart, the JS block below displays the matching Ticket drilldown table.
5. The chart style should be suitable for the operating market, with clear colors and compact layout.
6. Use ctx.t() for all JS copy.
7. Chart events use chart.on and return the cleanup function.
8. Prioritize using NocoBase’s native filter blocks and chart blocks. Only use JS blocks for KPIs, drill-down details, special styles, and cross-block interactions. Do not write the entire page as one large JS block.

Please give the configuration ideas for each block and mark the key JS code.
```

If you already have a page, you can also let AI help you optimize it:

```markdown
This is my current NocoBase dashboard design:
At the top is the filter area, in the middle are 4 charts, and below is the drill-down JS block.
Please help me optimize from the perspective of operator experience:

1. What indicators should the KPI display?
2. Whether there is a need for linkage between charts;
3. Which columns should be displayed in drill-down details;
4. How should JS block and chart events be organized;
5. Which code should be placed in the chart custom option and which should be placed in the JS block.
```

In this way, the content generated by AI will be closer to the real business, rather than just giving isolated code.

:::warning
If you choose to let AI help you build it, please use the backup manager to back up the project before starting.
:::

## Reference documentation

- [Chart configuration ](/data-visualization/guide/chart-options)
- [Frontend RunJS](/runjs/)
- [Filter form ](/interface-builder/blocks/filter-blocks/form)
- [AI Construction - Interface Construction ](/ai-builder/ui-builder)
- [ECharts Options](https://echarts.apache.org/en/option.html)
