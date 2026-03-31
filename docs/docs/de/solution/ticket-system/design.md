# Ticketing Solution Detailed Design

> **Version**: v2.0-beta

> **Updated**: 2026-01-05

> **Status**: Preview


## 1. System Overview and Design Philosophy

### 1.1 System Positioning

This system is an **AI-driven intelligent ticket management platform** built on the NocoBase low-code platform. The core goal is:

```
Let customer service focus on solving problems, not tedious process operations
```

### 1.2 Design Philosophy

#### Philosophy One: T-Shaped Data Architecture

**What is T-Shaped Architecture?**

Inspired by the "T-shaped talent" concept — horizontal breadth + vertical depth:

- **Horizontal (Main Table)**: Universal capabilities covering all business types — ticket number, status, assignee, SLA and other core fields
- **Vertical (Extension Tables)**: Specialized fields for specific business types — equipment repair has serial numbers, complaints have compensation plans

![ticketing-imgs-en-2025-12-31-23-18-25](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-18-25.png)

**Why This Design?**

| Traditional Approach | T-Shaped Architecture |
|---------------------|----------------------|
| One table per business type, duplicated fields | Common fields unified, business fields extended as needed |
| Statistical reports need to merge multiple tables | One main table for all ticket statistics |
| Process changes require modifications in multiple places | Core process changes in one place only |
| New business types require new tables | Only add extension tables, main flow unchanged |

#### Philosophy Two: AI Employee Team

Not "AI features", but "AI employees". Each AI has a clear role, personality, and responsibilities:

| AI Employee | Position | Core Responsibilities | Trigger Scenario |
|-------------|----------|----------------------|------------------|
| **Sam** | Service Desk Supervisor | Ticket routing, priority assessment, escalation decisions | Automatic on ticket creation |
| **Grace** | Customer Success Expert | Reply generation, tone adjustment, complaint handling | When agent clicks "AI Reply" |
| **Max** | Knowledge Assistant | Similar cases, knowledge recommendations, solution synthesis | Automatic on ticket detail page |
| **Lexi** | Translator | Multi-language translation, comment translation | Automatic when foreign language detected |

**Why the "AI Employee" Model?**

- **Clear Responsibilities**: Sam handles routing, Grace handles replies, no confusion
- **Easy to Understand**: Saying "Let Sam analyze this" is friendlier than "Call the classification API"
- **Extensible**: Adding new AI capabilities = hiring new employees

#### Philosophy Three: Knowledge Self-Circulation

![ticketing-imgs-en-2025-12-31-23-19-13](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-19-13.png)

This forms a **Knowledge Accumulation - Knowledge Application** closed loop.

---

## 2. Core Entities and Data Model

### 2.1 Entity Relationship Overview

![ticketing-imgs-en-2025-12-31-23-20-02](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-20-02.png)

### 2.2 Core Table Details

#### 2.2.1 Ticket Main Table (nb_tts_tickets)

This is the core of the system, using a "wide table" design with all commonly used fields in the main table.

**Basic Information**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| id | BIGINT | Primary key | 1001 |
| ticket_no | VARCHAR | Ticket number | TKT-20251229-0001 |
| title | VARCHAR | Title | Slow network connection |
| description | TEXT | Problem description | Since this morning, office network... |
| biz_type | VARCHAR | Business type | it_support |
| priority | VARCHAR | Priority | P1 |
| status | VARCHAR | Status | processing |

**Source Tracking**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| source_system | VARCHAR | Source system | crm / email / iot |
| source_channel | VARCHAR | Source channel | web / phone / wechat |
| external_ref_id | VARCHAR | External reference ID | CRM-2024-0001 |

**Contact Information**

| Field | Type | Description |
|-------|------|-------------|
| customer_id | BIGINT | Customer ID |
| contact_name | VARCHAR | Contact name |
| contact_phone | VARCHAR | Contact phone |
| contact_email | VARCHAR | Contact email |
| contact_company | VARCHAR | Company name |

**Assignee Information**

| Field | Type | Description |
|-------|------|-------------|
| assignee_id | BIGINT | Assignee ID |
| assignee_department_id | BIGINT | Assignee department ID |
| transfer_count | INT | Transfer count |

**Time Nodes**

| Field | Type | Description | Trigger Timing |
|-------|------|-------------|----------------|
| submitted_at | TIMESTAMP | Submission time | On ticket creation |
| assigned_at | TIMESTAMP | Assignment time | When assignee specified |
| first_response_at | TIMESTAMP | First response time | On first reply to customer |
| resolved_at | TIMESTAMP | Resolution time | When status changes to resolved |
| closed_at | TIMESTAMP | Closure time | When status changes to closed |

