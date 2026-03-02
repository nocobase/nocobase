# NocoBase CRM 2.0 Solution

> A modular sales management system built on the NocoBase low-code platform, with AI employee assistance

## 1. Background

### Challenges Sales Teams Face

Sales teams commonly encounter these problems: inconsistent lead quality makes fast screening difficult, opportunity follow-ups slip through the cracks, customer information is scattered across emails and multiple systems, sales forecasts rely on gut feeling, and quote approval processes are ad hoc.

**Typical scenarios:** rapid lead evaluation and assignment, opportunity health monitoring, customer churn alerts, multi-level quote approvals, linking emails to customers and opportunities.

### Target Users

B2B sales, project-based sales, and cross-border trade teams at small-to-mid and mid-to-large enterprises. These organizations are graduating from Excel/email management to systematic operations and have high requirements for customer data security.

### Limitations of Existing Solutions

- **High cost**: Salesforce/HubSpot charge per seat, which is unaffordable for most SMEs
- **Feature overload**: Enterprise CRMs are bloated; less than 20% of features are actually used, yet learning costs are high
- **Hard to customize**: SaaS systems cannot easily adapt to your own business processes — even changing a field requires a ticket
- **Data security**: Customer data stored on third-party servers creates compliance and security risks
- **Expensive to build in-house**: Custom development has long cycles and high maintenance costs; adapting to business changes is slow

---

## 2. Differentiated Advantages

**Competing products on the market:** Salesforce, HubSpot, Zoho CRM, Fxiaoke, Odoo CRM, SuiteCRM, etc.

**Platform-level advantages:**

- **Configuration-first**: Data models, page layouts, and business processes are all configurable via UI — no code required
- **Low-code rapid deployment**: Faster than custom development, more flexible than SaaS
- **Modular and decomposable**: Modules are independently designed and can be toggled as needed; minimum viable setup requires only Customer + Opportunity

**What traditional CRMs can't do, or can only do at prohibitive cost:**

- **Data sovereignty**: Self-hosted deployment — your customer data stays on your own servers, meeting compliance requirements
- **Native AI employee integration**: AI employees are deeply embedded in business pages and automatically read data context — not just "an AI button"
- **All designs are reproducible**: Users can extend the solution template independently, without vendor dependency

---

## 3. Design Principles

- **Low cognitive load**: Clean interface, core features are immediately visible
- **Business before technology**: Focus on sales scenarios, not technical showmanship
- **Evolvable**: Supports phased rollout and incremental improvement
- **Configuration over code**: If it can be configured, don't write code
- **Human-AI collaboration**: AI employees assist decision-making; they don't replace salespeople's judgment

---

## 4. Solution Overview

### Core Capabilities

- **End-to-end pipeline**: Lead → Opportunity → Quotation → Order → Customer Success
- **Modular**: Full version has 7 modules; minimum viable setup needs only 2 core modules
- **Multi-currency**: CNY/USD/EUR/GBP/JPY with automatic conversion
- **AI assistance**: Lead scoring, win probability prediction, next-best-action suggestions

### Core Modules

| Module | Required | Description | AI Assistance |
|--------|:--------:|-------------|--------------|
| Customer Management | ✅ | Customer profiles, contacts, account hierarchy | Health scoring, churn alerts |
| Opportunity Management | ✅ | Sales funnel, stage progression, activity log | Win probability, next-step suggestions |
| Lead Management | — | Lead entry, status flow, conversion tracking | Smart scoring |
| Quotation Management | — | Multi-currency, version control, approval workflow | — |
| Order Management | — | Order creation, payment tracking | — |
| Product Management | — | Product catalog, categories, tiered pricing | — |
| Email Integration | — | Send/receive emails, CRM association | Sentiment analysis, summary generation |

### Solution Editions

- **Enterprise** (all 7 modules): Full-process B2B sales teams
- **Standard** (Customer + Opportunity + Quotation + Order + Product): SME sales management
- **Lite** (Customer + Opportunity): Simple customer and opportunity tracking
- **Trade** (Customer + Opportunity + Quotation + Email): Cross-border trade teams

---

## 5. AI Employees

The CRM comes pre-loaded with 5 AI employees, deeply embedded in business pages. Unlike generic AI chat tools, they automatically recognize the data you're currently viewing — whether a lead list, opportunity details, or email thread — no copy-pasting required.

**How to use**: Click the AI floating button in the lower-right corner of any page, or click the AI icon next to a block to summon the corresponding employee. You can also pre-configure common tasks for each employee and trigger them with a single click next time.

| Employee | Role | Typical Use in CRM |
|----------|------|--------------------|
| **Viz** | Insight Analyst | Lead channel analysis, sales trends, pipeline health |
| **Ellis** | Email Expert | Draft follow-up emails, generate communication summaries |
| **Lexi** | Translation Assistant | Multilingual emails, cross-border customer communication |
| **Dara** | Visualization Expert | Configure report charts, build dashboards |
| **Orin** | Task Planner | Daily priorities, next-step action suggestions |

### Business Value of AI Employees

| Value Dimension | Specific Impact |
|-----------------|----------------|
| Efficiency | Lead scoring done automatically, saving manual screening time; follow-up emails drafted in one click |
| Empowerment | Sales data analysis always at your fingertips — no waiting for the data team |
| Communication quality | Professional emails + AI polish; cross-border teams communicate fluently in multiple languages |
| Decision support | Real-time win probability and next-step suggestions reduce deals lost to missed follow-ups |

---

## 6. Highlights

**Modular** — Each module is independently designed and can be toggled on or off. The minimum setup needs only Customer + Opportunity. Start lean, grow as needed.

**Complete sales loop** — Lead → Opportunity → Quotation → Order → Payment → Customer Success. Full end-to-end data flow with no need to switch between systems.

**Native AI employee integration** — Not just "an AI button." 5 AI employees are embedded in every business page, automatically reading current data context and delivering analysis and suggestions with one click.

**Deep email integration** — Emails are automatically linked to customers, contacts, and opportunities. Supports Gmail and Outlook. Multiple English email templates cover common sales scenarios.

**Multi-currency trade support** — Supports CNY/USD/EUR/GBP/JPY with configurable exchange rate conversion, designed for cross-border and international sales teams.

---

## 7. Getting Started

Deploy the CRM package to your target environment using NocoBase's migration manager for one-click import.

**Ready out of the box:** Pre-built data tables, workflows, and dashboards. Multi-role views (Sales Manager / Sales Rep / Executive). 37 email templates covering common sales scenarios.

---

## 8. Roadmap

- **Opportunity automation**: Stage progression triggers notifications; stagnant opportunities auto-alert, reducing manual oversight
- **Approval workflows**: Multi-level quote approval with mobile approval support
- **AI automation**: AI employees embedded in workflows for unattended background execution — automated lead scoring and opportunity analysis
- **Mobile-friendly**: Mobile-optimized interface for on-the-go customer follow-up
- **Multi-tenant support**: Horizontal scaling across spaces/applications, distributing to independent sales teams

---

*Document Version: v2.0 | Last Updated: 2026-02-06*
