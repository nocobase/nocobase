---
title: "Roles & Permissions"
description: "CRM role system explained: which pages each role can access and which data they can operate on."
keywords: "role permissions,data permissions,menu permissions,department roles,NocoBase CRM"
---

# Roles & Permissions

> Different roles see different menus and can operate on different data when they log in to the CRM. This chapter answers one question: **"What can I see, and what can I do?"**

## What Is My Role?

Roles come from two sources:
1. **Personal role** — A role directly assigned to you by an Admin; it follows you wherever you go
   ![08-roles-2026-04-07-01-45-14](https://static-docs.nocobase.com/08-roles-2026-04-07-01-45-14.png)

2. **Department role** — A role bound to your department; you inherit it automatically when you join the department

![08-roles-2026-04-07-01-46-57](https://static-docs.nocobase.com/08-roles-2026-04-07-01-46-57.png)

Both sources stack. For example, if you personally have the "Sales Rep" role and are also added to the Marketing department, you hold the permissions of both the Sales and Marketing roles.

![en_08-roles](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/en_08-roles.png)

> \* **Sales Manager** and **Executive** are not bound to any department; they are assigned directly to individuals by the Admin.

---

## Pages Visible to Each Role

After logging in, the menu bar only shows pages you have permission to access:

![en_08-roles_1](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/en_08-roles_1.png)

> ¹ Sales Reps only see the SalesRep personal dashboard; they cannot see the SalesManager or Executive views.

![08-roles-2026-04-07-01-47-48](https://static-docs.nocobase.com/08-roles-2026-04-07-01-47-48.png)

---

## What Data Can I Operate On?

### Core Logic of Data Permissions

![en_08-roles_2](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/en_08-roles_2.png)

### Sales Rep Data Permissions

This is the most common role; here is a detailed breakdown:

![en_08-roles_3](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/en_08-roles_3.png)

**Why are leads visible to everyone?**
- You need to see "unassigned" leads to proactively claim them
- Deduplication requires access to the full dataset to avoid duplicate entries
- You can view other people's leads but cannot modify them

![08-roles-2026-04-07-01-48-42](https://static-docs.nocobase.com/08-roles-2026-04-07-01-48-42.png)

**Why are customers restricted to your own?**
- Customers are core assets with clear ownership
- Prevents access to other reps' customer contact information
- When a transfer is needed, ask your manager to handle it

![08-roles-2026-04-07-01-50-37](https://static-docs.nocobase.com/08-roles-2026-04-07-01-50-37.png)

**² Contacts follow the customer**

The contacts you can see:
1. Contacts you are directly responsible for
2. **All** contacts under customers you own (even if created by someone else)

> Example: If you own the "Huawei" customer, you can see all contacts under Huawei, regardless of who entered them.

![08-roles-2026-04-07-01-51-26](https://static-docs.nocobase.com/08-roles-2026-04-07-01-51-26.png)

### Other Roles' Data Permissions

| Role | Full management access | Other data |
|------|----------------------|------------|
| Sales Manager | All CRM data | — |
| Executive | — | All read-only + export |
| Finance | Orders, payments, exchange rates, quotations | Other read-only |
| Marketing | Leads, lead tags, analytics templates | Other read-only |
| Customer Success Mgr | Customers, contacts, activities, comments, customer merge | Other read-only |
| Technical Support | Activities, comments (own only) | Can view contacts they are responsible for |
| Product | Products, categories, tiered pricing | Other read-only |

---

## Deduplication: Solving the "I Can't See It" Problem

Because customer data is isolated by ownership, you cannot see other reps' customers. But before entering a new lead or customer, you need to confirm **whether someone is already working on it**.

![en_08-roles_4](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/en_08-roles_4.png)

The deduplication page supports three types of searches:

- **Lead dedup**: Search by name, company, email, or phone
- **Customer dedup**: Search by company name or phone
- **Contact dedup**: Search by name, email, or phone

Search results show **who the owner is**. If a match exists, contact the corresponding colleague directly to coordinate and avoid conflicts.

![08-roles-2026-04-07-01-52-51](https://static-docs.nocobase.com/08-roles-2026-04-07-01-52-51.gif)

---

## FAQ

**Q: I can't see a certain page. What should I do?**

Your role does not have access to that page. If you need it for your work, contact an Admin to adjust your permissions.

**Q: I can see data but there's no edit/delete button?**

You have view-only permission for that data. This is usually because you are not the owner. Buttons for actions you don't have permission for are hidden entirely rather than shown as disabled.

**Q: I just joined a new department. When do the permissions take effect?**

Immediately. Refresh the page to see the new menus.

**Q: Can one person have multiple roles?**

Yes. Personal roles and department roles stack. For example, if you are personally assigned the "Sales Rep" role and also join the Marketing department, you hold the permissions of both the Sales and Marketing roles.

## Related Pages

- [System Overview & Dashboard](./guide-overview) — How to use each dashboard
- [Lead Management](./guide-leads) — Full lead workflow
- [Customer Management](./guide-customers-emails) — Customer 360 view
