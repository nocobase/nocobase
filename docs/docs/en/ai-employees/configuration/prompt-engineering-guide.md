# AI Agent · Prompt Engineering Guide

> From "how to write" to "writing well," this guide teaches you how to write high-quality prompts in a simple, stable, and reusable way.

## 1. Why Prompts are Crucial

A prompt is the "job description" for an AI agent, directly determining its style, boundaries, and output quality.

**Comparison Example:**

❌ Unclear Prompt:

```
You are a data analysis assistant that helps users analyze data.
```

✅ Clear and Controllable Prompt:

```
You are Viz, a data analysis expert.

Role Definition
- Style: Insightful, articulate, and visualization-focused
- Mission: To turn complex data into understandable "chart stories"

Workflow
1) Understand requirements
2) Generate safe SQL (using only SELECT)
3) Extract insights
4) Present with charts

Hard Rules
- MUST: Only use SELECT, never modify data
- ALWAYS: Output chart visualizations by default
- NEVER: Fabricate or guess data

Output Format
Brief conclusion (2-3 sentences) + ECharts chart JSON
```

**Conclusion**: A good prompt clearly defines "who it is, what to do, how to do it, and to what standard," making the AI's performance stable and controllable.


## 2. The "Nine Elements" Golden Formula for Prompts

A structure proven effective in practice:

```
Naming + Dual Instructions + Simulated Confirmation + Repetition + Hard Rules
+ Background Information + Positive Reinforcement + Reference Examples + Negative Examples (Optional)
```

### 2.1 Element Descriptions

| Element   | What it Solves            | Why it's Effective        |
| ---- | ----------------- | ------------ |
| Naming   | Clarifies identity and style           | Helps the AI establish a "sense of role" |
| Dual Instructions | Distinguishes "who I am" from "what I need to do"     | Reduces role confusion       |
| Simulated Confirmation | Restates understanding before execution            | Prevents deviation          |
| Repetition | Key points appear repeatedly           | Increases priority        |
| Hard Rules | MUST/ALWAYS/NEVER | Establishes a baseline         |
| Background Information | Necessary knowledge and constraints           | Reduces misunderstanding         |
| Positive Reinforcement | Guides expectations and style           | More stable tone and performance    |
| Reference Examples | Provides a direct model to imitate           | Output is closer to expectations      |
| Negative Examples | Avoids common pitfalls             | Corrects mistakes, becoming more accurate with use    |

### 2.2 Quick Start Template

```yaml
# 1) Naming
You are [Name], an excellent [Role/Specialist].

# 2) Dual Instructions
## Role
Style: [Adjective x2-3]
Mission: [One-sentence summary of main responsibility]

## Task Workflow
1) Understand: [Key point]
2) Execute: [Key point]
3) Verify: [Key point]
4) Present: [Key point]

# 3) Simulated Confirmation
Before execution, restate your understanding: "I understand you need... I will accomplish this by..."

# 4) Repetition
Core Requirement: [1-2 most critical points] (appear at least twice in the beginning/workflow/end)

# 5) Hard Rules
MUST: [Unbreakable rule]
ALWAYS: [Principle to always follow]
NEVER: [Explicitly forbidden action]

# 6) Background Information
[Necessary domain knowledge/context/common pitfalls]

# 7) Positive Reinforcement
You excel at [Ability] and are skilled in [Specialty]. Please maintain this style to complete the task.

# 8) Reference Examples
[Provide a concise example of the "ideal output"]

# 9) Negative Examples (Optional)
- [Incorrect way] → [Correct way]
```


## 3. Practical Example: Viz (Data Analysis)

Let's combine the nine elements to create a complete, "ready-to-use" example.

```text
# Naming
You are Viz, a data analysis expert.

# Dual Instructions
【Role】
Style: Insightful, clear, and visually-oriented
Mission: To turn complex data into "chart stories"

【Task Workflow】
1) Understand: Analyze user's data requirements and metric scope
2) Query: Generate safe SQL (query only real data, SELECT-only)
3) Analyze: Extract key insights (trends/comparisons/proportions)
4) Present: Choose an appropriate chart for clear expression

# Simulated Confirmation
Before execution, restate: "I understand you want to analyze [object/scope], and I will present the results via [query and visualization method]."

# Repetition
Reiterate: Data authenticity is the priority, quality over quantity; if no data is available, state it truthfully.

# Hard Rules
MUST: Only use SELECT queries, do not modify any data
ALWAYS: Output a visual chart by default
NEVER: Fabricate or guess data

# Background Information
- ECharts requires "pure JSON" configuration, without comments/functions
- Each chart should focus on one theme, avoid piling up multiple metrics

# Positive Reinforcement
You are skilled at extracting actionable conclusions from real data and expressing them with the simplest charts.

# Reference Examples
Description (2-3 sentences) + Chart JSON

Example Description:
This month, 127 new leads were added, a 23% month-over-month increase, primarily from third-party channels.

Example Chart:
{
  "title": {"text": "This Month's Lead Trend"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Week1","Week2","Week3","Week4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Negative Examples (Optional)
- Mixing languages → Maintain language consistency
- Overloaded charts → Each chart should express only one theme
- Incomplete data → Truthfully state "No data available"
```

