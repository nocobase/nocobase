# Built-in AI Employees

NocoBase comes with several built-in AI employees tailored for specific scenarios.

You only need to configure the LLM service and enable the corresponding employee to start working; models can be switched on-demand within the conversation.

## Introduction

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Employee Name | Role Positioning | Core Capabilities |
| :--- | :--- | :--- |
| **Cole** | NocoBase Assistant | Product Q&A, document retrieval |
| **Ellis** | Email Expert | Email drafting, summary generation, reply suggestions |
| **Dex** | Data Organizer | Field translation, formatting, information extraction |
| **Viz** | Insight Analyst | Data insights, trend analysis, key metric interpretation |
| **Lexi** | Translation Assistant | Multilingual translation, communication assistance |
| **Vera** | Research Analyst | Web search, information aggregation, deep research |
| **Dara** | Data Visualization Expert | Chart configuration, visual report generation |
| **Orin** | Data Modeling Expert | Assist in designing collection structures, field suggestions |
| **Nathan** | Frontend Engineer | Assist in writing frontend code snippets, style adjustments |

You can click the **AI floating ball** in the bottom right corner of the application interface and select the employee you need to start collaborating.

## Dedicated Scenario AI Employees

Some built-in AI employees (builder types) do not appear in the bottom-right AI employee list; they have dedicated workspaces, for example:

* Orin only appears on the Data Source configuration page;
* Dara only appears on the chart configuration page;
* Nathan only appears in the JS editor.

---

Below are several typical application scenarios for AI employees to provide you with inspiration. More potential awaits your further exploration in actual business scenarios.

## Viz: Insight Analyst

### Introduction

> Generate charts and insights with one click, let the data speak for itself.

**Viz** is the built-in **AI Insight Analyst**.
He knows how to read the data on your current page (such as Leads, Opportunities, Accounts) and automatically generate trend charts, comparison charts, KPI cards, and concise conclusions, making business analysis easy and intuitive.

> Want to know "Why have sales dropped recently?"
> Just say a word to Viz, and he can tell you where the drop occurred, what the possible reasons are, and what the next steps could be.

### Use Scenarios

Whether it's monthly business reviews, channel ROI, or sales funnels, you can let Viz analyze, generate charts, and interpret results.

| Scenario | What you want to know | Viz's Output |
| -------- | ------------ | ------------------- |
| **Monthly Review** | How is this month better than last? | KPI Card + Trend Chart + Three improvement suggestions |
| **Growth Breakdown** | Is revenue growth driven by volume or price? | Factor decomposition chart + Comparison table |
| **Channel Analysis** | Which channel is most worth continued investment? | ROI Chart + Retention curve + Suggestions |
| **Funnel Analysis** | Where is the traffic getting stuck? | Funnel chart + Bottleneck explanation |
| **Customer Retention** | Which customers are most valuable? | RFM segmentation chart + Retention curve |
| **Promotion Evaluation** | How effective was the big promotion? | Comparison chart + Price elasticity analysis |

### Usage

**Page Entry Points**

* **Top-right button (Recommended)**
  
  On pages like Leads, Opportunities, and Accounts, click the **Viz icon** in the top right corner to select preset tasks, such as:

  * Stage conversion and trends
  * Source channel comparison
  * Monthly review analysis

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Bottom-right global panel**
  
  On any page, you can call up the global AI panel and speak directly to Viz:

  ```
  Analyze sales changes over the last 90 days
  ```

  Viz will automatically bring in the data context of your current page.

**Interaction**

Viz supports natural language questions and understands multi-turn follow-ups.
Example:

```
Hi Viz, generate lead trends for this month.
```

```
Only show performance from third-party channels.
```

```
Which region is growing the fastest?
```

Each follow-up question will continue to delve deeper based on the previous analysis results, without needing to re-enter data conditions.

### Tips for Chatting with Viz

| Method | Effect |
| ---------- | ------------------- |
| Specify time range | "Last 30 days" or "Last month vs. This month" is more accurate |
| Specify dimensions | "View by region/channel/product" helps align perspectives |
| Focus on trends rather than details | Viz is good at identifying the direction of change and key reasons |
| Use natural language | No need for imperative syntax, just ask questions like you're chatting |

---

## Dex: Data Organizer

### Introduction

> Quickly extract and fill forms, turning messy information into structured data.

`Dex` is a data organizer who extracts required information from unstructured data or files and organizes it into structured information. He can also call tools to fill the information into forms.

### Usage

Invoke `Dex` on the form page to open the conversation window.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Click **Add work context** in the input box and select **Pick block**; the page will enter the block selection state.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Select the form block on the page.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Enter the data you want `Dex` to organize in the dialog box.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

After sending, `Dex` will structure the data and use its skills to update the data in the selected form.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)

---

## Orin: Data Modeler

### Introduction

> Intelligently design collections and optimize database structures.

`Orin` is a data modeling expert. On the main data source configuration page, you can let `Orin` help you create or modify collections.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Usage

Enter the Data Source Manager plugin and select to configure the main data source.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Click the `Orin` avatar in the top right corner to open the AI employee dialog box.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Describe your modeling requirements to `Orin`, send, and wait for a reply. 

Once `Orin` confirms your requirements, he will use his skills and reply with a preview of the data modeling.

After reviewing the preview, click the **Finish review and apply** button to create collections according to `Orin`'s modeling.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)

---

## Nathan: Frontend Engineer

### Introduction

> Helps you write and optimize frontend code to implement complex interaction logic.

`Nathan` is the frontend development expert in NocoBase. In scenarios where JavaScript is required, such as `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow`, and `Linkage`, Nathan's avatar will appear in the top right corner of the code editor, allowing you to ask him to help write or modify the code in the editor.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Usage

In the code editor, click `Nathan` to open the AI employee dialog box; the code in the editor will be automatically attached to the input box and sent to `Nathan` as application context.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Enter your coding requirements, send them to `Nathan`, and wait for his reply.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Click the **Apply to editor** button on the code block replied by `Nathan` to overwrite the code in the editor with his code.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Click the **Run** button in the code editor to view the effects in real-time.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Code History

Click the **Command Line** icon in the top right corner of `Nathan`'s dialog box to view the code snippets you have sent and the code snippets `Nathan` has replied with in the current session.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)