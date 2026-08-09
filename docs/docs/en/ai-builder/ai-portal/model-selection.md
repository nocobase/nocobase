---
title: "LLM Selection"
description: "Explore test results and selection guidance for using leading flagship models to build NocoBase applications, based on a standardized evaluation system covering data modeling, pages, permissions, and workflows."
keywords: "NocoBase AI Builder,LLM selection,GPT,DeepSeek,Qwen,AI Agent,model evaluation"
---

# LLM Selection

:::tip Key takeaway

**Leading flagship models currently available on the market can all build the core of a NocoBase application.**

Models differ in the completeness of their initial output, build time, and number of issues. Choose one based on the model services already available to you, network conditions in your region, cost, and your team's preferences.

:::

This evaluation used a standardized CRM requirement set (a sales opportunity and customer follow-up system) to validate the applications built by different models:

| Evaluation dimensions | Standardized evaluation items |
| :---: | :---: |
| 14 | 61 |

## Evaluation dimensions

The evaluation covers NocoBase's core capabilities, configuration capabilities, and foundational components. It also checks whether each model can understand requirements and carry out the corresponding build tasks.

| Capability | Evaluation focus |
| --- | --- |
| Data modeling | Collections, field types, relationships, required and unique constraints, and default values |
| Pages and features | Navigation, lists, forms, details, search, filters, and dashboards |
| Business logic | Status transitions, business validation, calculation rules, and consistency of related data |
| Permissions and security | Roles, menu permissions, action permissions, data scopes, and field permissions |
| Workflow automation | Triggers, nodes, conditional branches, notifications, data side effects, and failure retries |
| User experience | Information architecture, form experience, action feedback, and responsive layouts |
| Robustness | Invalid input, duplicate submissions, consistency on failure, data volume, and network recovery |
| Requirements coverage | Whether explicit requirements and core business paths are fully implemented |
| Reasonable extensions | Whether features proactively added by the model serve a clear business purpose |
| Scope control | Whether the result contains duplicate, unused, or out-of-scope business modules |

## Evaluation results

| Evaluation dimension | GPT-5.6 Sol | DeepSeek-V4-Flash | Qwen3.8-Max | GPT-5.6 Luna |
| --- | :---: | :---: | :---: | :---: |
| Data modeling | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> |
| Feature completion | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#d97706;font-weight:600">◐ Partial pass</span> |
| Business logic | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> |
| Permissions and security | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> |
| Workflow automation | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> |
| User experience | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#d97706;font-weight:600">◐ Partial pass</span> |
| Robustness | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> |
| Requirements coverage | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#d97706;font-weight:600">◐ Partial pass</span> |
| Reasonable extensions | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> |
| Scope control | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> | <span style="color:#15803d;font-weight:600">✓ Pass</span> |
| **Build speed** | <span style="color:#2563eb;font-weight:700">Relatively fast</span> | <span style="color:#2563eb;font-weight:700">Relatively fast</span> | <span style="color:#d97706;font-weight:700">Slow</span> | <span style="color:#15803d;font-weight:700">Fastest</span> |
| **Single-run quality score** | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">91</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#c2410c;background:#fff7ed;font-weight:800">77</span> |

:::tip Single-run quality score

The single-run quality score has a maximum of 100 points. One point is deducted for each bug found during the first complete acceptance check, providing an indication of the quality of the model's initial build. The model can resolve these issues through subsequent feedback and revisions.

:::

:::info Note on build time

Build time is affected by factors such as computer hardware performance, dependency installation and Build compilation, model service response speed, and network conditions.

:::

## Evaluation item details

The 61 standardized evaluation items are organized into three layers: 46 items for build result quality, 7 for requirements understanding and reasonable extensions, and 8 for build process efficiency. Every item uses consistent inspection methods and pass criteria.

