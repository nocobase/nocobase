# CRM 2.0 System Detailed Design

## 1. System Overview and Design Philosophy

### 1.1 System Positioning

This system is a **CRM 2.0 Sales Management Platform** built on the NocoBase no-code platform. The core objective is:

```
Let sales focus on building customer relationships, not data entry and repetitive analysis.
```

The system automates routine tasks through workflows and utilizes AI to assist with lead scoring, opportunity analysis, and other tasks, helping sales teams improve efficiency.

### 1.2 Design Philosophy

#### Philosophy 1: Complete Sales Funnel

**End-to-end Sales Process:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Why design it this way?**

| Traditional Method | Integrated CRM |
|---------|-----------|
| Multiple systems used for different stages | Single system covering the entire lifecycle |
| Manual data transfer between systems | Automated data flow and conversion |
| Inconsistent customer views | Unified 360-degree customer view |
| Fragmented data analysis | End-to-end sales pipeline analysis |

#### Philosophy 2: Configurable Sales Pipeline
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Different industries can customize sales pipeline stages without modifying code.

#### Philosophy 3: Modular Design

- Core modules (Customers + Opportunities) are mandatory; other modules can be enabled as needed.
- Disabling modules does not require code changes; it is done via NocoBase interface configuration.
- Each module is designed independently to reduce coupling.

---

## 2. Module Architecture and Customization

### 2.1 Module Overview

The CRM system adopts a **modular architecture** design—each module can be independently enabled or disabled based on business requirements.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Module Dependencies

| Module | Mandatory | Dependencies | Disabling Condition |
|-----|---------|--------|---------|
| **Customer Management** | ✅ Yes | - | Cannot be disabled (Core) |
| **Opportunity Management** | ✅ Yes | Customer Management | Cannot be disabled (Core) |
| **Lead Management** | Optional | - | When lead acquisition is not required |
| **Quotation Management** | Optional | Opportunities, Products | Simple transactions not requiring formal quotes |
| **Order Management** | Optional | Opportunities (or Quotations) | When order/payment tracking is not required |
| **Product Management** | Optional | - | When a product catalog is not required |
| **Email Integration** | Optional | Customers, Contacts | When using an external email system |

### 2.3 Pre-configured Versions

| Version | Included Modules | Use Case | Number of Collections |
|-----|---------|---------|-----------|
| **Lite** | Customers + Opportunities | Simple transaction tracking | 6 |
| **Standard** | Lite + Leads + Quotations + Orders + Products | Full sales cycle | 15 |
| **Enterprise** | Standard + Email Integration | Full functionality including email | 17 |

### 2.4 Module-to-Collection Mapping

#### Core Module Collections (Always Required)

| Collection | Module | Description |
|-------|------|------|
| nb_crm_customers | Customer Management | Customer/Company records |
| nb_crm_contacts | Customer Management | Contacts |
| nb_crm_customer_shares | Customer Management | Customer sharing permissions |
| nb_crm_opportunities | Opportunity Management | Sales opportunities |
| nb_crm_opportunity_stages | Opportunity Management | Stage configurations |
| nb_crm_opportunity_users | Opportunity Management | Opportunity collaborators |
| nb_crm_activities | Activity Management | Activity records |
| nb_crm_comments | Activity Management | Comments/Notes |
| nb_crm_tags | Core | Shared tags |
| nb_cbo_currencies | Foundation Data | Currency dictionary |
| nb_cbo_regions | Foundation Data | Country/Region dictionary |

### 2.5 How to Disable Modules

Simply hide the menu entry for the module in the NocoBase administration interface; there is no need to modify code or delete collections.

---

## 3. Core Entities and Data Model

### 3.1 Entity Relationship Overview
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Core Collection Details

#### 3.2.1 Leads (nb_crm_leads)

Lead management using a simplified 4-stage workflow.

**Stage Process:**
```
New → Working → Qualified → Converted to Customer/Opportunity
         ↓          ↓
    Unqualified  Unqualified
```

