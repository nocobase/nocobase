# NocoBase 2.0 Beginner Tutorial

This tutorial walks you through building a **minimal IT HelpDesk system** from scratch using NocoBase 2.0. The entire system requires only **2 data tables** and zero code, yet delivers ticket submission, category management, change tracking, access control, and a data dashboard.

## About This Tutorial

- **Target audience**: Business users, technical users, or anyone interested in NocoBase (some computer background is recommended)
- **Case project**: A minimal IT HelpDesk system with only 2 tables
- **Estimated time**: 2-3 hours (non-technical), 1-1.5 hours (technical users)
- **Prerequisites**: Docker environment or [Online Demo](https://demo.nocobase.com/new) (24-hour trial, no installation needed)
- **Version**: NocoBase 2.0

## What You'll Learn

Through 7 hands-on chapters, you'll master the core concepts and workflow of NocoBase:

| # | Chapter | Key Topics |
|---|---------|------------|
| 1 | [Getting Started — Up and Running in 5 Minutes](./01-getting-started/) | Docker install, UI Editor vs Usage mode |
| 2 | [Data Modeling — Building the Skeleton](./02-data-modeling/) | Collections, Fields, Relations |
| 3 | [Building Pages — Making Data Visible](./03-building-pages/) | Blocks, Table block, Filtering & Sorting |
| 4 | [Forms & Details — Entering Data](./04-forms-and-details/) | Form blocks, Field linkage |
| 5 | [Users & Permissions — Who Sees What](./05-roles-and-permissions/) | Roles, Menu permissions, Data permissions |
| 6 | [Workflows — Automation](./06-workflows/) | Notifications, Triggers |
| 7 | [Dashboard — The Big Picture](./07-dashboard/) | Charts, Markdown blocks |

## Data Model Preview

This tutorial is built around a minimal data model — just **2 tables**, but enough to cover data modeling, page building, form design, access control, workflows, and dashboards.

| Table | Key Fields |
|-------|-----------|
| Tickets | Title, Description, Status, Priority |
| Categories | Name, Color |

## FAQ

### What is NocoBase best suited for?

Internal business tools, data management systems, approval workflows, CRM, ERP, and other scenarios requiring flexible customization with self-hosted deployment.

### What prerequisites do I need?

No programming required, but some basic computer knowledge is recommended. The tutorial explains concepts like tables, fields, and relationships step by step. Experience with databases or spreadsheets is a plus.

### Can the tutorial system be extended?

Yes. This tutorial uses only 2 tables, but NocoBase supports complex multi-table relationships, external API integrations, and custom plugins.

### What deployment environment is needed?

Docker is recommended (Docker Desktop or Linux server), minimum 2 cores and 4GB RAM. Git source installation is also supported. For learning purposes, you can also request an [Online Demo](https://demo.nocobase.com/new) — no installation needed, valid for 24 hours.

### Are there limitations in the free version?

Core features are fully free and open-source. The commercial edition offers additional premium plugins and technical support. See [commercial pricing](https://www.nocobase.com/en/commercial) for details.

## Tech Stack

NocoBase 2.0 is built on:

- **Frontend**: React + [Ant Design](https://ant.design/) 5.0
- **Backend**: Node.js + Koa
- **Database**: PostgreSQL (also supports [MySQL](/get-started/installation/docker), MariaDB)
- **Deployment**: [Docker](/get-started/installation/docker), Kubernetes

## Platform Comparison

If you're evaluating no-code/low-code platforms:

| Platform | Highlights | Difference from NocoBase |
|----------|-----------|--------------------------|
| [Appsmith](https://www.appsmith.com/) | Open-source, strong frontend customization | NocoBase is more data-model driven |
| [Retool](https://retool.com/) | Internal tool platform | NocoBase is fully open-source, no usage limits |
| [Airtable](https://airtable.com/) | Online collaborative database | NocoBase supports self-hosted deployment |
| [Budibase](https://budibase.com/) | Open-source low-code, self-hostable | NocoBase has stronger plugin architecture |

## Related Docs

### Getting Started
- [How NocoBase Works](/get-started/how-nocobase-works) — Core concepts overview
- [Quick Start](/get-started/quickstart) — Installation and initial setup
- [System Requirements](/get-started/system-requirements) — Hardware and software requirements

### More Tutorials
- [NocoBase 1.x Tutorials](/tutorials/v1/) — Task management system tutorial with advanced topics

### Solutions
- [Ticket System Solution](/solution/ticket-system/) — AI-powered intelligent ticket management
- [CRM Solution](/solution/crm/) — Customer relationship management
- [AI Employees](/ai-employees/quick-start) — Add AI capabilities to your system

Ready? Let's start with [Chapter 1: Getting Started](./01-getting-started/)!
