# AI Agent · Viz: CRM Scenario Configuration Guide

> Using the CRM example, learn how to make your AI insight analyst truly understand your business and unleash its full potential.

## 1. Introduction: Making Viz Go from "Seeing Data" to "Understanding Business"

In the NocoBase system, **Viz** is a pre-built AI insight analyst.
It can recognize page context (like Leads, Opportunities, Accounts) and generate trend charts, funnel charts, and KPI cards.
But by default, it only has the most basic query capabilities:

| Tool | Function Description | Security |
| --- | --- | --- |
| Get Collection Names | Get Collection List | ✅ Secure |
| Get Collection Metadata | Get Field Structure | ✅ Secure |

These tools only allow Viz to "recognize structure," but not yet truly "understand content."
To enable it to generate insights, detect anomalies, and analyze trends, you need to **extend it with more suitable analysis tools**.

In the official CRM Demo, we used two methods:

*   **Overall Analytics (General-purpose analysis engine)**: A templated, secure, and reusable solution;
*   **SQL Execution (Specialized analysis engine)**: Offers more flexibility but comes with greater risks.

These two are not the only options; they are more like a **design paradigm**:

> You can follow its principles to create an implementation that is better suited to your own business.

---

## 2. Viz's Structure: Stable Persona + Flexible Tasks

To understand how to extend Viz, you first need to understand its layered internal design:

| Layer | Description | Example |
| --- | --- | --- |
| **Role Definition** | Viz's persona and analysis method: Understand → Query → Analyze → Visualize | Fixed |
| **Task Definition** | Customized prompts and tool combinations for a specific business scenario | Modifiable |
| **Tool Configuration** | The bridge for Viz to call external data sources or workflows | Freely replaceable |

This layered design allows Viz to maintain a stable personality (consistent analysis logic) while quickly adapting to different business scenarios (CRM, hospital management, channel analysis, production operations...).

---

## 3. Pattern One: Templated Analysis Engine (Recommended)

### 3.1 Principle Overview

**Overall Analytics** is the core analysis engine in the CRM Demo.
It manages all SQL queries through a **data analysis template collection (data_analysis)**.
Viz does not write SQL directly, but instead **calls predefined templates** to generate results.

The execution flow is as follows:

```mermaid
flowchart TD
    A[Viz receives task] --> B[Calls Overall Analytics workflow]
    B --> C[Matches template based on current page/task]
    C --> D[Executes template SQL (read-only)]
    D --> E[Returns data result]
    E --> F[Viz generates chart + brief interpretation]
```

This way, Viz can generate secure and standardized analysis results in seconds, and administrators can centrally manage and review all SQL templates.

---

### 3.2 Template Collection Structure (data_analysis)

| Field Name | Type | Description | Example |
| --- | --- | --- | --- |
| **id** | Integer | Primary Key | 1 |
| **name** | Text | Analysis template name | Leads Data Analysis |
| **collection** | Text | Corresponding collection | Lead |
| **sql** | Code | Analysis SQL statement (read-only) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description** | Markdown | Template description or definition | "Count leads by stage" |
| **createdAt / createdBy / updatedAt / updatedBy** | System Field | Audit information | Auto-generated |

#### Template Examples in the CRM Demo

| Name | Collection | Description |
| --- | --- | --- |
| Account Data Analysis | Account | Account Data Analysis |
| Contact Data Analysis | Contact | Contact Data Analysis |
| Leads Data Analysis | Lead | Leads Trend Analysis |
| Opportunity Data Analysis | Opportunity | Opportunity Stage Funnel |
| Task Data Analysis | Todo Tasks | To-do Tasks Status Statistics |
| Users (Sales Reps) Data Analysis | Users | Sales Reps Performance Comparison |

---

### 3.3 Advantages of This Pattern

| Dimension | Advantage |
| --- | --- |
| **Security** | All SQL is stored and reviewed, avoiding direct query generation. |
| **Maintainability** | Templates are centrally managed and updated uniformly. |
| **Reusability** | The same template can be reused by multiple tasks. |
| **Portability** | Can be easily migrated to other systems, requiring only the same collection structure. |
| **User Experience** | Business users don't need to worry about SQL; they just need to initiate an analysis request. |

> 📘 This `data_analysis` collection doesn't have to be called this name.
> The key is: **to store analysis logic in a templated way** and have it called uniformly by a workflow.

