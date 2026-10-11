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