**Key Fields:**

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| lead_no | VARCHAR | Lead Number (Auto-generated) |
| name | VARCHAR | Contact Name |
| company | VARCHAR | Company Name |
| title | VARCHAR | Job Title |
| email | VARCHAR | Email |
| phone | VARCHAR | Phone |
| mobile_phone | VARCHAR | Mobile |
| website | TEXT | Website |
| address | TEXT | Address |
| source | VARCHAR | Lead Source: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Industry |
| annual_revenue | VARCHAR | Annual Revenue Scale |
| number_of_employees | VARCHAR | Employee Count Scale |
| status | VARCHAR | Status: new/working/qualified/unqualified |
| rating | VARCHAR | Rating: hot/warm/cold |
| owner_id | BIGINT | Owner (FK → users) |
| ai_score | INTEGER | AI Quality Score 0-100 |
| ai_convert_prob | DECIMAL | AI Conversion Probability |
| ai_best_contact_time | VARCHAR | AI Recommended Contact Time |
| ai_tags | JSONB | AI Generated Tags |
| ai_scored_at | TIMESTAMP | AI Scoring Time |
| ai_next_best_action | TEXT | AI Next Best Action Suggestion |
| ai_nba_generated_at | TIMESTAMP | AI Suggestion Generation Time |
| is_converted | BOOLEAN | Converted Flag |
| converted_at | TIMESTAMP | Conversion Time |
| converted_customer_id | BIGINT | Converted Customer ID |
| converted_contact_id | BIGINT | Converted Contact ID |
| converted_opportunity_id | BIGINT | Converted Opportunity ID |
| lost_reason | TEXT | Lost Reason |
| disqualification_reason | TEXT | Disqualification Reason |
| description | TEXT | Description |

#### 3.2.2 Customers (nb_crm_customers)

Customer/Company management supporting international business.

