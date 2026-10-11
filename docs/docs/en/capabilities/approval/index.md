---
title: 'Overview'
description: 'Approval use cases, group decision rules, user interfaces, and their relationship to business processes.'
---

# Overview

Expense claims, leave, purchasing, company seal requests, and contracts all need clear answers to who reviews, in what order, and what counts as approval. Simple submission, approval, and rejection can use [Workflow](../workflow/index.md) directly. The approval plugin coordinates multiple participants within a stage and preserves each person's opinion and responsibility history.

Approval belongs to the business record's complete process: drafts, review, corrections, execution after approval, and completion share one lifecycle. A partial opinion does not advance the business record. The record moves to the next stage only when the current stage's decision rule is satisfied.

## Explore approvals in the example

With `@nocobase/app-plugin-approval` and `@nocobase/app-plugin-approval-example` installed, open **Approvals**. The **To-do center** groups pending, handled, started, and copied requests for the current demo identity. Business pages cover leave, purchasing, contracts, expenses, and payments. The **Approval lab** exposes scenarios, tasks, records, and simulated services.

![Approval center in English](https://static-docs.nocobase.com/images/capabilities/approval/inbox-8c49a6543c924c96.png)

The identity selector lets you act as example applicants, managers, and finance staff, with the selection shared across business pages. It does not switch signed-in accounts: the example lets signed-in users act as these personas and read example records. Production applications must identify the actor from the signed-in user and authorize records, tasks, attachments, and administrative operations separately.

## What the approval plugin provides

| Capability                              | Business rules to define                                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Multiple levels and conditional routing | Managers and finance review in order; amounts or types determine additional stages                                   |
| Group decisions                         | Everyone approves, any approval, first response, sequential review, or a minimum number of votes                     |
| People and responsibilities             | Resolve managers, roles, departments, or teams; claim tasks; refuse entry or await appointment when nobody qualifies |
| Operations                              | Approve, reject, return, transfer, add reviewers before, after, or alongside, and request materials                  |
| Copies and read receipts                | Copy recipients view progress and mark it read; they do not vote                                                     |
| Time limits                             | Reminders, escalation, and claim expiry, optionally measured against a working calendar                              |
| Approval evidence                       | Preserve submitted content, opinions, and responsibility changes; explicitly define whether opinions survive returns |

For proportional voting, specify membership, the ratio, and rounding before converting the requirement to a vote count. Itemized decisions, partial approval, abstention, and vetoes are covered in [Scenarios](./scenarios.md) and [Extensions](./extension.md).

## What users see

- Before submission: the business form and expected approval route; actual participants are resolved on stage entry.
- Applicants: their requests, current progress, and permitted withdrawal, editing, and resubmission.
- Reviewers: pending and handled tasks, submitted content, available operations, and reasons they cannot act.
- Copy recipients: requests copied to them, approval history, and read confirmation.
- Details: progress, aggregated opinions, action history, and execution results after approval.
- Administrators: a management center developed for the business, with appointment, reassignment, and execution recovery. Redispatch and process reset require explicit business rules and leave a history.

The plugin supplies tasks, rules, and data for the interface. The Agent integrates business pages, APIs, and visibility rules for the application. Approvals can appear in an existing record's details or in a shared approval center. Installing the plugin does not generate these pages automatically.

## After approval

Approval and successful execution are recorded separately. For example, a payment may be approved while the bank call fails. Show the execution failure and let an authorized person retry; unchanged payment content does not require another human approval. Notifications and external calls use the process's execution facilities after transaction commit.

Contract and price changes also distinguish the change request from the currently effective data. Before applying an approval to the official record, check whether someone else has changed it to avoid overwriting a newer version.

## Changing approval rules

Rules are defined in application code rather than edited through a drag-and-drop interface. Ask the Agent to change and test them locally, then redeploy. Decide what happens to requests already under review, retaining stages and exits those requests still need.

## Chapter guide

| Page                                  | Purpose                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [Quick start](./quick-start.md)       | Complete submission, manager approval, and return for correction with a fixed purchasing case          |
| [Develop with an Agent](./develop.md) | Choose participants, rules, recovery, permissions, execution, and rollout requirements by design topic |
| [Scenarios](./scenarios.md)           | Adapt business prompts for leave, purchasing, contracts, expenses, and payments                        |
| [Extensions](./extension.md)          | Integrate existing applications and extend rules, operations, interfaces, and reliable execution       |

## Example scope

The example uses real business tables, approval tasks, action history, and background jobs. Its directory, messages, attendance registration, payments, and external events are simulated services. Real bank payments, third-party message cards, callback authentication, and organization synchronization require service integrations. Lab outage controls illustrate failure and recovery; they do not prove recovery from lost network responses or every concurrency failure.

Rules and pages are defined in code. The example is not a generic visual approval designer. Its fixed five-person proportional vote, itemized claims, and limited grants are specific business implementations, not automatic support for arbitrary ratios or matters.
