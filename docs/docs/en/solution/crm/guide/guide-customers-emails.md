---
title: "Customers, Contacts & Emails"
description: "CRM customer 360 view, AI health score, customer merge, contact role management, email send/receive with AI assistance, and activity log."
keywords: "customer management,contacts,email,health score,customer merge,NocoBase CRM"
---

# Customers, Contacts & Emails

> Customers, contacts, and emails are three tightly linked modules — the customer is the entity, contacts are the people you communicate with, and emails are the communication records. This chapter covers all three together.

![en_04-customers-emails](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/en_04-customers-emails.png)

## Customer Management

Navigate to the **Customers** page from the top menu. It contains two tabs: Customer List and Customer Merge Tool.

### Customer List

Filter buttons above the list:

| Filter | Description |
|--------|-------------|
| **All** | All customers |
| **Active** | Active customers |
| **Potential** | Potential customers, not yet closed |
| **Dormant** | Dormant customers, no interaction for a long time |
| **Key Accounts** | Key accounts / major customers |
| **New This Month** | Added this month |


![04-customers-emails-2026-04-07-01-32-03](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-32-03.png)


**Key columns**:

- **AI Health Score**: Ring progress bar 0–100 (🟢 70–100 Healthy / 🟡 40–69 Warning / 🔴 0–39 Critical)
- **Last Activity**: Relative time + color coding — the longer since last contact, the darker the color

### Customer Detail

Click a customer name to open the detail popup, which contains **3 tabs**:

| Tab | Content |
|-----|---------|
| **Details** | Customer profile, stat cards, contacts, opportunities, comments |
| **Emails** | All emails with this customer's contacts, 5 AI buttons |
| **Change History** | Field-level audit log |

The **Details tab** uses a left 2/3 + right 1/3 two-column layout:

- **Left column**: Customer avatar (color-coded by tier: Normal=gray, Important=amber, VIP=gold), 4-column summary (tier/size/region/type), stat cards (total closed amount / active opportunities / interactions this month, real-time API queries), contact list, opportunity list, comment section
- **Right column**: AI smart profile (AI tags, health score ring chart, churn risk, best contact time, communication strategy)

![04-customers-emails-2026-04-07-01-33-47](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-33-47.png)

### AI Health Score

The health score is automatically calculated across these dimensions: interaction frequency, opportunity activity, order status, and contact coverage.

Recommended usage:

1. Open the customer list daily and sort by health score
2. Prioritize red (Critical) customers — they may be churning
3. Yellow (Warning) customers — schedule lightweight follow-ups
4. Green (Healthy) customers — maintain normal cadence

### Customer Merge

When duplicate customer records appear, use the merge tool to clean up:

1. **Initiate merge**: Select multiple customers in the customer list → click the "Customer Merge" button
2. **Enter the merge tool**: Switch to the second tab to view the merge request list (Pending / Merged / Cancelled)
3. **Execute merge**: Select the master record → compare field differences side by side → preview → confirm. A backend workflow automatically migrates all related data (opportunities, contacts, activities, comments, orders, quotations, sharing) and deactivates the merged customer

![04-customers-emails-2026-04-07-01-35-37](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-35-37.png)

![04-customers-emails-2026-04-07-01-38-07](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-07.png)

:::tip[Review carefully before merging]
Customer merge is an irreversible operation. Before executing, carefully verify the master record selection and field value choices.
:::


![04-customers-emails-2026-04-07-01-37-44](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-37-44.gif)

---

## Contact Management

Navigate to the **Settings → Contacts** page from the top menu.

### Contact Information

| Field | Description |
|-------|-------------|
| Name | Contact name |
| Company | Associated company (linked to customer record) |
| Email | Email address (used for automatic email association) |
| Phone | Phone number |
| Role | Role tag |
| Level | Contact level |
| Primary Contact | Whether this is the customer's primary contact |

### Role Tags

| Role | Meaning |
|------|---------|
| Decision Maker | Decision maker |
| Influencer | Influencer |
| Technical | Technical lead |
| Procurement | Procurement lead |

![04-customers-emails-2026-04-07-01-38-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-26.png)

### Sending Emails from a Contact

Open the contact detail page. Similar to other data management views, it includes tabs for details, emails, field records, etc.

![04-customers-emails-2026-04-07-01-38-52](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-52.png)

---

### Email & CRM Integration

Emails are automatically linked to customers, contacts, and opportunities:

- Customer detail "Emails" tab → all emails with that customer's contacts
- Contact detail → the contact's complete email history
- Opportunity detail → related communication records

The association is done through views, automatically matching based on the contact's email address.

![04-customers-emails-2026-04-07-01-40-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-40-26.png)

![04-customers-emails-2026-04-07-01-41-13](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-13.png)

### AI Email Assistance

The email page provides 6 AI-assisted scenarios:

| Scenario | Function |
|----------|----------|
| **Proposal Draft** | AI generates a proposal email based on customer and opportunity context |
| **Follow-up Email** | AI generates a follow-up email with the appropriate tone |
| **Email Analysis** | AI analyzes email sentiment and key points |
| **Email Summary** | AI generates a summary of the email thread |
| **Customer Context** | AI compiles the customer's background information |
| **Executive Briefing** | AI extracts key information from the email thread to generate a briefing |

![04-customers-emails-2026-04-07-01-41-46](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-46.png)

---

## Activity Log

Navigate to the **Settings → Activities** page from the top menu. This is the central log for all customer interactions.

| Activity Type | Description |
|---------------|-------------|
| Meeting | Meeting |
| Call | Phone call |
| Email | Email |
| Visit | On-site visit |
| Note | Note |
| Task | Task |

![04-customers-emails-2026-04-07-01-42-20](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-42-20.png)

Activity records also appear in the calendar view on the Overview dashboard.

---

## Related Pages

- [CRM User Guide](./index.md)
- [Lead Management](./guide-leads) — Leads automatically create customers and contacts upon conversion
- [Opportunity Management](./guide-opportunities) — Opportunities linked to customers
- [AI Employees](./guide-ai)