### Layer 1: Build result quality (46 items)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Evaluation dimension</th><th>Standardized evaluation items</th></tr></thead>
  <tbody>
    <tr><td>Data modeling (8 items)</td><td><code>DM-01</code> Whether all required collections are created<br /><code>DM-02</code> Whether all required fields exist<br /><code>DM-03</code> Whether field types are correct<br /><code>DM-04</code> Whether one-to-one relationships can be created and used<br /><code>DM-05</code> Whether one-to-many relationships can be created and used<br /><code>DM-06</code> Whether many-to-many relationships can be created and used<br /><code>DM-07</code> Whether required, unique, and default-value rules take effect<br /><code>DM-08</code> Whether related data can be viewed and filtered</td></tr>
    <tr><td>Feature completion (6 items)</td><td><code>FC-01</code> Whether all required pages and navigation entries are present<br /><code>FC-02</code> Whether records can be created, viewed, edited, and deleted<br /><code>FC-03</code> Whether core user journeys can be completed end to end<br /><code>FC-04</code> Whether key business actions are available<br /><code>FC-05</code> Whether search, filtering, and sorting are available<br /><code>FC-06</code> Whether dashboards contain the required content</td></tr>
    <tr><td>Business logic (6 items)</td><td><code>BL-01</code> Whether opportunity status transition rules are correct<br /><code>BL-02</code> Whether business validation rules take effect<br /><code>BL-03</code> Whether calculated fields and statistical definitions are correct<br /><code>BL-04</code> Whether data is mapped correctly after lead conversion<br /><code>BL-05</code> Whether updates to related records remain consistent<br /><code>BL-06</code> Whether deletion and archiving rules are correct</td></tr>
    <tr><td>Permissions and security (7 items)</td><td><code>ACL-01</code> Whether all required roles are created<br /><code>ACL-02</code> Whether test users and role assignments are correct<br /><code>ACL-03</code> Whether page and menu access permissions are correct<br /><code>ACL-04</code> Whether data operation permissions are correct<br /><code>ACL-05</code> Whether record-level data scopes are correct<br /><code>ACL-06</code> Whether field-level view and edit permissions are correct<br /><code>ACL-07</code> Whether role changes and combined roles behave correctly</td></tr>
    <tr><td>Workflow automation (7 items)</td><td><code>WF-01</code> Whether all required workflows are created and enabled<br /><code>WF-02</code> Whether workflow triggers are designed correctly<br /><code>WF-03</code> Whether node order and data transfer are correct<br /><code>WF-04</code> Whether conditions and branch results are correct<br /><code>WF-05</code> Whether record read/write side effects are correct<br /><code>WF-06</code> Whether notification recipients and content are correct<br /><code>WF-07</code> Whether failure logs and retry behavior are traceable</td></tr>
    <tr><td>User experience (7 items)</td><td><code>UX-01</code> Whether navigation and information architecture are clear<br /><code>UX-02</code> Whether list information and common actions are easy to use<br /><code>UX-03</code> Whether form grouping, order, and guidance are clear<br /><code>UX-04</code> Whether detail pages support understanding and follow-up actions<br /><code>UX-05</code> Whether action feedback and status changes are clear<br /><code>UX-06</code> Whether the application is usable at different screen widths<br /><code>UX-07</code> Whether empty, loading, and error states are complete</td></tr>
    <tr><td>Robustness (5 items)</td><td><code>ROB-01</code> Whether invalid and boundary inputs are handled safely<br /><code>ROB-02</code> Whether duplicate submissions cause duplicate side effects<br /><code>ROB-03</code> Whether data remains consistent when execution fails<br /><code>ROB-04</code> Whether the application remains usable with empty and large datasets<br /><code>ROB-05</code> Whether the application can recover after a session or network interruption</td></tr>
  </tbody>
</table>

### Layer 2: Requirements understanding and reasonable extensions (7 items)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Evaluation dimension</th><th>Standardized evaluation items</th></tr></thead>
  <tbody>
    <tr><td>Requirements coverage (3 items)</td><td><code>COV-01</code> Whether all pages and actions requested in the prompt are implemented<br /><code>COV-02</code> Whether all data, permissions, and workflows requested in the prompt are implemented<br /><code>COV-03</code> Whether capabilities required by the main process but not individually specified in the prompt are present</td></tr>
    <tr><td>Reasonable extensions (2 items)</td><td><code>EXT-01</code> Whether proactively added fields, relationships, and rules are necessary<br /><code>EXT-02</code> Whether proactively added pages, actions, and statistics serve a clear purpose</td></tr>
    <tr><td>Scope control (2 items)</td><td><code>SCOPE-01</code> Whether duplicate or unused features and configurations are generated<br /><code>SCOPE-02</code> Whether business modules unrelated to the task scope are added</td></tr>
  </tbody>
</table>

### Layer 3: Build process efficiency (8 items)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Evaluation dimension</th><th>Standardized evaluation items</th></tr></thead>
  <tbody>
    <tr><td>Time to first usable result (1 item)</td><td><code>EFF-FIRST-01</code> Time required to reach the first usable result</td></tr>
    <tr><td>Convergence efficiency (3 items)</td><td><code>EFF-FINAL-01</code> Number of iterations required to reach final acceptance<br /><code>EFF-FINAL-02</code> Total time required to reach the final state<br /><code>EFF-FINAL-03</code> Tokens consumed to reach the final state</td></tr>
    <tr><td>Human intervention (1 item)</td><td><code>EFF-HUMAN-01</code> Number of human interventions during the evaluation</td></tr>
    <tr><td>Repeatability (3 items)</td><td><code>EFF-STABLE-01</code> Whether repeated runs of the same task produce consistent acceptance results<br /><code>EFF-STABLE-02</code> Whether collections, relationships, roles, and workflows are consistent across three runs<br /><code>EFF-STABLE-03</code> Whether variation in iterations and time remains controlled</td></tr>
  </tbody>
</table>

## Next steps

- [Build collaboratively with an AI Agent](./agent-workflow.md) — Describe pages and interactions in natural language and iterate continuously with an AI Agent
- [AI Portal quick start](./index.md) — Create and run your first AI Portal
- [Data modeling](../data-modeling.md) — Create collections, fields, and relationships with natural language
- [Workflow management](../workflow.md) — Create, edit, enable, and diagnose workflows
- [Permission configuration](../acl.md) — Manage roles, permission policies, user assignments, and risk assessments
