---
title: '4. Add an approval flow'
description: 'Persist human decisions in the application and process results with a workflow.'
---

# 4. Add an approval flow

An order must not become approved because a salesperson sends `status=approved`. Implement submission and supervisor decisions first, then trigger the result workflow.

## Goal and starting point

First finish the access checks with salesperson and supervisor accounts. This chapter moves an order from Draft to Pending approval, then records a supervisor's decision. Check both the order state and its corresponding workflow run.

## Order state and workflow execution state

Order state describes the business decision; workflow state describes background processing. An order can already be approved while follow-up processing is still running. Do not combine both into one ambiguous success message.

The order's `version` identifies each state change. Retry the same decision with the same event identity; a new transition produces a new version. This also supports notification deduplication in the next chapter.

## Define state transitions

| Current state     | Actor       | Action                | New state                         |
| ----------------- | ----------- | --------------------- | --------------------------------- |
| Draft or Rejected | Order owner | Submit                | Pending approval                  |
| Pending approval  | Supervisor  | Approve               | Approved                          |
| Pending approval  | Supervisor  | Reject with a comment | Rejected                          |
| Approved          | Anyone      | Approve again         | Rejected request; no state change |

Increment `version` on each transition and match the previous version when updating, so concurrent decisions cannot both succeed. This example retains the current state and latest comment, not a complete approval audit trail, reassignment, or countersigning.

:::info Where the human wait lives
The current workflow provides Condition, Run, and Terminate instructions. This tutorial persists the wait in the order's `submitted` state and triggers a workflow after the supervisor decides. Do not keep a Run instruction alive while waiting for a person, or assume a built-in human approval node exists.
:::

## Ask your AI Agent to implement the flow

```text
Read the Workflow and Authorization Skills and the tutorial order APIs.

Implement submit, approve, and reject using the state table. Validate identity, permissions, ownership, current status, and revision on the server. Require a rejection comment. A salesperson cannot write approved directly. Show only actions allowed for the current user.

Create workflows/tutorial-order-result/workflow.ts with the installed RunInstruction. Input is orderId and version. Initially have the Run script read and validate the persisted decision; add notifications in the next chapter.

Persist the decision first, then resolve workflowServiceToken and call trigger('tutorial-order-result', { orderId, version }, { eventKey }). Use tutorial-order:<orderID>:decision:<version> as the stable eventKey. Handle accepted, skipped, and thrown errors explicitly. Distinguish “decision saved” from “workflow accepted” in the UI.

Add a supervisor-only Dispatch result action for an event that was not accepted or whose acceptance is uncertain. Reuse the same key without changing status or revision. Do not claim that resending the same key replays an already failed workflow.
```

Check the definition and application code:

```bash
pnpm nocobase workflow check workflows/tutorial-order-result
pnpm typecheck
pnpm test
```

A passing definition check does not prove the business script runs correctly.

## Enable and approve

As an administrator, open workflow settings, find Order decision, and enable the current definition. Development discovers workflow source; production needs its built artifacts deployed with the application.

Submit a draft as its owner, then sign in as the supervisor and open the same order. Check Pending approval and choose Approve. Refresh to confirm the decision persisted.

![Supervisor viewing a pending order with approve and reject actions; Chinese interface](https://static-docs.nocobase.com/nb3-docs-20260916-tutorial-approval.png)

Inspect workflow runs for the order ID, revision, and execution result. `accepted` means the event was accepted, not that execution succeeded. Check asynchronous results and node errors separately.

## Check three more paths

- A salesperson's direct approval request is denied.
- Reject another order with a required comment. The applicant sees the result and can submit again.
- Approve twice: only one state transition succeeds.

If the decision is saved while the workflow is disabled, enable it and dispatch the same event. If a run has already failed, inspect the error and completed effects before choosing recovery. Do not keep generating random event keys.

Next: [Send notifications](./notifications).