**SLA Related**

| Field | Type | Description |
|-------|------|-------------|
| sla_config_id | BIGINT | SLA config ID |
| sla_response_due | TIMESTAMP | Response deadline |
| sla_resolve_due | TIMESTAMP | Resolution deadline |
| sla_paused_at | TIMESTAMP | SLA pause start time |
| sla_paused_duration | INT | Cumulative pause duration (minutes) |
| is_sla_response_breached | BOOLEAN | Response breached |
| is_sla_resolve_breached | BOOLEAN | Resolution breached |

**AI Analysis Results**

| Field | Type | Description | Populated By |
|-------|------|-------------|--------------|
| ai_category_code | VARCHAR | AI-identified category | Sam |
| ai_sentiment | VARCHAR | Sentiment analysis | Sam |
| ai_urgency | VARCHAR | Urgency level | Sam |
| ai_keywords | JSONB | Keywords | Sam |
| ai_reasoning | TEXT | Reasoning process | Sam |
| ai_suggested_reply | TEXT | Suggested reply | Sam/Grace |
| ai_confidence_score | NUMERIC | Confidence score | Sam |
| ai_analysis | JSONB | Complete analysis result | Sam |

**Multi-Language Support**

| Field | Type | Description | Populated By |
|-------|------|-------------|--------------|
| source_language_code | VARCHAR | Original language | Sam/Lexi |
| target_language_code | VARCHAR | Target language | System default EN |
| is_translated | BOOLEAN | Whether translated | Lexi |
| description_translated | TEXT | Translated description | Lexi |

#### 2.2.2 Business Extension Tables

**Equipment Repair (nb_tts_biz_repair)**

| Field | Type | Description |
|-------|------|-------------|
| ticket_id | BIGINT | Associated ticket ID |
| equipment_model | VARCHAR | Equipment model |
| serial_number | VARCHAR | Serial number |
| fault_code | VARCHAR | Fault code |
| spare_parts | JSONB | Spare parts list |
| maintenance_type | VARCHAR | Maintenance type |

**IT Support (nb_tts_biz_it_support)**

| Field | Type | Description |
|-------|------|-------------|
| ticket_id | BIGINT | Associated ticket ID |
| asset_number | VARCHAR | Asset number |
| os_version | VARCHAR | OS version |
| software_name | VARCHAR | Software involved |
| remote_address | VARCHAR | Remote address |
| error_code | VARCHAR | Error code |

**Customer Complaint (nb_tts_biz_complaint)**

| Field | Type | Description |
|-------|------|-------------|
| ticket_id | BIGINT | Associated ticket ID |
| related_order_no | VARCHAR | Related order number |
| complaint_level | VARCHAR | Complaint level |
| compensation_amount | DECIMAL | Compensation amount |
| compensation_type | VARCHAR | Compensation method |
| root_cause | TEXT | Root cause |

#### 2.2.3 Comments Table (nb_tts_ticket_comments)

**Core Fields**

| Field | Type | Description |
|-------|------|-------------|
| id | BIGINT | Primary key |
| ticket_id | BIGINT | Ticket ID |
| parent_id | BIGINT | Parent comment ID (supports tree structure) |
| content | TEXT | Comment content |
| direction | VARCHAR | Direction: inbound(customer)/outbound(agent) |
| is_internal | BOOLEAN | Whether internal note |
| is_first_response | BOOLEAN | Whether first response |

**AI Review Fields (for outbound)**

| Field | Type | Description |
|-------|------|-------------|
| source_language_code | VARCHAR | Source language |
| content_translated | TEXT | Translated content |
| is_translated | BOOLEAN | Whether translated |
| is_ai_blocked | BOOLEAN | Whether blocked by AI |
| ai_block_reason | VARCHAR | Block reason |
| ai_block_detail | TEXT | Detailed explanation |
| ai_quality_score | NUMERIC | Quality score |
| ai_suggestions | TEXT | Improvement suggestions |

#### 2.2.4 Ratings Table (nb_tts_ratings)

| Field | Type | Description |
|-------|------|-------------|
| ticket_id | BIGINT | Ticket ID (unique) |
| overall_rating | INT | Overall satisfaction (1-5) |
| response_rating | INT | Response speed (1-5) |
| professionalism_rating | INT | Professionalism (1-5) |
| resolution_rating | INT | Problem resolution (1-5) |
| nps_score | INT | NPS score (0-10) |
| tags | JSONB | Quick tags |
| comment | TEXT | Written feedback |