---

### 3.4 How to Make Viz Use It

In the task definition, you can explicitly tell Viz:

```markdown
Hi Viz,

Please analyze the data of the current module.

**Priority:** Use the Overall Analytics tool to get analysis results from the template collection.
**If no matching template is found:** State that a template is missing and suggest that the administrator add one.

Output requirements:
- Generate a separate chart for each result;
- Include a brief 2–3 sentence description below the chart;
- Do not fabricate data or make assumptions.
```

This way, Viz will automatically call the workflow, match the most suitable SQL from the template collection, and generate the chart.

---

## 4. Pattern Two: Specialized SQL Executor (Use with caution)

### 4.1 Applicable Scenarios

When you need exploratory analysis, ad-hoc queries, or multi-collection JOIN aggregations, you can have Viz call an **SQL Execution** tool.

The features of this tool are:

*   Viz can directly generate `SELECT` queries;
*   The system executes it and returns the result;
*   Viz is responsible for analysis and visualization.

Example task:

> "Please analyze the trend of lead conversion rates by region over the last 90 days."

In this case, Viz might generate:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Risks and Protection Recommendations

| Risk Point | Protection Strategy |
| --- | --- |
| Generating write operations | Forcefully restrict to `SELECT` |
| Accessing unrelated collections | Validate if the collection name exists |
| Performance risk with large collections | Limit time range, use LIMIT for the number of rows |
| Operation traceability | Enable query logging and auditing |
| User permission control | Only administrators can use this tool |

> General recommendations:
>
> *   Regular users should only have templated analysis (Overall Analytics) enabled;
> *   Only administrators or senior analysts should be allowed to use SQL Execution.

---

## 5. If You Want to Build Your Own "Overall Analytics"

Here is a simple, general approach that you can replicate in any system (not dependent on NocoBase):

### Step 1: Design the Template Collection

The collection name can be anything (e.g., `analysis_templates`).
It just needs to include the fields: `name`, `sql`, `collection`, and `description`.

### Step 2: Write a "Fetch Template → Execute" Service or Workflow

Logic:

1.  Receive the task or page context (e.g., the current collection);
2.  Match a template;
3.  Execute the template SQL (read-only);
4.  Return a standardized data structure (rows + fields).

### Step 3: Have the AI Call This Interface

The task prompt can be written like this:

```
First, try to call the template analysis tool. If no matching analysis is found in the templates, then use the SQL executor.
Please ensure all queries are read-only and generate charts to display the results.
```

> This way, your AI agent system will have analysis capabilities similar to the CRM Demo, but it will be completely independent and customizable.

---

## 6. Best Practices and Design Recommendations

| Recommendation | Description |
| --- | --- |
| **Prioritize templated analysis** | Secure, stable, and reusable |
| **Use SQL Execution only as a supplement** | Limited to internal debugging or ad-hoc queries |
| **One chart, one key point** | Keep the output clear and avoid excessive clutter |
| **Clear template naming** | Name according to the page/business domain, e.g., `Leads-Stage-Conversion` |
| **Concise and clear explanations** | Accompany each chart with a 2–3 sentence summary |
| **Indicate when a template is missing** | Inform the user "No corresponding template found" instead of providing a blank output |

---

## 7. From the CRM Demo to Your Scenario

Whether you are working with a hospital CRM, manufacturing, warehouse logistics, or educational admissions, as long as you can answer the following three questions, Viz can bring value to your system:

| Question | Example |
| --- | --- |
| **1. What do you want to analyze?** | Lead trends / Deal stages / Equipment operating rate |
| **2. Where is the data?** | Which collection, which fields |
| **3. How do you want to present it?** | Line chart, funnel, pie chart, comparison table |

Once you have defined these, you just need to:

*   Write the analysis logic into the template collection;
*   Attach the task prompt to the page;
*   Viz can then "take over" your report analysis.

---

## 8. Conclusion: Take the Paradigm with You

"Overall Analytics" and "SQL Execution" are just two example implementations.
What's more important is the idea behind them:

> **Make the AI agent understand your business logic, not just execute prompts.**

Whether you are using NocoBase, a private system, or your own custom workflow, you can replicate this structure:

*   Centralized templates;
*   Workflow calls;
*   Read-only execution;
*   AI presentation.

This way, Viz is no longer just an "AI that can generate charts," but a true analyst who understands your data, your definitions, and your business.