---
pkg: "@nocobase/plugin-ai"
---

# AI Employees · Getting Started

## 1. Introduction
> The official CRM Demo has pre-configured common AI Employees and tasks, allowing you to get started quickly without any configuration.

**AI Employees** are "role-based assistants" built into the NocoBase interface. Depending on where you open them, they can understand the context of your current page and data (such as a Leads list, Account details, or a form page) and directly perform tasks like analysis, extraction, translation, retrieval, and providing configuration suggestions.


### 1.1. Opening Locations
In the official CRM Demo, you will most commonly encounter them in these ways:

* **Global panel in the bottom-right corner**: Can be opened at any time, carrying the current page context for follow-up questions or configuration inquiries.


![AI Employee Global Panel](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)


* **Action button in the top-right corner of a block**: For example, clicking **Viz** in the **Leads** list will generate a trend chart, a stage funnel, and a brief summary (no need to write a prompt).

![01getting-started-2025-10-27-00-41-34](https://static-docs.nocobase.com/01getting-started-2025-10-27-00-41-34.png)


* **Specific interfaces**: Such as the front-end engineer **Nathan** in the code editor, or the data modeling assistant **Orin** in the bottom-right corner of the data source configuration page.

![01getting-started-2025-10-27-00-42-28](https://static-docs.nocobase.com/01getting-started-2025-10-27-00-42-28.png)


![01getting-started-2025-10-27-00-43-12](https://static-docs.nocobase.com/01getting-started-2025-10-27-00-43-12.png)



### 1.2. Design Philosophy: Roles & Scenarios

Each AI Employee consists of two parts:
* **A stable role**: Their "personality and expertise," such as Viz's analytical skills or Lexi's linguistic talents. This part is fixed long-term.
* **Flexible tasks**: Task scripts or tools that can be adjusted at any time based on business needs, such as "Analyze this month's sales leads" or "Translate the current form."

This design allows AI Employees to maintain a consistent style while quickly adapting to different business scenarios.

---

## 2. Scenarios and Usage

> It is recommended to start with "pre-configured tasks" to see the results first before diving into the details.

### 2.1. View Lead Trends and Stages

* **Entry point**: Leads list → **Viz** in the top-right corner of the block
* **Action**: Select a pre-configured task (e.g., "Stage Conversion and Trends," "Source Channel Comparison," "This Month vs. Last Month Review") → Wait for the chart and a 2–3 point summary.


![Multi-task Selection](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)


* **Deeper analysis**: You can ask follow-up questions like "Show only the East region," "Summarize by week," or "Exclude direct channels."
* **Note**: Viz defaults to "**one chart, one key point.**" If there is insufficient data, it will provide a clear notification instead of fabricating conclusions. Charts are output in standard ECharts JSON format.

### 2.2. Turn Chats/Emails into Form Data

* **Entry point**: Leads → New Form → **Dex / Lexi** in the action area below the block


![01getting-started-2025-10-27-00-32-51](https://static-docs.nocobase.com/01getting-started-2025-10-27-00-32-51.png)


* **Action**:

  * Dex: Paste the raw text → Execute "Extract and Fill" to automatically identify and write the customer's name, contact information, issue type, etc., into the fields.
  * Lexi: Execute "Translate current form content," keeping numerical and date formats unchanged.
* **Note**: If any content is missing, it will be flagged, allowing for quick manual completion before submission.

### 2.3. Get Customer Company Overview

* **Entry point**: An Account's details page → **Vera** in the top-right corner of the block

![01getting-started-2025-10-27-00-35-11](https://static-docs.nocobase.com/01getting-started-2025-10-27-00-35-11.png)

* **Action**: Select the "Company Background and Industry Overview" task → Search the web → Output a summary and a list of key points.
* **Deeper analysis**: You can expand on "Recent Developments," "Competitor Comparison," or "Potential Risks."

### 2.4. Encountering Configuration or Permission Issues

* **Entry point**: Global panel in the bottom-right corner → **Cole**
* **Action**: Describe the issue (e.g., "The button is not displayed," "Who can access this page?") → Receive a diagnostic path and recommended actions.
* **Note**: Cole provides diagnostics and action paths but does not directly modify your data or permissions.

---

## 3. AI Employee Overview and Quick Reference

> This section provides a **complete list + quick links** to avoid repeating examples from the main text.

| AI Employee     | Functional Role   | Core Scenarios                       | Best For               |
| ---------- | ---------- | ------------------------------ | ---------------------- |
| [**Viz**](/ai-employees/built-in/viz)    | Insight Analyst | Business analysis, report generation, trend insight   | When you need to gain insights from data   |
| [**Orin**](/ai-employees/built-in/data-modeling)   | Data Modeler | Collection creation/modification, relationship design, index optimization   | Designing or optimizing database structure   |
| [**Dex**](/ai-employees/built-in/form-filler)    | Data Organization Assistant | Text extraction, form filling, information structuring | Handling messy, unstructured information |
| **Lexi**   | Translation Expert   | Multilingual translation, localization, terminology management   | Cross-language communication and document processing   |
| [**Nathan**](/ai-employees/built-in/ai-coding) | Front-end Engineer | Field linkage, component development, form logic   | Implementing front-end interactions and business logic |
| **Cole**   | NocoBase Assistant   | NocoBase configuration guidance, best practices     | "What is/How to use/Why"     |
| **Vera**   | Research Analyst | Competitor analysis, industry research, intelligence gathering   | When you need external information and market insights |

**Usage Tips**

* **Check the page block first**: Most pages already have an "employee button." Use it first, as it's already bound to the context and pre-configured tasks.
* **Start with a template task**: Get a visible result first, then ask a second question.
* **Specify the data scope**: For example, "this month/this week, third-party channels only." This helps Viz generate charts faster and more accurately.

---

## 4. Admin and Advanced Configuration

**Basic Configuration:**

* [AI Employees · Admin Configuration Guide](/ai-employees/configuration/admin-configuration) — Model service configuration / Creating employees / Task configuration / Skill management
* [Prompt Engineering Guide](/ai-employees/configuration/prompt-engineering-guide) — The golden structure and templates for writing good prompts / The "Context Definition → Task Specialization" method

**Business Scenario Applications:**

The following documents show how to configure AI Employees for specific business scenarios:

* [Viz: CRM Scenario Configuration](/ai-employees/scenarios/viz-crm) — Task configuration, analysis templates, and prompt optimization for Viz in CRM sales scenarios
* Customer Service Scenario: Automatic Ticket Extraction — Field mapping and rule settings for Dex in customer service scenarios
* Multilingual Scenario: Content Localization — Terminology base and format standards for Lexi in multilingual teams
* Market Research Scenario: Competitor Analysis — Customizing Vera's search scope and output templates
* System Operations Scenario: Configuration Q&A — Building a knowledge base and classifying questions for Cole

---

### Conclusion

Start with **Leads → Viz** in our demo and run a pre-configured "Stage Conversion and Trends" task. The best approach to using AI Employees is to **first see the results, then ask follow-up questions, and finally explore the configuration**. If you need to customize or extend their capabilities, you can proceed to the admin and advanced prompt guides.