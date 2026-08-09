---
title: "Define a Skill"
description: "Explains the frontmatter, prompt content, Tool binding, and automatic directory discovery for NocoBase AI employee SKILLS.md files."
keywords: "NocoBase,AI employee Skill,SKILLS.md,Skill Tool binding,business-analysis-report"
---

# Define a Skill

A Skill does not execute code. It is an operating guide provided to the model that specifies the workflow, available Tools, validation steps, and output requirements.

## Skill directory

Each Skill uses its own directory:

```text
src/ai/skills/business-analysis-report/
├── SKILLS.md
└── tools/
    └── businessReportGenerator.ts
```

Where:

- `SKILLS.md` defines metadata and prompt content
- `tools/` contains Tools used only with this Skill
- Tools discovered in `tools/` are automatically added to this Skill's Tool list

## `SKILLS.md` frontmatter

A minimal Skill looks like this:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and explain the next step for starting NocoBase plugin development.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You help welcome developers who are starting NocoBase plugin development.

When the user asks you to greet or welcome a developer:

1. Extract the developer name from the request.
2. Call `greetDeveloper` exactly once.
3. Return the greeting from the tool result.
4. Ask which plugin capability the developer wants to build next.

Do not claim that the greeting was generated until the tool returns `status: "success"`.
```

Common frontmatter fields include:

| Field | Purpose |
| --- | --- |
| `scope` | Availability scope of the Skill; defaults to `SPECIFIED` when omitted |
| `name` | Unique name of the Skill |
| `description` | Helps the model decide when to load this Skill |
| `introduction.title` | Title displayed in the management interface |
| `introduction.about` | Description displayed in the management interface |
| `tools` | List of additional Tool names to bind |

The Skill content is stored unchanged and added to the model context after the Skill is loaded. Focus the content on workflow and constraints; do not copy Tool implementation details into it.

## Bind Tools to a Skill

There are two methods.

The first is to declare them explicitly in the frontmatter:

```yaml
tools:
  - getSkill
  - businessReportGenerator
```

The second is to put the Tool in the current Skill's `tools/` directory:

```text
src/ai/skills/welcome-developer/
├── SKILLS.md
└── tools/
    └── greetDeveloper.ts
```

The loader automatically discovers `greetDeveloper` and merges it into the Skill's Tool list. By default, put a Tool that belongs exclusively to one Skill under that Skill's directory. The file location then expresses the binding relationship.

## How to write an effective Skill

A practical Skill usually includes:

1. Role and task boundaries
2. Required processing order
3. Which Tool to call at each step
4. When to ask the user for confirmation
5. How to handle Tool failures
6. Final output structure and validation conditions

If a Tool modifies data, the Skill must explicitly require the model to wait for a successful Tool result. It must not claim that the operation is complete before the call returns.

## Built-in Skill example: `business-analysis-report`

`packages/plugins/@nocobase/plugin-ai/src/ai/skills/business-analysis-report/SKILLS.md` breaks business analysis into a clear workflow:

```yaml
---
scope: GENERAL
name: business-analysis-report
description: Analyze business data with the data-query workflow and generate stakeholder-facing reports with markdown and ECharts.
introduction:
  title: '{{t("ai.skills.businessAnalysisReport.title", { ns: "@nocobase/plugin-ai" })}}'
  about: '{{t("ai.skills.businessAnalysisReport.about", { ns: "@nocobase/plugin-ai" })}}'
tools:
  - getSkill
  - businessReportGenerator
---
```

Instead of merely saying “generate a business report,” the content goes on to require the following:

- Understand the decision objective, audience, time range, and metrics first
- When business data is involved, the first ToolCall must load the `data-query` Skill
- Never guess tables, relationship paths, or query results
- Call `businessReportGenerator` only after the data is ready
- Generate charts and the Markdown report in the same ToolCall
- Determine success from the returned `status`, `chartCount`, `errors`, and `warnings`
- Retry a chart failure only once, then fall back to a Markdown-only report

These rules are the main value of a Skill—they narrow “what the model can do” into a repeatable, verifiable process.

## Related links

- [AI employee plugin development](./index.md) — Understand where Skills fit into AI employee extensions
- [Define a server-side Tool](./define-tool.md) — Define a Tool that a Skill can call
- [Define a built-in AI employee](./define-ai-employee.md) — Bind a Skill to a fixed employee
- [Complete example: Create a built-in AI employee](./complete-example.md) — See a complete Skill and Tool binding example
