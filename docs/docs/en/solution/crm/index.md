# NocoBase CRM 2.0 Solution

> A modular sales management system based on the NocoBase low-code platform, with AI employee-assisted decision-making.

## 1. Background

### Challenges Sales Teams Face

Enterprise sales teams often encounter these problems in daily operations: inconsistent lead quality makes rapid screening difficult, opportunity follow-ups are easily missed, customer information is scattered across emails and various systems, sales forecasting relies entirely on experience, and quote approval processes are non-standardized.

**Typical Scenarios:** Rapid lead evaluation and assignment, opportunity health monitoring, customer churn alerts, multi-level quote approval, and linking emails with customers/opportunities.

### Target Users

B2B sales, project-based sales, and international trade sales teams in small-to-medium and medium-to-large enterprises. These organizations are upgrading from Excel/email management to systematic management and have high requirements for customer data security.

### Limitations of Existing Solutions

- **High cost**: Salesforce/HubSpot charge per seat, which is difficult for SMEs to afford.
- **Feature overload**: Large CRMs have bloated features and high learning costs; less than 20% of features are actually used.
- **Difficult to customize**: SaaS systems are hard to adapt to a company's own business processes—even changing a field requires a formal process.
- **Data security**: Customer data stored on third-party servers poses compliance and security risks.
- **High self-development cost**: Traditional custom development has long cycles and high maintenance costs, making it difficult to adjust quickly when business changes.

---

## 2. Differentiated Advantages

**Mainstream products on the market:** Salesforce, HubSpot, Zoho CRM, Odoo CRM, SuiteCRM, etc.

**Platform-level advantages:**

- **Configuration-first**: Data models, page layouts, and business processes are all configurable via UI—no code required.
- **Low-code rapid building**: Faster than custom development and more flexible than SaaS.
- **Modular and decomposable**: Each module is independently designed and can be trimmed as needed; the minimum viable setup requires only Customer and Opportunity modules.

**What traditional CRMs can't do or have prohibitive costs for:**

- **Data sovereignty**: Self-hosted deployment ensures customer data is stored on your own servers, meeting compliance requirements.
- **Native AI employee integration**: AI employees are deeply embedded in business pages and automatically perceive data context, rather than just being "an AI button."
- **All designs can be replicated**: Users can extend the solution based on templates independently, without vendor dependency.

---

## 3. Design Principles

- **Low cognitive cost**: Simple interface with core features visible at a glance.
- **Business before technology**: Focus on sales scenarios rather than technical showmanship.
- **Evolvable**: Supports phased rollouts and gradual improvements.
- **Configuration-first**: If it can be configured, don't write code.
- **Human-AI collaboration**: AI employees assist in decision-making rather than replacing the judgment of sales personnel.

---

## 4. Solution Overview

### Core Capabilities

- **Full-process management**: Lead → Opportunity → Quotation → Order → Customer Success.
- **Modular and trimmable**: Full version has 7 modules; minimum viable setup requires only 2 core modules.
- **Multi-currency support**: Automatic conversion for CNY/USD/EUR/GBP/JPY.
- **AI assistance**: Lead scoring, win rate prediction, and next-best-action suggestions.

### Core Modules

| Module | Required | Description | AI Assistance |
|------|:----:|------|--------|
| Customer Management | ✅ | Customer profiles, contacts, account hierarchy | Health assessment, churn alerts |
| Opportunity Management | ✅ | Sales funnel, stage progression, activity records | Win rate prediction, next-step suggestions |
| Lead Management | - | Lead entry, status flow, conversion tracking | Smart scoring |
| Quotation Management | - | Multi-currency, version management, approval workflows | - |
| Order Management | - | Order generation, payment tracking | - |
| Product Management | - | Product catalog, categories, tiered pricing | - |
| Email Integration | - | Send/receive emails, CRM association | Sentiment analysis, summary generation |

### Solution Trimming

- **Full Version** (All 7 modules): For B2B sales teams with complete processes.
- **Standard Version** (Customer + Opportunity + Quotation + Order + Product): For SME sales management.
- **Lite Version** (Customer + Opportunity): For simple customer and opportunity tracking.
- **International Trade Version** (Customer + Opportunity + Quotation + Email): For international trade enterprises.

---

## 5. AI Employees

The CRM system comes pre-configured with 5 AI employees deeply embedded in business pages. Unlike generic AI chat tools, they automatically recognize the data you are currently viewing—whether it's a lead list, opportunity details, or email records—without the need for manual copy-pasting.

**How to use**: Click the AI floating ball in the bottom right of the page, or click the AI icon next to a block to summon the corresponding employee. You can also preset common tasks for each employee to trigger them with one click next time.

| Employee | Role | Typical Use in CRM |
|------|------|-----------------|
| **Viz** | Insight Analyst | Lead channel analysis, sales trends, pipeline health |
| **Ellis** | Email Expert | Drafting follow-up emails, generating communication summaries |
| **Lexi** | Translation Assistant | Multilingual emails, international customer communication |
| **Dara** | Visualization Expert | Report and chart configuration, dashboard building |
| **Orin** | Task Planner | Daily priorities, next-step action suggestions |

### Business Value of AI Employees

| Value Dimension | Specific Impact |
|----------|----------|
| Efficiency | Lead scoring is completed automatically, saving manual screening; follow-up emails are drafted with one click. |
| Empowerment | Sales data analysis is always at your fingertips without waiting for the data team to generate reports. |
| Communication Quality | Professional emails + AI polishing; seamless multilingual communication for international trade teams. |
| Decision Support | Real-time win rate judgment and next-step suggestions reduce opportunity loss due to missed follow-ups. |

---

## 6. Highlights

**Modular and Decomposable** — Each module is independently designed and can be toggled individually. The minimum configuration requires only Customer and Opportunity modules; use only what you need.

**Complete Sales Loop** — Lead → Opportunity → Quotation → Order → Payment → Customer Success. Data is integrated across the entire chain, eliminating the need to switch between multiple systems.

**Native AI Employee Integration** — Not just "an AI button," but 5 AI employees integrated into every business page, automatically obtaining current data context to trigger analysis and suggestions with one click.

**Deep Email Integration** — Emails are automatically associated with customers, contacts, and opportunities. Supports Gmail and Outlook, with multiple English email templates covering common sales scenarios.

**Multi-currency Support** — Supports CNY/USD/EUR/GBP/JPY with configurable exchange rate conversion, suitable for international and multinational sales teams.

---

## 7. Installation and Usage

Use the NocoBase migration management feature to migrate the CRM application package to the target environment with one click.

**Ready out of the box:** Pre-configured Collections, Workflows, and dashboards, with multi-role views (Sales Manager/Sales Rep/Executive). 37 email templates cover common sales scenarios.

---

## 8. Roadmap

- **Opportunity Automation**: Stage progression triggers notifications, and stagnant opportunities trigger automatic alerts to reduce manual monitoring.
- **Approval Workflows**: Multi-level Quotation approval workflows with support for mobile approvals.
- **AI Automation**: AI employees embedded in Workflows to support automatic background execution for unattended lead scoring and opportunity analysis.
- **Mobile Adaptation**: Mobile-friendly interface for following up with customers anytime, anywhere.
- **Multi-tenant Support**: Horizontal expansion via Multi-workspace/Multi-app to allow independent operation for different sales teams.

---

*Document Version: v2.0 | Last Updated: 2026-02-06*