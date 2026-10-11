---
title: 'Approval overview'
---

# Approval overview

**Approval organizes the review and decisions for business requests, defining who reviews them, in which order and what constitutes approval.** It coordinates multiple opinions, supports added reviewers, transfers and returns, and records decisions and changes in responsibility.

## Available capabilities

| Capability                                             | What it provides                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [Multiple stages and conditional routing](./stages.md) | Sequential reviewers and routes based on amount or request type.                                 |
| [Joint review and decision rules](./joint-review.md)   | All, any, first-answer or vote-threshold decisions among multiple participants.                  |
| [Added reviewers and transfers](./handover.md)         | Add a reviewer or hand a current task to an eligible person.                                     |
| [Request handling and progress](./requests.md)         | Return for correction, withdrawal, resubmission, copy and acknowledgement, progress and history. |

Northstar special transport requests illustrate these capabilities: applicants submit extra fees, operations and finance review according to policy, and other people participate when needed.

## Design the pages

Approval pages can be freely designed for business needs. Embed them in orders or expense details, or provide My requests, Pending review, Reviewed and Copied to me lists. Preview the expected route before submission and show current reviewers and progress afterwards.

## Integrate approval

Approval uses the Pro plugin `@nocobase/app-plugin-approval`, requiring authorization and a compatible version. Describe your approval business requirements to the Agent to build request pages, tasks and details. Keep credentials in server configuration.

Use [Workflows](../workflow/index.md) for simple single-person confirmation, and approval capabilities for multi-stage circulation, coordinated decisions and task management.

:::tip Important notes

Approval is a decision; payment, resource reservation and updates to official records are subsequent execution. Display execution results and define retries or human follow-up for failures, so Approved does not imply execution succeeded.

:::

## Explore approvals in the example

With `@nocobase/app-plugin-approval` and `@nocobase/app-plugin-approval-example` installed, open **Approvals**. The **To-do center** groups pending, handled, started, and copied requests for the current demo identity. Business pages cover leave, purchasing, contracts, expenses, and payments. The **Approval lab** exposes scenarios, tasks, records, and simulated services.

![Approval center in English](https://static-docs.nocobase.com/images/capabilities/approval/inbox-8c49a6543c924c96.png)

The identity selector lets you act as example applicants, managers, and finance staff, with the selection shared across business pages. It does not switch signed-in accounts: the example lets signed-in users act as these personas and read example records. Production applications must identify the actor from the signed-in user and authorize records, tasks, attachments, and administrative operations separately.

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
