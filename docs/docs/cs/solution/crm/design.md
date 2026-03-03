# CRM 2.0 System Design

## 1. System Overview & Design Philosophy

### 1.1 System Positioning

This system is a **CRM 2.0 Sales Management Platform** built on the NocoBase no-code platform. The core goal is:

```
Let salespeople focus on building customer relationships,
not data entry and repetitive analysis.
```

The system automates routine tasks through workflows and leverages AI to assist with lead scoring, opportunity analysis, and more — helping sales teams work more efficiently.

### 1.2 Design Philosophy

#### Principle 1: Complete Sales Funnel

**End-to-end sales flow:**

![design_en-2026-02-24-00-22-45](https://static-docs.nocobase.com/design_en-2026-02-24-00-22-45.png)

**Why design it this way?**

| Traditional Approach | Integrated CRM |
|---------------------|----------------|
| Multiple systems for different stages | Single system covering the full lifecycle |
| Manual data transfer between systems | Automatic data flow and conversion |
| Inconsistent customer views | Unified 360° customer view |
| Fragmented data analysis | End-to-end pipeline analysis |

#### Principle 2: Configurable Sales Pipeline

![design_en-2026-02-24-00-23-08](https://static-docs.nocobase.com/design_en-2026-02-24-00-23-08.png)

Different industries can customize pipeline stages without modifying code.

#### Principle 3: Modular Design

- Core modules (Customers + Opportunities) are required; all others are optional
- Disabling a module requires no code changes — configure via the NocoBase admin UI
- Each module is independently designed to minimize coupling

---

## 2. Module Architecture & Customization

### 2.1 Module Overview

The CRM system uses a **modular architecture** — each module can be independently enabled or disabled based on business needs.

![design_en-2026-02-24-00-23-19](https://static-docs.nocobase.com/design_en-2026-02-24-00-23-19.png)

### 2.2 Module Dependencies

| Module | Required | Depends On | When to Disable |
|--------|:--------:|-----------|----------------|
| **Customer Management** | ✅ Yes | — | Cannot be disabled (core) |
| **Opportunity Management** | ✅ Yes | Customer Management | Cannot be disabled (core) |
| **Lead Management** | Optional | — | No lead capture needed |
| **Quotation Management** | Optional | Opportunity, Product | Simple deals with no formal quotes |
| **Order Management** | Optional | Opportunity (or Quotation) | No order/payment tracking needed |
| **Product Management** | Optional | — | No product catalog needed |
| **Email Integration** | Optional | Customer, Contact | Using an external email system |

### 2.3 Pre-configured Editions

| Edition | Modules Included | Use Case | Table Count |
|---------|-----------------|----------|-------------|
| **Lite** | Customer + Opportunity | Simple deal tracking | 6 |
| **Standard** | Lite + Lead + Quotation + Order + Product | Full sales cycle | 15 |
| **Enterprise** | Standard + Email Integration | Full feature set with email | 17 |

### 2.4 Module–Table Mapping

#### Core Module Tables (Always Required)

| Table | Module | Description |
|-------|--------|-------------|
| nb_crm_customers | Customer Management | Customer/company records |
| nb_crm_contacts | Customer Management | Contacts |
| nb_crm_customer_shares | Customer Management | Customer sharing permissions |
| nb_crm_opportunities | Opportunity Management | Sales opportunities |
| nb_crm_opportunity_stages | Opportunity Management | Stage configuration |
| nb_crm_opportunity_users | Opportunity Management | Opportunity collaborators |
| nb_crm_activities | Activity Management | Activity records |
| nb_crm_comments | Activity Management | Comments / notes |
| nb_crm_tags | Core | Shared tags |
| nb_cbo_currencies | Base Data | Currency dictionary |
| nb_cbo_regions | Base Data | Country/region dictionary |

### 2.5 How to Disable a Module

Simply hide the module's menu entry in the NocoBase admin panel. No code changes or table deletions required.

---

## 3. Core Entities & Data Model

### 3.1 Entity Relationship Overview
![design_en-2026-02-24-00-23-33](https://static-docs.nocobase.com/design_en-2026-02-24-00-23-33.png)
### 3.2 Core Table Details

#### 3.2.1 Leads Table (nb_crm_leads)

Lead management with a simplified 4-stage workflow.

**Stage flow:**
```
New → Working → Qualified → Converted (Customer/Opportunity)
        ↓            ↓
   Unqualified   Unqualified
```

**Key fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| lead_no | VARCHAR | Lead number (auto-generated) |
| name | VARCHAR | Contact name |
| company | VARCHAR | Company name |
| title | VARCHAR | Job title |
| email | VARCHAR | Email address |
| phone | VARCHAR | Phone number |
| mobile_phone | VARCHAR | Mobile number |
| website | TEXT | Website |
| address | TEXT | Address |
| source | VARCHAR | Lead source: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Industry |
| annual_revenue | VARCHAR | Annual revenue range |
| number_of_employees | VARCHAR | Employee count range |
| status | VARCHAR | Status: new/working/qualified/unqualified |
| rating | VARCHAR | Rating: hot/warm/cold |
| owner_id | BIGINT | Owner (FK → users) |
| ai_score | INTEGER | AI quality score 0–100 |
| ai_convert_prob | DECIMAL | AI conversion probability |
| ai_best_contact_time | VARCHAR | AI-recommended contact time |
| ai_tags | JSONB | AI-generated tags |
| ai_scored_at | TIMESTAMP | AI scoring timestamp |
| ai_next_best_action | TEXT | AI next best action suggestion |
| ai_nba_generated_at | TIMESTAMP | AI suggestion generated timestamp |
| is_converted | BOOLEAN | Conversion flag |
| converted_at | TIMESTAMP | Conversion timestamp |
| converted_customer_id | BIGINT | Converted customer ID |
| converted_contact_id | BIGINT | Converted contact ID |
| converted_opportunity_id | BIGINT | Created opportunity ID |
| lost_reason | TEXT | Loss reason |
| disqualification_reason | TEXT | Disqualification reason |
| description | TEXT | Description |

#### 3.2.2 Customers Table (nb_crm_customers)

Customer/company management with foreign trade support.

**Key fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| name | VARCHAR | Customer name (required) |
| account_number | VARCHAR | Account number (auto-generated, unique) |
| phone | VARCHAR | Phone number |
| website | TEXT | Website |
| address | TEXT | Address |
| industry | VARCHAR | Industry |
| type | VARCHAR | Type: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Employee count range |
| annual_revenue | VARCHAR | Annual revenue range |
| level | VARCHAR | Level: normal/important/vip |
| status | VARCHAR | Status: potential/active/dormant/churned |
| country | VARCHAR | Country |
| region_id | BIGINT | Region (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Preferred currency: CNY/USD/EUR |
| owner_id | BIGINT | Owner (FK → users) |
| parent_id | BIGINT | Parent company (FK → self) |
| source_lead_id | BIGINT | Source lead ID |
| ai_health_score | INTEGER | AI health score 0–100 |
| ai_health_grade | VARCHAR | AI health grade: A/B/C/D |
| ai_churn_risk | DECIMAL | AI churn risk 0–100% |
| ai_churn_risk_level | VARCHAR | AI churn risk level: low/medium/high |
| ai_health_dimensions | JSONB | AI health dimension scores |
| ai_recommendations | JSONB | AI recommendation list |
| ai_health_assessed_at | TIMESTAMP | AI health assessment timestamp |
| ai_tags | JSONB | AI-generated tags |
| ai_best_contact_time | VARCHAR | AI-recommended contact time |
| ai_next_best_action | TEXT | AI next best action suggestion |
| ai_nba_generated_at | TIMESTAMP | AI suggestion generated timestamp |
| description | TEXT | Description |
| is_deleted | BOOLEAN | Soft delete flag |

#### 3.2.3 Opportunities Table (nb_crm_opportunities)

Sales opportunity management with configurable pipeline stages.

**Key fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| opportunity_no | VARCHAR | Opportunity number (auto-generated, unique) |
| name | VARCHAR | Opportunity name (required) |
| amount | DECIMAL | Expected amount |
| currency | VARCHAR | Currency |
| exchange_rate | DECIMAL | Exchange rate |
| amount_usd | DECIMAL | USD equivalent |
| customer_id | BIGINT | Customer (FK) |
| contact_id | BIGINT | Primary contact (FK) |
| stage | VARCHAR | Stage code (FK → stages.code) |
| stage_sort | INTEGER | Stage sort order (denormalized for sorting) |
| stage_entered_at | TIMESTAMP | Time entered current stage |
| days_in_stage | INTEGER | Days in current stage |
| win_probability | DECIMAL | Manual win probability |
| ai_win_probability | DECIMAL | AI-predicted win probability |
| ai_analyzed_at | TIMESTAMP | AI analysis timestamp |
| ai_confidence | DECIMAL | AI prediction confidence |
| ai_trend | VARCHAR | AI trend: up/stable/down |
| ai_risk_factors | JSONB | AI-identified risk factors |
| ai_recommendations | JSONB | AI recommendation list |
| ai_predicted_close | DATE | AI-predicted close date |
| ai_next_best_action | TEXT | AI next best action suggestion |
| ai_nba_generated_at | TIMESTAMP | AI suggestion generated timestamp |
| expected_close_date | DATE | Expected close date |
| actual_close_date | DATE | Actual close date |
| owner_id | BIGINT | Owner (FK → users) |
| last_activity_at | TIMESTAMP | Last activity timestamp |
| stagnant_days | INTEGER | Days without activity |
| loss_reason | TEXT | Loss reason |
| competitor_id | BIGINT | Competitor (FK) |
| lead_source | VARCHAR | Lead source |
| campaign_id | BIGINT | Campaign ID |
| expected_revenue | DECIMAL | Expected revenue = amount × probability |
| description | TEXT | Description |

#### 3.2.4 Quotations Table (nb_crm_quotations)

Quotation management with multi-currency and approval workflow support.

**Status flow:**
```
Draft → Pending Approval → Approved → Sent → Accepted / Rejected / Expired
              ↓
          Rejected → Revise → Draft
```

**Key fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| quotation_no | VARCHAR | Quotation number (auto-generated, unique) |
| name | VARCHAR | Quotation name |
| version | INTEGER | Version number |
| opportunity_id | BIGINT | Opportunity (FK, required) |
| customer_id | BIGINT | Customer (FK) |
| contact_id | BIGINT | Contact (FK) |
| owner_id | BIGINT | Owner (FK → users) |
| currency_id | BIGINT | Currency (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Exchange rate |
| subtotal | DECIMAL | Subtotal |
| discount_rate | DECIMAL | Discount rate |
| discount_amount | DECIMAL | Discount amount |
| shipping_handling | DECIMAL | Shipping & handling |
| tax_rate | DECIMAL | Tax rate |
| tax_amount | DECIMAL | Tax amount |
| total_amount | DECIMAL | Total amount |
| total_amount_usd | DECIMAL | USD equivalent |
| status | VARCHAR | Status: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Submission timestamp |
| approved_by | BIGINT | Approver (FK → users) |
| approved_at | TIMESTAMP | Approval timestamp |
| rejected_at | TIMESTAMP | Rejection timestamp |
| sent_at | TIMESTAMP | Send timestamp |
| customer_response_at | TIMESTAMP | Customer response timestamp |
| expired_at | TIMESTAMP | Expiry timestamp |
| valid_until | DATE | Valid until date |
| payment_terms | TEXT | Payment terms |
| terms_condition | TEXT | Terms & conditions |
| address | TEXT | Shipping address |
| description | TEXT | Description |

#### 3.2.5 Orders Table (nb_crm_orders)

Order management with payment tracking.

**Key fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| order_no | VARCHAR | Order number (auto-generated, unique) |
| customer_id | BIGINT | Customer (FK) |
| contact_id | BIGINT | Contact (FK) |
| opportunity_id | BIGINT | Opportunity (FK) |
| quotation_id | BIGINT | Quotation (FK) |
| owner_id | BIGINT | Owner (FK → users) |
| currency | VARCHAR | Currency |
| exchange_rate | DECIMAL | Exchange rate |
| order_amount | DECIMAL | Order amount |
| paid_amount | DECIMAL | Amount paid |
| unpaid_amount | DECIMAL | Amount outstanding |
| status | VARCHAR | Status: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Payment status: unpaid/partial/paid |
| order_date | DATE | Order date |
| delivery_date | DATE | Expected delivery date |
| actual_delivery_date | DATE | Actual delivery date |
| shipping_address | TEXT | Shipping address |
| logistics_company | VARCHAR | Logistics company |
| tracking_no | VARCHAR | Tracking number |
| terms_condition | TEXT | Terms & conditions |
| description | TEXT | Description |

### 3.3 Table Summary

#### CRM Business Tables

| # | Table | Description | Type |
|---|-------|-------------|------|
| 1 | nb_crm_leads | Lead management | Business |
| 2 | nb_crm_customers | Customers/companies | Business |
| 3 | nb_crm_contacts | Contacts | Business |
| 4 | nb_crm_opportunities | Sales opportunities | Business |
| 5 | nb_crm_opportunity_stages | Stage configuration | Config |
| 6 | nb_crm_opportunity_users | Opportunity collaborators (sales team) | Relation |
| 7 | nb_crm_quotations | Quotations | Business |
| 8 | nb_crm_quotation_items | Quotation line items | Business |
| 9 | nb_crm_quotation_approvals | Approval records | Business |
| 10 | nb_crm_orders | Orders | Business |
| 11 | nb_crm_order_items | Order line items | Business |
| 12 | nb_crm_payments | Payment records | Business |
| 13 | nb_crm_products | Product catalog | Business |
| 14 | nb_crm_product_categories | Product categories | Config |
| 15 | nb_crm_price_tiers | Tiered pricing | Config |
| 16 | nb_crm_activities | Activity records | Business |
| 17 | nb_crm_comments | Comments / notes | Business |
| 18 | nb_crm_competitors | Competitors | Business |
| 19 | nb_crm_tags | Tags | Config |
| 20 | nb_crm_lead_tags | Lead–tag relation | Relation |
| 21 | nb_crm_contact_tags | Contact–tag relation | Relation |
| 22 | nb_crm_customer_shares | Customer sharing permissions | Relation |
| 23 | nb_crm_exchange_rates | Exchange rate history | Config |

#### Base Data Tables (Shared Module)

| # | Table | Description | Type |
|---|-------|-------------|------|
| 1 | nb_cbo_currencies | Currency dictionary | Config |
| 2 | nb_cbo_regions | Country/region dictionary | Config |

### 3.4 Supporting Tables

#### 3.4.1 Comments Table (nb_crm_comments)

General-purpose comment/note table, linkable to multiple business objects.

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| content | TEXT | Comment content |
| lead_id | BIGINT | Related lead (FK) |
| customer_id | BIGINT | Related customer (FK) |
| opportunity_id | BIGINT | Related opportunity (FK) |
| order_id | BIGINT | Related order (FK) |

#### 3.4.2 Customer Shares Table (nb_crm_customer_shares)

Enables multi-user collaboration and permission sharing on customers.

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| customer_id | BIGINT | Customer (FK, required) |
| shared_with_user_id | BIGINT | Recipient user (FK, required) |
| shared_by_user_id | BIGINT | Sharing initiator (FK) |
| permission_level | VARCHAR | Permission level: read/write/full |
| shared_at | TIMESTAMP | Share timestamp |

#### 3.4.3 Opportunity Collaborators Table (nb_crm_opportunity_users)

Supports sales team collaboration on opportunities.

| Field | Type | Description |
|-------|------|-------------|
| opportunity_id | BIGINT | Opportunity (FK, composite PK) |
| user_id | BIGINT | User (FK, composite PK) |
| role | VARCHAR | Role: owner/collaborator/viewer |

#### 3.4.4 Regions Table (nb_cbo_regions)

Country/region base data dictionary.

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| code_alpha2 | VARCHAR | ISO 3166-1 alpha-2 code (unique) |
| code_alpha3 | VARCHAR | ISO 3166-1 alpha-3 code (unique) |
| code_numeric | VARCHAR | ISO 3166-1 numeric code |
| name | VARCHAR | Country/region name |
| is_active | BOOLEAN | Active flag |
| sort_order | INTEGER | Sort order |

---

## 4. Lead Lifecycle

Lead management uses a simplified 4-stage workflow. When a new lead is created, a workflow can automatically trigger AI scoring to help sales quickly identify high-quality leads.

### 4.1 Status Definitions

| Status | Name | Description |
|--------|------|-------------|
| new | New | Just created, awaiting contact |
| working | Working | Actively being followed up |
| qualified | Qualified | Ready for conversion |
| unqualified | Unqualified | Not a good fit |

### 4.2 Status Flow


![design_en-2026-02-24-00-23-51](https://static-docs.nocobase.com/design_en-2026-02-24-00-23-51.png)

### 4.3 Lead Conversion Flow

The conversion UI presents three options simultaneously; users can create or link:

- **Customer**: Create a new customer or link to an existing one
- **Contact**: Create a new contact (linked to the customer)
- **Opportunity**: Must create an opportunity
![design_en-2026-02-24-00-24-30](https://static-docs.nocobase.com/design_en-2026-02-24-00-24-30.png)


**Fields recorded after conversion:**
- `converted_customer_id`: Linked customer ID
- `converted_contact_id`: Linked contact ID
- `converted_opportunity_id`: Created opportunity ID

---

## 5. Opportunity Lifecycle

Opportunity management uses configurable pipeline stages. When a stage changes, a workflow can automatically trigger AI win probability prediction to help sales identify risks and opportunities.

### 5.1 Configurable Stages

Stages are stored in `nb_crm_opportunity_stages` and can be customized:

| Code | Name | Order | Default Win % |
|------|------|:-----:|:-------------:|
| prospecting | Prospecting | 1 | 10% |
| analysis | Analysis | 2 | 30% |
| proposal | Proposal | 3 | 60% |
| negotiation | Negotiation | 4 | 80% |
| won | Won | 5 | 100% |
| lost | Lost | 6 | 0% |

### 5.2 Pipeline Flow

![design_en-2026-02-24-00-25-52](https://static-docs.nocobase.com/design_en-2026-02-24-00-25-52.png)

### 5.3 Stagnation Detection

Opportunities with no activity will be flagged:

| Days Inactive | Action |
|---------------|--------|
| 7 days | Yellow warning |
| 14 days | Orange reminder to owner |
| 30 days | Red alert to manager |

```sql
-- Calculate stagnation days
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Won / Lost Handling

**When Won:**
1. Update stage to 'won'
2. Record actual close date
3. Update customer status to 'active'
4. Trigger order creation (if quotation was accepted)

**When Lost:**
1. Update stage to 'lost'
2. Record loss reason
3. Record competitor ID (if lost to a competitor)
4. Notify manager

---

## 6. Quotation Lifecycle

### 6.1 Status Definitions

| Status | Name | Description |
|--------|------|-------------|
| draft | Draft | Being prepared |
| pending_approval | Pending Approval | Awaiting approval |
| approved | Approved | Ready to send |
| sent | Sent | Sent to customer |
| accepted | Accepted | Customer accepted |
| rejected | Rejected | Customer rejected |
| expired | Expired | Past validity date |

### 6.2 Approval Rules (To Be Refined)

Approval flow is triggered based on the following conditions:

| Condition | Approval Level |
|-----------|---------------|
| Discount > 10% | Sales Manager |
| Discount > 20% | Sales Director |
| Amount > $100K | Finance + CEO |

![design_en-2026-02-24-00-26-05](https://static-docs.nocobase.com/design_en-2026-02-24-00-26-05.png)

### 6.3 Multi-Currency Support

#### Design Rationale

**USD is used as the unified base currency** for all reports and analysis. Each monetary record stores:
- Original currency and amount (what the customer sees)
- Exchange rate at the time of transaction
- USD equivalent (for internal comparison)

#### Currency Dictionary (nb_cbo_currencies)

Currency configuration uses a shared base data table for dynamic management. The `current_rate` field stores the current exchange rate, synced by a scheduled task from the latest record in `nb_crm_exchange_rates`.

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| code | VARCHAR | Currency code (unique): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Currency name |
| symbol | VARCHAR | Currency symbol |
| decimal_places | INTEGER | Decimal places |
| current_rate | DECIMAL | Current rate vs. USD (synced from exchange rate history) |
| is_active | BOOLEAN | Active flag |
| sort_order | INTEGER | Sort order |

#### Exchange Rate History (nb_crm_exchange_rates)

Records historical exchange rate data. A scheduled task syncs the latest rate to `nb_cbo_currencies.current_rate`.

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| currency_code | VARCHAR | Currency code (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Rate vs. USD |
| effective_date | DATE | Effective date |
| source | VARCHAR | Rate source: manual/api |
| createdAt | TIMESTAMP | Created timestamp |

> **Note**: Quotations link to `nb_cbo_currencies` via `currency_id` FK and read the rate directly from `current_rate`. Opportunities and orders use a `currency` VARCHAR field for the currency code.

#### Monetary Field Pattern

Tables with monetary amounts follow this pattern:

| Field | Type | Description |
|-------|------|-------------|
| currency | VARCHAR | Transaction currency |
| amount | DECIMAL | Original currency amount |
| exchange_rate | DECIMAL | Rate vs. USD at time of transaction |
| amount_usd | DECIMAL | USD equivalent (calculated) |

**Applied to:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Workflow Integration

![design_en-2026-02-24-00-26-33](https://static-docs.nocobase.com/design_en-2026-02-24-00-26-33.png)

**Exchange rate fetch logic:**
1. Business operations read rate directly from `nb_cbo_currencies.current_rate`
2. USD transactions: rate = 1.0, no lookup needed
3. `current_rate` is synced by scheduled task from the latest `nb_crm_exchange_rates` record

### 6.4 Version Management

When a quotation is rejected or expires, it can be copied as a new version:

```
QT-20260119-001 v1 → Rejected
QT-20260119-001 v2 → Sent
QT-20260119-001 v3 → Accepted
```

---

## 7. Order Lifecycle

### 7.1 Order Overview

Orders are created when a quotation is accepted, representing a confirmed business commitment.

![design_en-2026-02-24-00-26-47](https://static-docs.nocobase.com/design_en-2026-02-24-00-26-47.png)

### 7.2 Order Status Definitions

| Status | Code | Description | Allowed Actions |
|--------|------|-------------|----------------|
| Draft | `draft` | Created, not yet confirmed | Edit, Confirm, Cancel |
| Confirmed | `confirmed` | Confirmed, awaiting fulfillment | Start fulfillment, Cancel |
| In Progress | `in_progress` | Being processed/manufactured | Update progress, Ship, Cancel (approval required) |
| Shipped | `shipped` | Product shipped to customer | Mark as Delivered |
| Delivered | `delivered` | Customer received | Complete order |
| Completed | `completed` | Fully complete | None |
| Cancelled | `cancelled` | Order cancelled | None |

### 7.3 Order Data Model

#### nb_crm_orders

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| order_no | VARCHAR | Order number (auto-generated, unique) |
| customer_id | BIGINT | Customer (FK) |
| contact_id | BIGINT | Contact (FK) |
| opportunity_id | BIGINT | Opportunity (FK) |
| quotation_id | BIGINT | Quotation (FK) |
| owner_id | BIGINT | Owner (FK → users) |
| status | VARCHAR | Order status |
| payment_status | VARCHAR | Payment status: unpaid/partial/paid |
| order_date | DATE | Order date |
| delivery_date | DATE | Expected delivery date |
| actual_delivery_date | DATE | Actual delivery date |
| currency | VARCHAR | Order currency |
| exchange_rate | DECIMAL | Rate vs. USD |
| order_amount | DECIMAL | Order total |
| paid_amount | DECIMAL | Amount paid |
| unpaid_amount | DECIMAL | Amount outstanding |
| shipping_address | TEXT | Shipping address |
| logistics_company | VARCHAR | Logistics company |
| tracking_no | VARCHAR | Tracking number |
| terms_condition | TEXT | Terms & conditions |
| description | TEXT | Description |

#### nb_crm_order_items

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| order_id | FK | Parent order |
| product_id | FK | Product reference |
| product_name | VARCHAR | Product name snapshot |
| quantity | INT | Quantity ordered |
| unit_price | DECIMAL | Unit price |
| discount_percent | DECIMAL | Discount percentage |
| line_total | DECIMAL | Line item total |
| notes | TEXT | Line item notes |

### 7.4 Payment Tracking

#### nb_crm_payments

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| order_id | BIGINT | Related order (FK, required) |
| customer_id | BIGINT | Customer (FK) |
| payment_no | VARCHAR | Payment number (auto-generated, unique) |
| amount | DECIMAL | Payment amount (required) |
| currency | VARCHAR | Payment currency |
| payment_method | VARCHAR | Payment method: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Payment date |
| bank_account | VARCHAR | Bank account number |
| bank_name | VARCHAR | Bank name |
| notes | TEXT | Payment notes |

---

## 8. Customer Lifecycle

### 8.1 Customer Overview

Customers are created upon lead conversion or opportunity win. The system tracks the full lifecycle from acquisition to advocacy.

![design_en-2026-02-24-00-27-30](https://static-docs.nocobase.com/design_en-2026-02-24-00-27-30.png)

### 8.2 Customer Status Definitions

| Status | Code | Health Score | Description |
|--------|------|:------------:|-------------|
| Prospect | `prospect` | N/A | Converted lead, no orders yet |
| Active | `active` | ≥70 | Paying customer, good engagement |
| Growing | `growing` | ≥80 | Customer with expansion opportunities |
| At Risk | `at_risk` | <50 | Showing signs of churn |
| Churned | `churned` | N/A | No longer active |
| Win Back | `win_back` | N/A | Former customer being re-engaged |
| Advocate | `advocate` | ≥90 | High satisfaction, providing referrals |

### 8.3 Customer Health Score

Health score is calculated from multiple factors:

| Factor | Weight | Metric |
|--------|:------:|--------|
| Purchase Recency | 25% | Days since last order |
| Purchase Frequency | 20% | Orders per period |
| Monetary Value | 20% | Total and average order value |
| Engagement | 15% | Email open rate, meeting attendance |
| Support Health | 10% | Ticket volume and resolution rate |
| Product Usage | 10% | Active usage metrics (if applicable) |

**Health score thresholds:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Customer Segmentation

#### Automatic Segmentation

| Segment | Condition | Recommended Action |
|---------|-----------|-------------------|
| VIP | Lifetime value > $100K | White-glove service, executive sponsorship |
| Enterprise | Company size > 500 employees | Dedicated account manager |
| Mid-market | Company size 50–500 employees | Regular check-ins, scaled support |
| Startup | Company size < 50 employees | Self-service resources, community |
| Dormant | 90+ days inactive | Re-engagement campaign |

---

## 9. Email Integration

### 9.1 Overview

NocoBase provides a built-in email integration plugin supporting Gmail and Outlook. Once emails are synced, workflows can automatically trigger AI analysis of email sentiment and intent, helping sales quickly understand customer attitudes.

### 9.2 Email Sync

**Supported mailboxes:**
- Gmail (via OAuth 2.0)
- Outlook / Microsoft 365 (via OAuth 2.0)

**Sync behavior:**
- Bidirectional sync for sent and received emails
- Automatic association to CRM records (leads, contacts, opportunities)
- Attachments stored in the NocoBase file system

### 9.3 Email–CRM Association (To Be Refined)

![design_en-2026-02-24-00-27-41](https://static-docs.nocobase.com/design_en-2026-02-24-00-27-41.png)

### 9.4 Email Templates

Sales can use pre-built templates:

| Category | Examples |
|----------|---------|
| Initial Outreach | Cold email, warm introduction, event follow-up |
| Follow-up | Meeting follow-up, proposal follow-up, no-reply nudge |
| Quotation | Quote attached, quote revised, quote expiring soon |
| Order | Order confirmation, shipping notification, delivery confirmation |
| Customer Success | Welcome, check-in, review request |

---

## 10. AI Capabilities

### 10.1 AI Employee Team

The CRM integrates the NocoBase AI plugin, using the following built-in AI employees with CRM-specific tasks configured:

| ID | Name | Built-in Role | CRM Extended Capabilities |
|----|------|--------------|--------------------------|
| viz | Viz | Data Analyst | Sales data analysis, pipeline forecasting |
| dara | Dara | Chart Expert | Data visualization, report charts, dashboard design |
| ellis | Ellis | Editor | Email reply drafting, communication summaries, business email composition |
| lexi | Lexi | Translator | Multilingual customer communication, content translation |
| orin | Orin | Organizer | Daily priorities, next-best-action suggestions, follow-up planning |

### 10.2 AI Task List

AI capabilities are divided into two independent categories:

#### 1. AI Employees (Frontend — User-Triggered)

Users interact directly with AI employees via frontend blocks to get analysis and recommendations.

| Employee | Task | Description |
|----------|------|-------------|
| Viz | Sales Data Analysis | Analyze pipeline trends and conversion rates |
| Viz | Pipeline Forecast | Revenue forecast based on weighted pipeline |
| Dara | Chart Generation | Generate sales report charts |
| Dara | Dashboard Design | Design data dashboard layouts |
| Ellis | Reply Drafting | Generate professional email replies |
| Ellis | Communication Summary | Summarize email threads |
| Ellis | Business Email Composition | Draft meeting invitations, follow-ups, thank-you emails |
| Orin | Daily Priorities | Generate today's prioritized task list |
| Orin | Next Best Action | Recommend next steps for each opportunity |
| Lexi | Content Translation | Translate marketing materials, proposals, emails |

#### 2. Workflow LLM Nodes (Backend — Auto-Executed)

LLM nodes embedded in workflows, triggered automatically via table events, action events, or scheduled tasks — independent of AI employees.

| Task | Trigger | Description | Fields Written |
|------|---------|-------------|---------------|
| Lead Scoring | Table event (create/update) | Evaluate lead quality | ai_score, ai_convert_prob |
| Win Probability | Table event (stage change) | Predict opportunity success | ai_win_probability, ai_risk_factors |

> **Note**: Workflow LLM nodes use prompts with schema-defined output to produce structured JSON, which is then parsed and written to business data fields — no user interaction required.

### 10.3 AI Fields in the Database

| Table | AI Field | Description |
|-------|----------|-------------|
| nb_crm_leads | ai_score | AI score 0–100 |
| | ai_convert_prob | Conversion probability |
| | ai_best_contact_time | AI-recommended contact time |
| | ai_tags | AI-generated tags (JSONB) |
| | ai_scored_at | Scoring timestamp |
| | ai_next_best_action | Next best action suggestion |
| | ai_nba_generated_at | Suggestion generated timestamp |
| nb_crm_opportunities | ai_win_probability | AI-predicted win probability |
| | ai_analyzed_at | Analysis timestamp |
| | ai_confidence | Prediction confidence |
| | ai_trend | Trend: up/stable/down |
| | ai_risk_factors | Risk factors (JSONB) |
| | ai_recommendations | Recommendation list (JSONB) |
| | ai_predicted_close | Predicted close date |
| | ai_next_best_action | Next best action suggestion |
| | ai_nba_generated_at | Suggestion generated timestamp |
| nb_crm_customers | ai_health_score | Health score 0–100 |
| | ai_health_grade | Health grade: A/B/C/D |
| | ai_churn_risk | Churn risk 0–100% |
| | ai_churn_risk_level | Churn risk level: low/medium/high |
| | ai_health_dimensions | Dimension scores (JSONB) |
| | ai_recommendations | Recommendation list (JSONB) |
| | ai_health_assessed_at | Health assessment timestamp |
| | ai_tags | AI-generated tags (JSONB) |
| | ai_best_contact_time | AI-recommended contact time |
| | ai_next_best_action | Next best action suggestion |
| | ai_nba_generated_at | Suggestion generated timestamp |

---

## 11. Workflow Engine

### 11.1 Implemented Workflows

| Workflow Name | Trigger Type | Status | Description |
|--------------|-------------|--------|-------------|
| Leads Created | Table event | Enabled | Triggered when a lead is created |
| CRM Overall Analytics | AI employee event | Enabled | CRM-wide data analysis |
| Lead Conversion | Post-action event | Enabled | Lead conversion flow |
| Lead Assignment | Table event | Enabled | Automatic lead assignment |
| Lead Scoring | Table event | Disabled | Lead scoring (pending refinement) |
| Follow-up Reminder | Scheduled task | Disabled | Follow-up reminders (pending refinement) |

### 11.2 Planned Workflows

| Workflow | Trigger Type | Description |
|----------|-------------|-------------|
| Opportunity Stage Advance | Table event | Update win probability and record timestamp on stage change |
| Stagnation Detection | Scheduled task | Detect inactive opportunities and send reminders |
| Quotation Approval | Post-action event | Multi-level approval flow |
| Order Generation | Post-action event | Auto-create order when quotation is accepted |

---

## 12. Menu & Interface Design

### 12.1 Admin Menu Structure


| Menu | Type | Description |
|------|------|-------------|
| **Dashboards** | Group | Dashboards |
| - Dashboard | Page | Default dashboard |
| - SalesManager | Page | Sales manager view |
| - SalesRep | Page | Sales rep view |
| - Executive | Page | Executive view |
| **Leads** | Page | Lead management |
| **Customers** | Page | Customer management |
| **Opportunities** | Page | Opportunity management |
| - Table | Tab | Opportunity list |
| **Products** | Page | Product management |
| - Categories | Tab | Product categories |
| **Orders** | Page | Order management |
| **Settings** | Group | Settings |
| - Stage Settings | Page | Opportunity stage configuration |
| - Exchange Rate | Page | Exchange rate settings |
| - Activity | Page | Activity records |
| - Emails | Page | Email management |
| - Contacts | Page | Contact management |
| - Data Analysis | Page | Data analysis |

### 12.2 Dashboard Views

#### Sales Manager View

| Component | Type | Data |
|-----------|------|------|
| Pipeline Value | KPI Card | Total pipeline value by stage |
| Team Leaderboard | Table | Rep performance ranking |
| Risk Alerts | Alert List | High-risk opportunities |
| Win Rate Trend | Line Chart | Monthly win rate |
| Stagnant Deals | List | Deals needing attention |

#### Sales Rep View

| Component | Type | Data |
|-----------|------|------|
| My Quota Progress | Progress Bar | Monthly actual vs. quota |
| Open Opportunities | KPI Card | My open opportunity count |
| Closing This Week | List | Deals closing soon |
| Overdue Activities | Alert | Overdue tasks |
| Quick Actions | Buttons | Log activity, Create opportunity |

#### Executive View

| Component | Type | Data |
|-----------|------|------|
| Annual Revenue | KPI Card | Year-to-date revenue |
| Pipeline Value | KPI Card | Total pipeline |
| Win Rate | KPI Card | Overall win rate |
| Customer Health | Distribution Chart | Health score distribution |
| Forecast | Chart | Monthly revenue forecast |

---

*Document Version: v2.0 | Last Updated: 2026-02-06*