#### 2.2.5 Knowledge Articles Table (nb_tts_qa_articles)

| Field | Type | Description |
|-------|------|-------------|
| article_no | VARCHAR | Article number KB-T0001 |
| title | VARCHAR | Title |
| content | TEXT | Content (Markdown) |
| summary | TEXT | Summary |
| category_code | VARCHAR | Category code |
| keywords | JSONB | Keywords |
| source_type | VARCHAR | Source: ticket/faq/manual |
| source_ticket_id | BIGINT | Source ticket ID |
| ai_generated | BOOLEAN | Whether AI-generated |
| ai_quality_score | NUMERIC | Quality score |
| status | VARCHAR | Status: draft/published/archived |
| view_count | INT | View count |
| helpful_count | INT | Helpful count |

### 2.3 Data Table List

| No. | Table Name | Description | Record Type |
|-----|------------|-------------|-------------|
| 1 | nb_tts_tickets | Ticket main table | Business data |
| 2 | nb_tts_biz_repair | Equipment repair extension | Business data |
| 3 | nb_tts_biz_it_support | IT support extension | Business data |
| 4 | nb_tts_biz_complaint | Customer complaint extension | Business data |
| 5 | nb_tts_customers | Customer main table | Business data |
| 6 | nb_tts_customer_contacts | Customer contacts | Business data |
| 7 | nb_tts_ticket_comments | Ticket comments | Business data |
| 8 | nb_tts_ratings | Satisfaction ratings | Business data |
| 9 | nb_tts_qa_articles | Knowledge articles | Knowledge data |
| 10 | nb_tts_qa_article_relations | Article relations | Knowledge data |
| 11 | nb_tts_faqs | FAQs | Knowledge data |
| 12 | nb_tts_tickets_categories | Ticket categories | Config data |
| 13 | nb_tts_sla_configs | SLA configuration | Config data |
| 14 | nb_tts_skill_configs | Skill configuration | Config data |
| 15 | nb_tts_business_types | Business types | Config data |

---

## 3. Ticket Lifecycle

### 3.1 Status Definitions

| Status | Name | Description | SLA Timing | Color |
|--------|------|-------------|------------|-------|
| new | New | Just created, awaiting assignment | Start | Blue |
| assigned | Assigned | Assignee specified, awaiting pickup | Continue | Cyan |
| processing | Processing | Being processed | Continue | Orange |
| pending | Pending | Waiting for customer feedback | **Paused** | Gray |
| transferred | Transferred | Transferred to another person | Continue | Purple |
| resolved | Resolved | Waiting for customer confirmation | Stop | Green |
| closed | Closed | Ticket ended | Stop | Gray |
| cancelled | Cancelled | Ticket cancelled | Stop | Gray |

### 3.2 Status Flow Diagram

**Main Flow (Left to Right)**

![ticketing-imgs-en-2025-12-31-23-21-01](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-21-01.png)

**Branch Flows**

![ticketing-imgs-en-2025-12-31-23-22-14](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-14.png)

![ticketing-imgs-en-2025-12-31-23-22-32](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-32.png)

**Complete State Machine**

![ticketing-imgs-en-2025-12-31-23-23-13](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-13.png)

### 3.3 Key Status Transition Rules

| From | To | Trigger Condition | System Action |
|------|----|--------------------|---------------|
| new | assigned | Assign handler | Record assigned_at |
| assigned | processing | Handler clicks "Accept" | None |
| processing | pending | Click "Pause" | Record sla_paused_at |
| pending | processing | Customer reply / Manual resume | Calculate pause duration, clear paused_at |
| processing | resolved | Click "Resolve" | Record resolved_at |
| resolved | closed | Customer confirm / 3-day timeout | Record closed_at |
| * | cancelled | Cancel ticket | None |

---

## 4. SLA Service Level Management

### 4.1 Priority and SLA Configuration

| Priority | Name | Response Time | Resolution Time | Alert Threshold | Typical Scenario |
|----------|------|---------------|-----------------|-----------------|------------------|
| P0 | Critical | 15 min | 2 hours | 80% | System down, production line stopped |
| P1 | High | 1 hour | 8 hours | 80% | Important feature failure |
| P2 | Medium | 4 hours | 24 hours | 80% | General issues |
| P3 | Low | 8 hours | 72 hours | 80% | Inquiries, suggestions |

