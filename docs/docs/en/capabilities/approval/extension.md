---
title: 'Extension'
description: 'Organize integration and extension boundaries for approval policies, operations, UI, and execution.'
---

# Extension

:::warning Documentation in progress
This chapter establishes the structure and scope. Full walkthroughs and scenario examples will be added here.
:::

This page covers integration boundaries for developers and Agents. Start with [Develop with an Agent](./develop.md); use the installed approval Skill and package version for exact API contracts.

## Existing records and business lifecycles

One application record identifies the complete process. `defineApproval` defines its states and transitions; `approvalState` attaches human coordination to a business state. Each entry allocates fresh tasks and preserves previous evidence.

The host supplies lifecycle runtime and storage, business tables, organization services, authenticated routes, and UI. Plugin migrations supply approval storage. Close direct state and frozen-field writes through forms, imports, and routes. Keep proposed changes separate from effective business data.

## Custom aggregation policies

Use standard single, all, any, first, sequential, and threshold policies where possible. A custom `StagePolicy` declares planning, possible conclusions, and exits for itemized or partial review. Policies compute results; business transitions write data.

## Custom operations and assignment rules

Use `defineApprovalAction` for abstention, line returns, urging, or other business operations. Opt into each stage explicitly. Define inputs, permissions, recipients, presentation, history, forms, and tests. Recheck responsibility constraints after transfer, added signers, appointment, and reassignment.

## Frozen content, outputs, and opinion reuse

`freeze` selects reviewed fields; decisions carry the displayed content hash. Stage outputs declare reviewed amounts or dates and write them together with the concluding transition. Re-entry normally requires new decisions. `reuse: 'unchanged'` needs explicit business permission and matching content, rule version, and responsibility; new tasks retain source evidence.

## Pages and approval centers

| Contract                            | Purpose                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| `previewRoute`                      | Preview before submission                                |
| `runViewsFor` / `upcomingStagesFor` | Current and historical stays, upcoming stages            |
| `actionsFor` / `runActionsFor`      | Offered task and run operations                          |
| `candidatesFor`                     | Eligible operation recipients                            |
| `perform` / `performBatch`          | Processing and per-target batch results                  |
| `tasksOf`                           | Approval task queries; host authorization still required |

The UI Library's `approval-ui` provides progress, timelines, previews, action bars, branches, and receipts. The host maps read models and implements business forms and pages. A center may combine other work sources; each retains its permissions and operations.

## Notifications, time, and reliable execution

The host periodically calls `ApprovalService.sweep()` for task reminders, escalation, and claim expiry; `calendar` supplies optional working-hour calculation. Integrate with lifecycle jobs. Notifications and external calls run after commit. Partial opinions update tasks; conclusion, business transition, and next allocation share one transaction.

Resource changes and baseline checks belong in the business transaction. Payments, registration, and synchronization use reliable lifecycle effects with retry, failure exits, and stable business keys.

## Versions, upgrades, and tests

Apply migrations, manage rule versions explicitly, and preserve states and exits still in use. Test custom policies, authorized operations, rollback, reuse, duplicates, concurrency, and time. External execution tests cover success, refusal, temporary outage, and unknown outcomes.