**Key Fields:**

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| name | VARCHAR | Customer Name (Required) |
| account_number | VARCHAR | Customer Number (Auto-generated, Unique) |
| phone | VARCHAR | Phone |
| website | TEXT | Website |
| address | TEXT | Address |
| industry | VARCHAR | Industry |
| type | VARCHAR | Type: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Employee Count Scale |
| annual_revenue | VARCHAR | Annual Revenue Scale |
| level | VARCHAR | Level: normal/important/vip |
| status | VARCHAR | Status: potential/active/dormant/churned |
| country | VARCHAR | Country |
| region_id | BIGINT | Region (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Preferred Currency: CNY/USD/EUR |
| owner_id | BIGINT | Owner (FK → users) |
| parent_id | BIGINT | Parent Company (FK → self) |
| source_lead_id | BIGINT | Source Lead ID |
| ai_health_score | INTEGER | AI Health Score 0-100 |
| ai_health_grade | VARCHAR | AI Health Grade: A/B/C/D |
| ai_churn_risk | DECIMAL | AI Churn Risk 0-100% |
| ai_churn_risk_level | VARCHAR | AI Churn Risk Level: low/medium/high |
| ai_health_dimensions | JSONB | AI Health Dimension Scores |
| ai_recommendations | JSONB | AI Recommendation List |
| ai_health_assessed_at | TIMESTAMP | AI Health Assessment Time |
| ai_tags | JSONB | AI Generated Tags |
| ai_best_contact_time | VARCHAR | AI Recommended Contact Time |
| ai_next_best_action | TEXT | AI Next Best Action Suggestion |
| ai_nba_generated_at | TIMESTAMP | AI Suggestion Generation Time |
| description | TEXT | Description |
| is_deleted | BOOLEAN | Soft Delete Flag |

#### 3.2.3 Opportunities (nb_crm_opportunities)

Sales opportunity management with configurable pipeline stages.

**Key Fields:**

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| opportunity_no | VARCHAR | Opportunity Number (Auto-generated, Unique) |
| name | VARCHAR | Opportunity Name (Required) |
| amount | DECIMAL | Expected Amount |
| currency | VARCHAR | Currency |
| exchange_rate | DECIMAL | Exchange Rate |
| amount_usd | DECIMAL | USD Equivalent Amount |
| customer_id | BIGINT | Customer (FK) |
| contact_id | BIGINT | Primary Contact (FK) |
| stage | VARCHAR | Stage Code (FK → stages.code) |
| stage_sort | INTEGER | Stage Sort Order (Redundant for easy sorting) |
| stage_entered_at | TIMESTAMP | Time Entered Current Stage |
| days_in_stage | INTEGER | Days in Current Stage |
| win_probability | DECIMAL | Manual Win Probability |
| ai_win_probability | DECIMAL | AI Predicted Win Probability |
| ai_analyzed_at | TIMESTAMP | AI Analysis Time |
| ai_confidence | DECIMAL | AI Prediction Confidence |
| ai_trend | VARCHAR | AI Prediction Trend: up/stable/down |
| ai_risk_factors | JSONB | AI Identified Risk Factors |
| ai_recommendations | JSONB | AI Recommendation List |
| ai_predicted_close | DATE | AI Predicted Close Date |
| ai_next_best_action | TEXT | AI Next Best Action Suggestion |
| ai_nba_generated_at | TIMESTAMP | AI Suggestion Generation Time |
| expected_close_date | DATE | Expected Close Date |
| actual_close_date | DATE | Actual Close Date |
| owner_id | BIGINT | Owner (FK → users) |
| last_activity_at | TIMESTAMP | Last Activity Time |
| stagnant_days | INTEGER | Days Without Activity |
| loss_reason | TEXT | Loss Reason |
| competitor_id | BIGINT | Competitor (FK) |
| lead_source | VARCHAR | Lead Source |
| campaign_id | BIGINT | Marketing Campaign ID |
| expected_revenue | DECIMAL | Expected Revenue = amount × probability |
| description | TEXT | Description |

#### 3.2.4 Quotations (nb_crm_quotations)

Quotation management supporting multi-currency and approval workflows.

**Status Flow:**
```
Draft → Pending Approval → Approved → Sent → Accepted/Rejected/Expired
              ↓
           Rejected → Edit → Draft
```

**Key Fields:**

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| quotation_no | VARCHAR | Quotation No. (Auto-generated, Unique) |
| name | VARCHAR | Quotation Name |
| version | INTEGER | Version Number |
| opportunity_id | BIGINT | Opportunity (FK, Required) |
| customer_id | BIGINT | Customer (FK) |
| contact_id | BIGINT | Contact (FK) |
| owner_id | BIGINT | Owner (FK → users) |
| currency_id | BIGINT | Currency (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Exchange Rate |
| subtotal | DECIMAL | Subtotal |
| discount_rate | DECIMAL | Discount Rate |
| discount_amount | DECIMAL | Discount Amount |
| shipping_handling | DECIMAL | Shipping/Handling |
| tax_rate | DECIMAL | Tax Rate |
| tax_amount | DECIMAL | Tax Amount |
| total_amount | DECIMAL | Total Amount |
| total_amount_usd | DECIMAL | USD Equivalent Amount |
| status | VARCHAR | Status: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Submission Time |
| approved_by | BIGINT | Approver (FK → users) |
| approved_at | TIMESTAMP | Approval Time |
| rejected_at | TIMESTAMP | Rejection Time |
| sent_at | TIMESTAMP | Sent Time |
| customer_response_at | TIMESTAMP | Customer Response Time |
| expired_at | TIMESTAMP | Expiration Time |
| valid_until | DATE | Valid Until |
| payment_terms | TEXT | Payment Terms |
| terms_condition | TEXT | Terms and Conditions |
| address | TEXT | Shipping Address |
| description | TEXT | Description |

#### 3.2.5 Orders (nb_crm_orders)

Order management including payment tracking.

**Key Fields:**

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| order_no | VARCHAR | Order Number (Auto-generated, Unique) |
| customer_id | BIGINT | Customer (FK) |
| contact_id | BIGINT | Contact (FK) |
| opportunity_id | BIGINT | Opportunity (FK) |
| quotation_id | BIGINT | Quotation (FK) |
| owner_id | BIGINT | Owner (FK → users) |
| currency | VARCHAR | Currency |
| exchange_rate | DECIMAL | Exchange Rate |
| order_amount | DECIMAL | Order Amount |
| paid_amount | DECIMAL | Paid Amount |
| unpaid_amount | DECIMAL | Unpaid Amount |
| status | VARCHAR | Status: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Payment Status: unpaid/partial/paid |
| order_date | DATE | Order Date |
| delivery_date | DATE | Expected Delivery Date |
| actual_delivery_date | DATE | Actual Delivery Date |
| shipping_address | TEXT | Shipping Address |
| logistics_company | VARCHAR | Logistics Company |
| tracking_no | VARCHAR | Tracking Number |
| terms_condition | TEXT | Terms and Conditions |
| description | TEXT | Description |

### 3.3 Collection Summary

#### CRM Business Collections

| No. | Collection Name | Description | Type |
|-----|------|------|------|
| 1 | nb_crm_leads | Lead Management | Business |
| 2 | nb_crm_customers | Customers/Companies | Business |
| 3 | nb_crm_contacts | Contacts | Business |
| 4 | nb_crm_opportunities | Sales Opportunities | Business |
| 5 | nb_crm_opportunity_stages | Stage Configuration | Configuration |
| 6 | nb_crm_opportunity_users | Opportunity Collaborators (Sales Team) | Association |
| 7 | nb_crm_quotations | Quotations | Business |
| 8 | nb_crm_quotation_items | Quotation Items | Business |
| 9 | nb_crm_quotation_approvals | Approval Records | Business |
| 10 | nb_crm_orders | Orders | Business |
| 11 | nb_crm_order_items | Order Items | Business |
| 12 | nb_crm_payments | Payment Records | Business |
| 13 | nb_crm_products | Product Catalog | Business |
| 14 | nb_crm_product_categories | Product Categories | Configuration |
| 15 | nb_crm_price_tiers | Tiered Pricing | Configuration |
| 16 | nb_crm_activities | Activity Records | Business |
| 17 | nb_crm_comments | Comments/Notes | Business |
| 18 | nb_crm_competitors | Competitors | Business |
| 19 | nb_crm_tags | Tags | Configuration |
| 20 | nb_crm_lead_tags | Lead-Tag Association | Association |
| 21 | nb_crm_contact_tags | Contact-Tag Association | Association |
| 22 | nb_crm_customer_shares | Customer Sharing Permissions | Association |
| 23 | nb_crm_exchange_rates | Exchange Rate History | Configuration |

#### Foundation Data Collections (Common Modules)

| No. | Collection Name | Description | Type |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Currency Dictionary | Configuration |
| 2 | nb_cbo_regions | Country/Region Dictionary | Configuration |

### 3.4 Auxiliary Collections

#### 3.4.1 Comments (nb_crm_comments)

Generic comments/notes collection that can be associated with various business objects.

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| content | TEXT | Comment Content |
| lead_id | BIGINT | Associated Lead (FK) |
| customer_id | BIGINT | Associated Customer (FK) |
| opportunity_id | BIGINT | Associated Opportunity (FK) |
| order_id | BIGINT | Associated Order (FK) |

#### 3.4.2 Customer Shares (nb_crm_customer_shares)

Enables multi-person collaboration and permission sharing for customers.

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| customer_id | BIGINT | Customer (FK, Required) |
| shared_with_user_id | BIGINT | Shared With User (FK, Required) |
| shared_by_user_id | BIGINT | Shared By User (FK) |
| permission_level | VARCHAR | Permission Level: read/write/full |
| shared_at | TIMESTAMP | Sharing Time |

#### 3.4.3 Opportunity Collaborators (nb_crm_opportunity_users)

Supports sales team collaboration on opportunities.

| Field | Type | Description |
|-----|------|------|
| opportunity_id | BIGINT | Opportunity (FK, Composite PK) |
| user_id | BIGINT | User (FK, Composite PK) |
| role | VARCHAR | Role: owner/collaborator/viewer |

#### 3.4.4 Regions (nb_cbo_regions)

Country/Region foundation data dictionary.

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| code_alpha2 | VARCHAR | ISO 3166-1 Alpha-2 Code (Unique) |
| code_alpha3 | VARCHAR | ISO 3166-1 Alpha-3 Code (Unique) |
| code_numeric | VARCHAR | ISO 3166-1 Numeric Code |
| name | VARCHAR | Country/Region Name |
| is_active | BOOLEAN | Is Active |
| sort_order | INTEGER | Sort Order |

---

## 4. Lead Lifecycle

Lead management uses a simplified 4-stage workflow. When a new lead is created, a workflow can automatically trigger AI scoring to help sales quickly identify high-quality leads.

### 4.1 Status Definitions

| Status | Name | Description |
|-----|------|------|
| new | New | Just created, awaiting contact |
| working | Working | Actively following up |
| qualified | Qualified | Ready for conversion |
| unqualified | Unqualified | Not a fit |

### 4.2 Status Flowchart

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Lead Conversion Process

The conversion interface provides three options simultaneously; users can choose to create or associate:

- **Customer**: Create a new customer OR associate with an existing customer.
- **Contact**: Create a new contact (associated with the customer).
- **Opportunity**: An opportunity must be created.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Post-conversion Records:**
- `converted_customer_id`: Associated Customer ID
- `converted_contact_id`: Associated Contact ID
- `converted_opportunity_id`: Created Opportunity ID

---

## 5. Opportunity Lifecycle

Opportunity management uses configurable sales pipeline stages. When an opportunity stage changes, it can automatically trigger AI win probability prediction to help sales identify risks and opportunities.

### 5.1 Configurable Stages

Stages are stored in the `nb_crm_opportunity_stages` collection and can be customized:

| Code | Name | Order | Default Win Probability |
|-----|------|------|---------|
| prospecting | Prospecting | 1 | 10% |
| analysis | Needs Analysis | 2 | 30% |
| proposal | Proposal/Price Quote | 3 | 60% |
| negotiation | Negotiation/Review | 4 | 80% |
| won | Closed Won | 5 | 100% |
| lost | Closed Lost | 6 | 0% |

### 5.2 Pipeline Flow
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Stagnation Detection

Opportunities without activity will be flagged:

| Days Without Activity | Action |
|-----------|------|
| 7 Days | Yellow Warning |
| 14 Days | Orange Reminder to Owner |
| 30 Days | Red Reminder to Manager |

```sql
-- Calculate stagnation days
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Win/Loss Handling

**When Won:**
1. Update stage to 'won'.
2. Record actual close date.
3. Update customer status to 'active'.
4. Trigger order creation (if a quotation was accepted).

**When Lost:**
1. Update stage to 'lost'.
2. Record loss reason.
3. Record competitor ID (if lost to a competitor).
4. Notify manager.

---

## 6. Quotation Lifecycle

### 6.1 Status Definitions

| Status | Name | Description |
|-----|------|------|
| draft | Draft | In preparation |
| pending_approval | Pending Approval | Awaiting approval |
| approved | Approved | Ready to send |
| sent | Sent | Sent to customer |
| accepted | Accepted | Accepted by customer |
| rejected | Rejected | Rejected by customer |
| expired | Expired | Past validity date |

### 6.2 Approval Rules (To be finalized)

Approval workflows are triggered based on the following conditions:

| Condition | Approval Level |
|------|---------|
| Discount > 10% | Sales Manager |
| Discount > 20% | Sales Director |
| Amount > $100K | Finance + General Manager |

### 6.3 Multi-currency Support

#### Design Philosophy

Use **USD as the unified base currency** for all reports and analysis. Each amount record stores:
- Original currency and amount (what the customer sees)
- Exchange rate at the time of transaction
- USD equivalent amount (for internal comparison)

#### Currency Dictionary (nb_cbo_currencies)

Currency configuration uses a common foundation data collection, supporting dynamic management. The `current_rate` field stores the current exchange rate, updated by a scheduled task from the most recent record in `nb_crm_exchange_rates`.

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| code | VARCHAR | Currency Code (Unique): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Currency Name |
| symbol | VARCHAR | Currency Symbol |
| decimal_places | INTEGER | Decimal Places |
| current_rate | DECIMAL | Current Rate to USD (Synced from history) |
| is_active | BOOLEAN | Is Active |
| sort_order | INTEGER | Sort Order |

#### Exchange Rate History (nb_crm_exchange_rates)

Records historical exchange rate data. A scheduled task syncs the latest rates to `nb_cbo_currencies.current_rate`.

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| currency_code | VARCHAR | Currency Code (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Rate to USD |
| effective_date | DATE | Effective Date |
| source | VARCHAR | Source: manual/api |
| createdAt | TIMESTAMP | Creation Time |

> **Note**: Quotations are associated with the `nb_cbo_currencies` collection via the `currency_id` foreign key, and the exchange rate is retrieved directly from the `current_rate` field. Opportunities and orders use a `currency` VARCHAR field to store the currency code.

#### Amount Field Pattern

Collections containing amounts follow this pattern:

| Field | Type | Description |
|-----|------|------|
| currency | VARCHAR | Transaction Currency |
| amount | DECIMAL | Original Amount |
| exchange_rate | DECIMAL | Exchange Rate to USD at transaction |
| amount_usd | DECIMAL | USD Equivalent (Calculated) |

**Applied to:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Workflow Integration
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Exchange Rate Retrieval Logic:**
1. Retrieve exchange rate directly from `nb_cbo_currencies.current_rate` during business operations.
2. USD Transactions: Rate = 1.0, no lookup required.
3. `current_rate` is synced by a scheduled task from the latest `nb_crm_exchange_rates` record.

### 6.4 Version Management

When a quotation is rejected or expired, it can be duplicated as a new version:

```
QT-20260119-001 v1 → Rejected
QT-20260119-001 v2 → Sent
QT-20260119-001 v3 → Accepted
```

---

## 7. Order Lifecycle

### 7.1 Order Overview

Orders are created when a quotation is accepted, representing a confirmed business commitment.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Order Status Definitions

| Status | Code | Description | Allowed Actions |
|-----|------|------|---------|
| Draft | `draft` | Order created, not yet confirmed | Edit, Confirm, Cancel |
| Confirmed | `confirmed` | Order confirmed, awaiting fulfillment | Start Fulfillment, Cancel |
| In Progress | `in_progress` | Order being processed/produced | Update Progress, Ship, Cancel (requires approval) |
| Shipped | `shipped` | Products shipped to customer | Mark as Delivered |
| Delivered | `delivered` | Customer received goods | Complete Order |
| Completed | `completed` | Order fully completed | None |
| Cancelled | `cancelled` | Order cancelled | None |

### 7.3 Order Data Model

#### nb_crm_orders

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| order_no | VARCHAR | Order Number (Auto-generated, Unique) |
| customer_id | BIGINT | Customer (FK) |
| contact_id | BIGINT | Contact (FK) |
| opportunity_id | BIGINT | Opportunity (FK) |
| quotation_id | BIGINT | Quotation (FK) |
| owner_id | BIGINT | Owner (FK → users) |
| status | VARCHAR | Order Status |
| payment_status | VARCHAR | Payment Status: unpaid/partial/paid |
| order_date | DATE | Order Date |
| delivery_date | DATE | Expected Delivery Date |
| actual_delivery_date | DATE | Actual Delivery Date |
| currency | VARCHAR | Order Currency |
| exchange_rate | DECIMAL | Rate to USD |
| order_amount | DECIMAL | Total Order Amount |
| paid_amount | DECIMAL | Paid Amount |
| unpaid_amount | DECIMAL | Unpaid Amount |
| shipping_address | TEXT | Shipping Address |
| logistics_company | VARCHAR | Logistics Company |
| tracking_no | VARCHAR | Tracking Number |
| terms_condition | TEXT | Terms and Conditions |
| description | TEXT | Description |

#### nb_crm_order_items

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| order_id | FK | Parent Order |
| product_id | FK | Product Reference |
| product_name | VARCHAR | Product Name Snapshot |
| quantity | INT | Quantity Ordered |
| unit_price | DECIMAL | Unit Price |
| discount_percent | DECIMAL | Discount Percentage |
| line_total | DECIMAL | Line Item Total |
| notes | TEXT | Line Item Notes |

### 7.4 Payment Tracking

#### nb_crm_payments

| Field | Type | Description |
|-----|------|------|
| id | BIGINT | Primary Key |
| order_id | BIGINT | Associated Order (FK, Required) |
| customer_id | BIGINT | Customer (FK) |
| payment_no | VARCHAR | Payment No. (Auto-generated, Unique) |
| amount | DECIMAL | Payment Amount (Required) |
| currency | VARCHAR | Payment Currency |
| payment_method | VARCHAR | Method: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Payment Date |
| bank_account | VARCHAR | Bank Account Number |
| bank_name | VARCHAR | Bank Name |
| notes | TEXT | Payment Notes |

---

## 8. Customer Lifecycle

### 8.1 Customer Overview

Customers are created during lead conversion or when an opportunity is won. The system tracks the complete lifecycle from acquisition to advocacy.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Customer Status Definitions

| Status | Code | Health | Description |
|-----|------|--------|------|
| Prospect | `prospect` | N/A | Converted lead, no orders yet |
| Active | `active` | ≥70 | Paying customer, good interaction |
| Growing | `growing` | ≥80 | Customer with expansion opportunities |
| At Risk | `at_risk` | <50 | Customer showing signs of churn |
| Churned | `churned` | N/A | No longer active |
| Win Back | `win_back` | N/A | Former customer being reactivated |
| Advocate | `advocate` | ≥90 | High satisfaction, provides referrals |

### 8.3 Customer Health Scoring

Customer health is calculated based on multiple factors:

| Factor | Weight | Metric |
|-----|------|---------|
| Purchase Recency | 25% | Days since last order |
| Purchase Frequency | 20% | Number of orders per period |
| Monetary Value | 20% | Total and average order value |
| Engagement | 15% | Email open rates, meeting participation |
| Support Health | 10% | Ticket volume and resolution rate |
| Product Usage | 10% | Active usage metrics (if applicable) |

**Health Thresholds:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Customer Segmentation

#### Automated Segmentation

| Segment | Condition | Suggested Action |
|-----|------|---------|
| VIP | LTV > $100K | White-glove service, executive sponsorship |
| Enterprise | Company Size > 500 | Dedicated Account Manager |
| Mid-Market | Company Size 50-500 | Regular check-ins, scaled support |
| Startup | Company Size < 50 | Self-service resources, community |
| Dormant | 90+ Days No Activity | Reactivation marketing |

---

## 9. Email Integration

### 9.1 Overview

NocoBase provides a built-in email integration plugin supporting Gmail and Outlook. Once emails are synced, workflows can automatically trigger AI analysis of email sentiment and intent, helping sales quickly understand customer attitudes.

### 9.2 Email Syncing

**Supported Providers:**
- Gmail (via OAuth 2.0)
- Outlook/Microsoft 365 (via OAuth 2.0)

**Sync Behavior:**
- Bi-directional sync of sent and received emails.
- Automatic association of emails to CRM records (Leads, Contacts, Opportunities).
- Attachments stored in the NocoBase file system.

### 9.3 Email-CRM Association (To be finalized)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 Email Templates

Sales can use preset templates:

| Template Category | Examples |
|---------|------|
| Initial Outreach | Cold email, Warm intro, Event follow-up |
| Follow-up | Meeting follow-up, Proposal follow-up, No-response nudge |
| Quotation | Quote attached, Quote revision, Quote expiring |
| Order | Order confirmation, Shipping notification, Delivery confirmation |
| Customer Success | Welcome, Check-in, Review request |

---

## 10. AI-Assisted Capabilities

### 10.1 AI Employee Team

The CRM system integrates the NocoBase AI plugin, utilizing the following built-in AI employees configured with CRM-specific tasks:

| ID | Name | Built-in Role | CRM Extension Capabilities |
|----|------|---------|-------------|
| viz | Viz | Data Analyst | Sales data analysis, pipeline forecasting |
| dara | Dara | Chart Expert | Data visualization, report development, dashboard design |
| ellis | Ellis | Editor | Email reply drafting, communication summaries, business email drafting |
| lexi | Lexi | Translator | Multi-language customer communication, content translation |
| orin | Orin | Organizer | Daily priorities, next-step suggestions, follow-up planning |

### 10.2 AI Task List

AI capabilities are divided into two independent categories:

#### I. AI Employees (Frontend Block Triggered)

Users interact directly with AI through frontend AI Employee blocks to obtain analysis and suggestions.

| Employee | Task | Description |
|------|------|------|
| Viz | Sales Data Analysis | Analyze pipeline trends and conversion rates |
| Viz | Pipeline Forecasting | Predict revenue based on weighted pipeline |
| Dara | Chart Generation | Generate sales report charts |
| Dara | Dashboard Design | Design data dashboard layouts |
| Ellis | Reply Drafting | Generate professional email replies |
| Ellis | Communication Summary | Summarize email threads |
| Ellis | Business Email Drafting | Meeting invites, follow-ups, thank-you emails, etc. |
| Orin | Daily Priorities | Generate a prioritized task list for the day |
| Orin | Next Best Action | Recommend next steps for each opportunity |
| Lexi | Content Translation | Translate marketing materials, proposals, and emails |

#### II. Workflow LLM Nodes (Backend Automated Execution)

LLM nodes nested within workflows, triggered automatically by collection events, action events, or scheduled tasks, independent of AI Employees.

| Task | Trigger Method | Description | Target Field |
|------|---------|------|---------|
| Lead Scoring | Collection Event (Create/Update) | Evaluate lead quality | ai_score, ai_convert_prob |
| Win Probability Prediction | Collection Event (Stage Change) | Predict opportunity success likelihood | ai_win_probability, ai_risk_factors |

> **Note**: Workflow LLM nodes use prompts and Schema output for structured JSON, which is parsed and written to business data fields without user intervention.

### 10.3 AI Fields in Database

| Table | AI Field | Description |
|----|--------|------|
| nb_crm_leads | ai_score | AI Score 0-100 |
| | ai_convert_prob | Conversion Probability |
| | ai_best_contact_time | Best Contact Time |
| | ai_tags | AI Generated Tags (JSONB) |
| | ai_scored_at | Scoring Time |
| | ai_next_best_action | Next Best Action Suggestion |
| | ai_nba_generated_at | Suggestion Generation Time |
| nb_crm_opportunities | ai_win_probability | AI Predicted Win Probability |
| | ai_analyzed_at | Analysis Time |
| | ai_confidence | Prediction Confidence |
| | ai_trend | Trend: up/stable/down |
| | ai_risk_factors | Risk Factors (JSONB) |
| | ai_recommendations | Recommendation List (JSONB) |
| | ai_predicted_close | Predicted Close Date |
| | ai_next_best_action | Next Best Action Suggestion |
| | ai_nba_generated_at | Suggestion Generation Time |
| nb_crm_customers | ai_health_score | Health Score 0-100 |
| | ai_health_grade | Health Grade: A/B/C/D |
| | ai_churn_risk | Churn Risk 0-100% |
| | ai_churn_risk_level | Churn Risk Level: low/medium/high |
| | ai_health_dimensions | Dimension Scores (JSONB) |
| | ai_recommendations | Recommendation List (JSONB) |
| | ai_health_assessed_at | Health Assessment Time |
| | ai_tags | AI Generated Tags (JSONB) |
| | ai_best_contact_time | Best Contact Time |
| | ai_next_best_action | Next Best Action Suggestion |
| | ai_nba_generated_at | Suggestion Generation Time |

---

## 11. Workflow Engine

### 11.1 Implemented Workflows

| Workflow Name | Trigger Type | Status | Description |
|-----------|---------|------|------|
| Leads Created | Collection Event | Enabled | Triggered when a lead is created |
| CRM Overall Analytics | AI Employee Event | Enabled | Overall CRM data analysis |
| Lead Conversion | Post-action Event | Enabled | Lead conversion process |
| Lead Assignment | Collection Event | Enabled | Automated lead assignment |
| Lead Scoring | Collection Event | Disabled | Lead scoring (To be finalized) |
| Follow-up Reminder | Scheduled Task | Disabled | Follow-up reminders (To be finalized) |

### 11.2 To-be-implemented Workflows

| Workflow | Trigger Type | Description |
|-------|---------|------|
| Opportunity Stage Advancement | Collection Event | Update win probability and record time on stage change |
| Opportunity Stagnation Detection | Scheduled Task | Detect inactive opportunities and send reminders |
| Quotation Approval | Post-action Event | Multi-level approval process |
| Order Generation | Post-action Event | Automatically generate order after quote acceptance |

---

## 12. Menu and Interface Design

### 12.1 Admin Structure

| Menu | Type | Description |
|------|------|------|
| **Dashboards** | Group | Dashboards |
| - Dashboard | Page | Default Dashboard |
| - SalesManager | Page | Sales Manager View |
| - SalesRep | Page | Sales Rep View |
| - Executive | Page | Executive View |
| **Leads** | Page | Lead Management |
| **Customers** | Page | Customer Management |
| **Opportunities** | Page | Opportunity Management |
| - Table | Tab | Opportunity List |
| **Products** | Page | Product Management |
| - Categories | Tab | Product Categories |
| **Orders** | Page | Order Management |
| **Settings** | Group | Settings |
| - Stage Settings | Page | Opportunity Stage Configuration |
| - Exchange Rate | Page | Exchange Rate Settings |
| - Activity | Page | Activity Records |
| - Emails | Page | Email Management |
| - Contacts | Page | Contact Management |
| - Data Analysis | Page | Data Analysis |

### 12.2 Dashboard Views

#### Sales Manager View

| Component | Type | Data |
|-----|------|------|
| Pipeline Value | KPI Card | Total pipeline amount by stage |
| Team Leaderboard | Table | Rep performance ranking |
| Risk Alerts | Alert List | High-risk opportunities |
| Win Rate Trend | Line Chart | Monthly win rate |
| Stagnant Deals | List | Deals requiring attention |

#### Sales Rep View

| Component | Type | Data |
|-----|------|------|
| My Quota Progress | Progress Bar | Monthly Actual vs. Quota |
| Pending Opportunities | KPI Card | Count of my pending opportunities |
| Closing This Week | List | Deals expected to close soon |
| Overdue Activities | Alert | Expired tasks |
| Quick Actions | Buttons | Log activity, Create opportunity |

#### Executive View

| Component | Type | Data |
|-----|------|------|
| Annual Revenue | KPI Card | Year-to-date revenue |
| Pipeline Value | KPI Card | Total pipeline amount |
| Win Rate | KPI Card | Overall win rate |
| Customer Health | Distribution | Health score distribution |
| Forecast | Chart | Monthly revenue forecast |

---

*Document Version: v2.0 | Updated: 2026-02-06*