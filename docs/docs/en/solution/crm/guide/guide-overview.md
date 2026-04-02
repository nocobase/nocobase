---
title: "System Overview & Dashboards"
description: "CRM 2.0 system overview: menu structure, multi-language & themes, Analytics dashboard, Overview workspace."
keywords: "CRM overview,dashboard,analytics,KPI,NocoBase CRM"
---

# System Overview & Dashboards

> This chapter covers the two main dashboards — Analytics (data analysis center) and Overview (daily workspace).

## System Overview

CRM 2.0 is a complete sales management system covering the entire process from lead acquisition to order delivery. After logging in, the top menu bar is your main navigation entry.

### Multi-language & Themes

The system supports language switching (top-right corner). All JS blocks and charts are adapted for multiple languages.

Both light and dark themes are supported, but we currently **recommend light theme + compact mode** for higher information density. Some display issues in dark mode will be fixed in future updates.

![00-overview-2026-04-01-23-38-28](https://static-docs.nocobase.com/00-overview-2026-04-01-23-38-28.png)

---

## Analytics — Data Analysis Center

Analytics is the first page in the menu bar and the first screen you see when opening the system.

### Global Filters

At the top of the page, there is a filter bar with **Date Range** and **Owner** filter conditions. After filtering, all charts on the page refresh in sync.

![00-overview-2026-04-01-23-40-45](https://static-docs.nocobase.com/00-overview-2026-04-01-23-40-45.png)

### KPI Cards

Below the filter bar are 4 KPI cards:

| Card | Description | Click Behavior |
|------|-------------|----------------|
| **Total Revenue** | Cumulative revenue amount | Popup: payment status pie chart + monthly revenue trend |
| **New Leads** | Number of new leads in the period | Redirect to Leads page, auto-filtered to "New" status |
| **Conversion Rate** | Lead-to-deal conversion ratio | Popup: stage distribution pie chart + amount bar chart |
| **Avg Deal Cycle** | Average days from creation to close | Popup: cycle distribution + monthly won trend |

Each card supports **click-through drill-down** — popups show more detailed analysis charts. With customization capability, you can drill further (company → department → individual).

![00-overview-2026-04-01-23-42-33](https://static-docs.nocobase.com/00-overview-2026-04-01-23-42-33.gif)

:::tip[Data looks reduced after clicking?]
When you click a KPI card to jump to a list page, the URL carries filter parameters (e.g., `?status=new`). If you notice fewer records, it's because this parameter is still active. Navigate back to the dashboard and re-enter the list page to restore full data.
:::

![00-overview-2026-04-01-23-44-19](https://static-docs.nocobase.com/00-overview-2026-04-01-23-44-19.png)

### Charts Area

Below the KPIs are 5 core charts:

| Chart | Type | Description | Click Behavior |
|-------|------|-------------|----------------|
| **Opportunity Stage Distribution** | Bar chart | Count, amount, and weighted probability per stage | Popup: drill-through by customer/owner/month |
| **Sales Funnel** | Funnel | Lead → Opportunity → Quotation → Order conversion | Click to jump to corresponding entity page |
| **Monthly Sales Trend** | Bar + Line | Monthly revenue, order count, average order value | Jump to Orders page (with month parameter) |
| **Customer Growth Trend** | Bar + Line | Monthly new customers, cumulative total | Jump to Customers page |
| **Industry Distribution** | Pie chart | Customer distribution by industry | Jump to Customers page |

![00-overview-2026-04-01-23-46-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-46-36.png)

#### Sales Funnel

Shows the conversion rate across the full pipeline: Lead → Opportunity → Quotation → Order. Each layer is clickable, redirecting to the corresponding entity list page (e.g., clicking the Opportunity layer → jumps to the opportunity list).

#### Monthly Sales Trend

Bar chart shows monthly revenue, with line overlays for order count and average order value. Clicking a month's bar → jumps to the Orders page with that month's time filter pre-applied (e.g., `?month=2026-02`), showing that month's order details directly.

#### Customer Growth Trend

Bar chart shows monthly new customer count, line shows cumulative total. Clicking a month's bar → jumps to Customers page filtered to that month's new customers.

#### Industry Distribution

Pie chart shows customer distribution by industry with associated order amounts. Clicking an industry segment → jumps to Customers page filtered to that industry.

### Opportunity Stage Drill-through

Clicking a stage bar in the Opportunity Stage Distribution chart opens a deep analysis popup for that stage:

- **Monthly trend**: Monthly changes for opportunities in this stage
- **By owner**: Who is working on these opportunities
- **By customer**: Which customers have opportunities in this stage
- **Bottom summary**: Select customers to view cumulative amounts

![00-overview-2026-04-01-23-49-04](https://static-docs.nocobase.com/00-overview-2026-04-01-23-49-04.png)

Each stage (Prospecting / Analysis / Proposal / Negotiation / Won / Lost) has different drill-through content, reflecting the focus areas of each stage.

The core question this chart answers: **Where in the funnel is the most drop-off?** If the Proposal stage has many opportunities piling up but few moving to Negotiation, it suggests a problem in the quotation process.

![00-overview-2026-04-01-23-48-21](https://static-docs.nocobase.com/00-overview-2026-04-01-23-48-21.gif)

### Chart Configuration (Advanced)

Each chart has three configuration dimensions:

1. **SQL Data Source**: Determines what data the chart displays; you can verify queries in the SQL builder
2. **Chart Style**: JSON configuration in the customization area, controlling chart appearance
3. **Events**: Click behavior (popup OpenView / page redirect)

![00-overview-2026-04-01-23-51-00](https://static-docs.nocobase.com/00-overview-2026-04-01-23-51-00.png)

### Filter Linkage

When any filter condition in the top filter bar is changed, **all charts on the page refresh simultaneously** — no need to set filters individually. Typical usage:

- **View someone's performance**: Select an Owner → all page data switches to that person's leads, opportunities, and orders
- **Compare time periods**: Switch date range from "This Month" to "This Quarter" → trend chart ranges update in sync

The linkage between filter bar and charts is implemented through **page event flows** — form variables are injected before rendering, and charts reference filter values through variables in their SQL.

![00-overview-2026-04-01-23-52-29](https://static-docs.nocobase.com/00-overview-2026-04-01-23-52-29.png)

![00-overview-2026-04-01-23-53-57](https://static-docs.nocobase.com/00-overview-2026-04-01-23-53-57.png)

:::note
SQL templates currently only support `if` syntax for conditional logic. We recommend referencing existing templates in the system, or using AI to assist with modifications.
:::

---

## Overview — Daily Workspace

Overview is the second dashboard page, focused on daily operations rather than data analysis. The core question it answers: **What should I do today? Which leads are worth following up on?**

![00-overview-2026-04-01-23-56-07](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-07.png)

### Top Leads

Automatically filters leads with AI score ≥ 75 and status New / Working (Top 5), showing for each:

- **AI Score Gauge**: Circular gauge visually showing lead quality (green = high score = worth prioritizing)
- **AI Recommended Next Step**: System auto-recommends follow-up actions based on lead characteristics (e.g., "Schedule a demo")
- **Lead Basic Info**: Name, company, source, creation time

Click a lead name to jump to its details, or click "View All" to go to the leads list page. A quick glance at this table each morning tells you who to contact first.

![00-overview-2026-04-01-23-56-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-36.png)

### Today's Tasks

A list of today's activities (meetings, calls, tasks, etc.), supporting:

- **One-click complete**: Click "Done" to mark a task complete; it turns gray
- **Overdue reminder**: Unfinished overdue tasks are highlighted in red
- **View details**: Click the task name to open details
- **Create new**: Add a new activity record directly here

![00-overview-2026-04-01-23-57-09](https://static-docs.nocobase.com/00-overview-2026-04-01-23-57-09.png)

### Activity Calendar

FullCalendar view with activities color-coded by type (meetings/calls/tasks/emails/notes). Supports month/week/day switching, drag-to-reschedule, and click-to-view details.

![00-overview-2026-04-01-23-58-02](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-02.gif)

---

## Other Dashboards (More Charts)

Three additional dashboards for different roles are available in the menu. They are provided as references and can be hidden as needed:

| Dashboard | Target User | Features |
|-----------|-------------|----------|
| **Sales Manager** | Sales team leads | Team leaderboard, risk scatter plot, monthly targets |
| **Sales Rep** | Individual reps | Data auto-filtered by current user; shows only your own performance |
| **Executive** | VP Sales / C-Suite | Revenue forecast, customer health, Win/Loss trends |

![00-overview-2026-04-01-23-58-39](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-39.png)

Dashboards you don't need can be hidden from the menu without affecting system functionality.

![00-overview-2026-04-02-00-02-39](https://static-docs.nocobase.com/00-overview-2026-04-02-00-02-39.png)

---

## KPI Drill-through

You may have noticed that almost every number and chart above is "clickable." This is the core interaction pattern in the CRM — **KPI drill-through**: click a summary number → see the detailed data behind it.

Drill-through comes in two forms:

| Form | Use Case | Example |
|------|----------|---------|
| **Popup drill-through** | Multi-dimensional analysis | Click "Total Revenue" → popup shows pie chart + trends |
| **Page redirect** | View and operate on detail records | Click "New Leads" → jump to Leads list |

**Example**: In the Analytics "Monthly Sales Trend" chart, you notice February's revenue bar is notably low → click that bar → the system jumps to the Orders page with `month = 2026-02` pre-applied → you immediately see all February order details to investigate further.

> The dashboard isn't just for viewing — it's the system's navigation hub. Every number is an entry point, guiding you from macro to micro, layer by layer to the root cause.

---

After understanding the system layout and dashboards, go back to the [User Guide](./) for subsequent chapters.

## Related Pages

- [CRM User Guide](./)
- [Solution Overview](../index)
- [Installation](../installation)