### 4.2 SLA Calculation Logic

![ticketing-imgs-en-2025-12-31-23-23-46](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-46.png)

#### On Ticket Creation

```
sla_response_due = submitted_at + response_time_minutes
sla_resolve_due = submitted_at + resolve_time_minutes
```

#### On Pause (pending)

```
-- Record pause start time
sla_paused_at = NOW()
```

#### On Resume (from pending to processing)

```
-- Calculate pause duration
pause_duration = NOW() - sla_paused_at

-- Add to total pause duration
sla_paused_duration = sla_paused_duration + pause_duration

-- Extend deadlines
sla_response_due = sla_response_due + pause_duration
sla_resolve_due = sla_resolve_due + pause_duration

-- Clear pause time
sla_paused_at = NULL
```

#### SLA Breach Determination

```
-- Response breach
is_sla_response_breached = (first_response_at IS NULL AND NOW() > sla_response_due)
                        OR (first_response_at > sla_response_due)

-- Resolution breach
is_sla_resolve_breached = (resolved_at IS NULL AND NOW() > sla_resolve_due)
                       OR (resolved_at > sla_resolve_due)
```

### 4.3 SLA Alert Mechanism

| Alert Level | Condition | Notify | Method |
|-------------|-----------|--------|--------|
| Yellow Alert | Remaining time < 20% | Assignee | In-app notification |
| Red Alert | Already timeout | Assignee + Supervisor | In-app + Email |
| Escalation Alert | Timeout 1 hour | Department Manager | Email + SMS |

### 4.4 SLA Dashboard Metrics

| Metric | Formula | Health Threshold |
|--------|---------|------------------|
| Response Compliance Rate | Non-breached tickets / Total tickets | > 95% |
| Resolution Compliance Rate | Non-breached resolved / Total resolved | > 90% |
| Average Response Time | SUM(response time) / Ticket count | < 50% of SLA |
| Average Resolution Time | SUM(resolution time) / Ticket count | < 80% of SLA |

---

## 5. AI Capabilities and Employee System

### 5.1 AI Employee Team

The system configures 8 AI employees in two categories:

**New Employees (Ticketing System Specific)**

| ID | Name | Position | Core Capabilities |
|----|------|----------|-------------------|
| sam | Sam | Service Desk Supervisor | Ticket routing, priority assessment, escalation decisions, SLA risk identification |
| grace | Grace | Customer Success Expert | Professional reply generation, tone adjustment, complaint handling, satisfaction recovery |
| max | Max | Knowledge Assistant | Similar case search, knowledge recommendations, solution synthesis |

**Reused Employees (General Capabilities)**

| ID | Name | Position | Core Capabilities |
|----|------|----------|-------------------|
| dex | Dex | Data Organizer | Email-to-ticket, call-to-ticket, batch data cleaning |
| ellis | Ellis | Email Expert | Email sentiment analysis, thread summarization, reply drafting |
| lexi | Lexi | Translator | Ticket translation, reply translation, real-time conversation translation |
| cole | Cole | NocoBase Expert | System usage guidance, workflow configuration help |
| vera | Vera | Research Analyst | Technical solution research, product information verification |

### 5.2 AI Task List

Each AI employee is configured with 4 specific tasks:

#### Sam's Tasks

| Task ID | Name | Trigger Method | Description |
|---------|------|----------------|-------------|
| SAM-01 | Ticket Analysis & Routing | Workflow auto | Auto-analyze on new ticket creation |
| SAM-02 | Priority Re-evaluation | Frontend interaction | Adjust priority based on new info |
| SAM-03 | Escalation Decision | Frontend/Workflow | Determine if escalation needed |
| SAM-04 | SLA Risk Assessment | Workflow auto | Identify timeout risks |

#### Grace's Tasks

| Task ID | Name | Trigger Method | Description |
|---------|------|----------------|-------------|
| GRACE-01 | Professional Reply Generation | Frontend interaction | Generate reply based on context |
| GRACE-02 | Reply Tone Adjustment | Frontend interaction | Optimize existing reply tone |
| GRACE-03 | Complaint De-escalation | Frontend/Workflow | Resolve customer complaints |
| GRACE-04 | Satisfaction Recovery | Frontend/Workflow | Follow-up after negative experience |

#### Max's Tasks