**Design Points**

* "Authenticity" appears multiple times in the workflow, repetition, and rules sections (strong reminder)
* Choose a two-part "description + JSON" output for easy frontend integration
* Specify "read-only SQL" to reduce risk


## 4. How to Improve Prompts Over Time

### 4.1 Five-Step Iteration

```
Start with a working version → Test on a small scale → Log issues → Add rules/examples to address issues → Test again
```

<img src="https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-20-21.jpg" alt="Optimization Process" width="50%">

It is recommended to test 5–10 typical tasks at once, completing one round within 30 minutes.

### 4.2 Principles and Ratios

* **Prioritize Positive Guidance**: First, tell the AI what it should do
* **Problem-Driven Improvement**: Add constraints only when issues arise
* **Moderate Constraints**: Don't pile on "prohibitions" from the start

Empirical Ratio: **80% Positive : 20% Negative**.

### 4.3 A Typical Optimization

**Problem**: Overloaded charts, poor readability
**Optimization**:

1. In "Background Information," add: one theme per chart
2. In "Reference Examples," provide a "single-metric chart"
3. If the problem persists, add a hard constraint in "Hard Rules/Repetition"


## 5. Advanced Techniques

### 5.1 Use XML/Tags for Clearer Structure (Recommended for Long Prompts)

When the content exceeds 1000 characters or can be confusing, using tags for partitioning is more stable:

```xml
<Role>You are Dex, a data organization expert.</Role>
<Style>Meticulous, accurate, and organized.</Style>

<Task>
Must be completed in the following steps:
1. Identify key fields
2. Extract field values
3. Standardize format (Date YYYY-MM-DD)
4. Output JSON
</Task>

<Rules>
MUST: Maintain accuracy of field values
NEVER: Guess missing information
ALWAYS: Flag uncertain items
</Rules>

<Example>
{"Name":"John Doe","Date":"2024-01-15","Amount":5000,"Status":"Confirmed"}
</Example>
```

### 5.2 Layered "Background + Task" Approach (A More Intuitive Way)

* **Background** (long-term stability): Who this agent is, its style, and what capabilities it has
* **Task** (on-demand): What to do now, which metrics to focus on, and what the default scope is

This naturally matches NocoBase's "Agent + Task" model: a fixed background with flexible tasks.

### 5.3 Modular Reuse

Break down common rules into modules to mix and match as needed:

**Data Security Module**

```
MUST: Only use SELECT
NEVER: Execute INSERT/UPDATE/DELETE
```

**Output Structure Module**

```
Output must include:
1) Brief description (2-3 sentences)
2) Core content (chart/data/code)
3) Optional suggestions (if any)
```


## 6. Golden Rules (Practical Conclusions)

1. One AI for one type of job; specialization is more stable
2. Examples are more effective than slogans; provide positive models first
3. Use MUST/ALWAYS/NEVER to set boundaries
4. Use a process-oriented approach to reduce uncertainty
5. Start small, test more, modify less, and iterate continuously
6. Don't over-constrain; avoid "hard-coding" behavior
7. Log issues and changes to create versions
8. 80/20: First, explain "how to do it right," then constrain "what not to do wrong"


## 7. FAQ

**Q1: What's the ideal length?**

* Basic agent: 500–800 characters
* Complex agent: 800–1500 characters
* Not recommended >2000 characters (can be slow and redundant)
  Standard: Cover all nine elements, but with no fluff.

**Q2: What if the AI doesn't follow instructions?**

1. Use MUST/ALWAYS/NEVER to clarify boundaries
2. Repeat key requirements 2–3 times
3. Use tags/partitions to enhance structure
4. Provide more positive examples, less abstract principles
5. Evaluate if a more powerful model is needed

**Q3: How to balance positive and negative guidance?**
First, write the positive parts (role, workflow, examples), then add constraints based on errors, and only constrain points that are "repeatedly wrong."

**Q4: Should it be updated frequently?**

* Background (identity/style/core capabilities): Long-term stability
* Task (scenario/metrics/scope): Adjust according to business needs
* Create a new version for any changes and log "why it was changed."


## 8. Next Steps

**Hands-on Practice**

* Choose a simple role (e.g., customer service assistant), write a "workable version" using the nine elements, and test it with 5 typical tasks
* Find an existing agent, collect 3–5 real issues, and perform a small iteration

**Further Reading**

* [AI Agent · Administrator Configuration Guide](./admin-configuration.md): Put prompts into actual configuration
* Dedicated manuals for each AI agent: View complete role/task templates


## Conclusion

**Get it working, then refine it.**
Start with a "working" version, and continuously collect issues, add examples, and refine rules in real tasks.
Remember: **First, tell it how to do things right (positive guidance), then constrain it from doing things wrong (moderate restriction).**

---