| Task ID | Name | Trigger Method | Description |
|---------|------|----------------|-------------|
| MAX-01 | Similar Case Search | Frontend/Workflow | Find similar historical tickets |
| MAX-02 | Knowledge Article Recommendation | Frontend/Workflow | Recommend relevant knowledge articles |
| MAX-03 | Solution Synthesis | Frontend interaction | Synthesize solutions from multiple sources |
| MAX-04 | Troubleshooting Guide | Frontend interaction | Create systematic troubleshooting process |

#### Lexi's Tasks

| Task ID | Name | Trigger Method | Description |
|---------|------|----------------|-------------|
| LEXI-01 | Ticket Translation | Workflow auto | Translate ticket content |
| LEXI-02 | Reply Translation | Frontend interaction | Translate agent replies |
| LEXI-03 | Batch Translation | Workflow auto | Batch translation processing |
| LEXI-04 | Real-time Conversation Translation | Frontend interaction | Real-time dialogue translation |

### 5.3 AI Employees and Ticket Lifecycle

![ticketing-imgs-en-2025-12-31-23-24-22](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-22.png)

### 5.4 AI Response Examples

#### SAM-01 Ticket Analysis Response

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "login failure", "timeout", "month-end closing"],
  "confidence": 0.92,
  "reasoning": "This ticket describes an ERP system login issue affecting finance department month-end closing, high urgency",
  "suggested_reply": "Dear Customer, thank you for reporting this issue...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Hello, our ERP system cannot login..."
}
```

#### GRACE-01 Reply Generation Response

```
Dear Mr. Zhang,

Thank you for contacting us about the ERP login issue. I fully understand this issue is
affecting your company's month-end closing work, and we have prioritized this as high priority.

Current status:
- Technical team is investigating server connection issues
- Expected to provide an update within 30 minutes

In the meantime, you can try:
1. Access via backup address: https://erp-backup.company.com
2. For urgent report needs, contact us for export assistance

Please feel free to contact me if you have any other questions.

Best regards,
Technical Support Team
```

### 5.5 AI EQ Firewall

Grace's reply quality review blocks the following issues:

| Issue Type | Original Example | AI Suggestion |
|------------|------------------|---------------|
| Negative tone | "No, this is not under warranty" | "This fault is not currently covered by free warranty, we can offer a paid repair plan" |
| Blaming customer | "You broke it yourself" | "Upon verification, this fault is accidental damage" |
| Shifting responsibility | "Not our problem" | "Let me help you further investigate the cause" |
| Cold expression | "Don't know" | "Let me look up the relevant information for you" |
| Sensitive information | "Your password is abc123" | [Blocked] Contains sensitive information, not allowed to send |

---

## 6. Knowledge Base System

### 6.1 Knowledge Sources

![ticketing-imgs-en-2025-12-31-23-24-57](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-57.png)

### 6.2 Ticket-to-Knowledge Flow

![ticketing-imgs-en-2025-12-31-23-25-18](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-18.png)

**Evaluation Dimensions**:
- **Generality**: Is this a common problem?
- **Completeness**: Is the solution clear and complete?
- **Reproducibility**: Are the steps reusable?

### 6.3 Knowledge Recommendation Mechanism

When an agent opens ticket details, Max automatically recommends related knowledge:

```
┌────────────────────────────────────────────────────────────┐
│ Recommended Knowledge                       [Expand/Collapse]│
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 CNC Servo System Fault Diagnosis Guide  Match: 94% │
│ │ Includes: Alarm code interpretation, servo drive check steps │
│ │ [View] [Apply to Reply] [Mark Helpful]                   │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 XYZ-CNC3000 Series Maintenance Manual   Match: 87% │
│ │ Includes: Common faults, preventive maintenance plan      │
│ │ [View] [Apply to Reply] [Mark Helpful]                   │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 6.4 Knowledge Base Health Metrics

| Metric | Formula | Health Threshold |
|--------|---------|------------------|
| Coverage Rate | Tickets with recommendations / Total tickets | > 60% |
| Effectiveness Rate | helpful_count / (helpful + not_helpful) | > 75% |
| Citation Rate | Cited articles / Total published articles | > 40% |
| Freshness | Articles updated in last 90 days ratio | > 50% |

---

## 7. Workflow Engine

### 7.1 Workflow Categories

| Code | Category | Description | Trigger Method |
|------|----------|-------------|----------------|
| WF-T | Ticket Flow | Ticket lifecycle management | Form events |
| WF-S | SLA Flow | SLA calculation and alerts | Form events/Scheduled |
| WF-C | Comment Flow | Comment processing and translation | Form events |
| WF-R | Rating Flow | Rating invitations and statistics | Form events/Scheduled |
| WF-N | Notification Flow | Notification sending | Event-driven |
| WF-AI | AI Flow | AI analysis and generation | Form events |

### 7.2 Core Workflows

#### WF-T01: Ticket Creation Flow

![ticketing-imgs-en-2025-12-31-23-25-48](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-48.png)

#### WF-AI01: Ticket AI Analysis

![ticketing-imgs-en-2025-12-31-23-26-14](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-14.png)

#### WF-AI04: Comment Translation & Review

![ticketing-imgs-en-2025-12-31-23-26-38](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-38.png)

#### WF-AI03: Knowledge Generation

![ticketing-imgs-en-2025-12-31-23-26-54](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-54.png)

### 7.3 Scheduled Tasks

| Task | Frequency | Description |
|------|-----------|-------------|
| SLA Alert Check | Every 5 minutes | Check tickets about to timeout |
| Ticket Auto-Close | Daily | Auto-close resolved status after 3 days |
| Rating Invitation | Daily | Send rating invitation 24 hours after close |
| Statistics Update | Hourly | Update customer ticket statistics |

---

## 8. Menu and Interface Design

### 8.1 Backend Admin

![ticketing-imgs-en-2025-12-31-23-27-19](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-19.png)

### 8.2 Customer Portal

![ticketing-imgs-en-2025-12-31-23-27-35](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-35.png)

### 8.3 Dashboard Design

#### Executive View

| Component | Type | Data Description |
|-----------|------|------------------|
| SLA Compliance Rate | Gauge | This month's response/resolution compliance |
| Satisfaction Trend | Line Chart | Last 30 days satisfaction changes |
| Ticket Volume Trend | Bar Chart | Last 30 days ticket volume |
| Business Type Distribution | Pie Chart | Proportion of each business type |

#### Supervisor View

| Component | Type | Data Description |
|-----------|------|------------------|
| Timeout Alerts | List | About to timeout/already timeout tickets |
| Team Workload | Bar Chart | Team member ticket counts |
| Backlog Distribution | Stacked Chart | Ticket counts by status |
| Processing Time | Heatmap | Average processing time distribution |

#### Agent View

| Component | Type | Data Description |
|-----------|------|------------------|
| My To-Do | Number Card | Pending ticket count |
| Priority Distribution | Pie Chart | P0/P1/P2/P3 distribution |
| Today's Statistics | Metric Card | Today's processed/resolved count |
| SLA Countdown | List | Top 5 most urgent tickets |

---

## Appendix

### A. Business Type Configuration

| Type Code | Name | Icon | Associated Extension Table |
|-----------|------|------|---------------------------|
| repair | Equipment Repair | wrench | nb_tts_biz_repair |
| it_support | IT Support | computer | nb_tts_biz_it_support |
| complaint | Customer Complaint | megaphone | nb_tts_biz_complaint |
| consultation | Consultation | question | None |
| other | Other | memo | None |

### B. Category Codes

| Code | Name | Description |
|------|------|-------------|
| CONVEYOR | Conveyor System | Conveyor system issues |
| PACKAGING | Packaging Machine | Packaging machine issues |
| WELDING | Welding Equipment | Welding equipment issues |
| COMPRESSOR | Air Compressor | Air compressor issues |
| COLD_STORE | Cold Storage | Cold storage issues |
| CENTRAL_AC | Central AC | Central AC issues |
| FORKLIFT | Forklift | Forklift issues |
| COMPUTER | Computer | Computer hardware issues |
| PRINTER | Printer | Printer issues |
| PROJECTOR | Projector | Projector issues |
| INTERNET | Network | Network connectivity issues |
| EMAIL | Email | Email system issues |
| ACCESS | Access | Account permission issues |
| PROD_INQ | Product Inquiry | Product inquiry |
| COMPLAINT | General Complaint | General complaint |
| DELAY | Shipping Delay | Shipping delay complaint |
| DAMAGE | Package Damage | Package damage complaint |
| QUANTITY | Quantity Shortage | Quantity shortage complaint |
| SVC_ATTITUDE | Service Attitude | Service attitude complaint |
| PROD_QUALITY | Product Quality | Product quality complaint |
| TRAINING | Training | Training request |
| RETURN | Return | Return request |

---

*Document Version: 2.0 | Last Updated: 2026-01-05*
