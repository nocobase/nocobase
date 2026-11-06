---
title: 'Task Center'
description: 'Copy Agent prompts to connect approvals, equipment collection and other personal work to one entry point, including handling, counts and historical tasks.'
keywords: 'task center, personal tasks, Agent, approvals, application building'
---

# Task Center

## 1. Introduction

### When work spans different businesses

A manager needs one view of leave and expense requests awaiting approval. An employee needs to submit missing documents and confirm equipment collection.

Use Task Center when personal work is scattered across different businesses.

### Find work quickly and keep track

Open one entry point to see what needs your attention and enter the relevant business to handle it.

Reduce switching and overlooked tasks. Updated states and counts show what is finished and what remains.

## 2. Try four steps in your project

Complete steps 1–4, then try optional scenarios. Send each prompt to the Agent in your application project and check the result.

### 1. Create an entry

Bring personal work into one place instead of checking each business page.

Example: A manager opens My tasks from the navigation.

```text
Managers handle leave requests, expenses and other applications every day. They want one place to see everything waiting for their attention without checking each business separately.
Add a My tasks page where each person sees only their own pending, completed and cancelled items, with a count for each.
```

Check the result:

- Signed-in users see their own work and empty states.
- Find work by business and status.

### 2. Connect approvals

Give managers one place to find applications waiting for their decision.

Example: One manager’s leave and expense approvals appear together.

```text
Include existing leave and expense requests in My tasks, showing their type and number to the person responsible for approval. Keep the approval rules unchanged.
After a transfer, only the new approver needs to handle the request. Withdrawn requests no longer need approval. Do not show the same work twice.
```

Check the result:

- Transfers cancel former recipients and create pending work for new ones.
- Only currently offered approval actions appear.

### 3. Handle work

Open a task, use the actions the business allows, and refresh after handling.

Example: Approving an expense moves it to completed and reduces the pending count.

```text
I want to open a task, read the application and approve it, or confirm receipt when collecting equipment.
After handling, move the item to completed and update the remaining count. Only people allowed to handle it may act. Explain withdrawn items and stop further handling.
```

Check the result:

- Only people allowed to handle the work can view details and act.
- Handling refreshes lists and all related counts.

### 4. Verify results

Ask the Agent to verify real business work, then try it yourself.

Example: Alex handles Alex’s work; Jordan cannot read or handle Alex’s personal entries.

```text
Try the flow with two test accounts, Alex and Jordan: receive work, open details, handle it and check the remaining count.
Confirm neither can see or handle the other’s personal work, repeated clicks do not create duplicate work, and failed handling is not shown as complete. Tell me what was verified and give me a path to try myself.
```

Check the result:

- Isolation between two accounts is verified.
- Executed and unexecuted scenarios are reported separately.

### Equipment collection

Collection, missing documents and delivery confirmation can be tasks without approval stages.

Example: Issuing EQ-001 to Alex creates work; confirming receipt completes it.

```text
When equipment is ready for collection, show the collection record in the assigned employee’s My tasks. Let them open it, review the equipment and confirm receipt.
Successful collection completes the item; an administrator withdrawing the issue cancels it. Do not show the same record twice, and keep it pending if collection fails.
```

Check the result:

- The same work does not appear twice.
- Successful collection completes the item; failed collection leaves it pending.

### Dashboard badge

Show the pending count without opening the full list.

Example: Two expense tasks and one equipment task give an all-source badge of 3.

```text
Show how many things I still need to handle on the home page. Clicking the number should open the matching task list.
Update the count and list after each item is handled. Show “No pending work” when there is none. After switching accounts, show only the new account’s work.
```

Check the result:

- The dashboard count matches the task list it opens.
- Business filters show matching work; switching accounts shows only that account’s work.

### Reassignment

Cancel the former recipient’s unfinished entry and create work for the new recipient.

Example: Equipment work moves from Alex to Jordan; only Jordan can confirm receipt.

```text
An administrator needs to reassign equipment that Alex has not collected to Jordan. Alex should no longer need or be able to confirm receipt; Jordan should see and handle the collection record.
Keep completed collection history unchanged and avoid duplicate tasks if the reassignment is repeated.
```

Check the result:

- Former recipients cannot handle reassigned work.
- Completed history is retained; unfinished work is cancelled as specified.

### Historical work

Show old and new work together in an application already in use.

Example: A paused backfill resumes without restoring pending status over online completion.

```text
There are already unfinished approvals and equipment collections in this application. Let the responsible people find these in the new My tasks page while retaining the original business records.
Do not miss new work, ask people to handle completed work again or show duplicate items. If preparation is interrupted, continue next time without starting over.
```

Check the result:

- Interrupted batches resume without duplicate entries.
- Completed work never becomes pending again.

### Reminders

A notification signals work to do; completion still happens in the business.

Example: Reading a collection reminder does not complete the task.

```text
When equipment is ready, remind the assigned employee inside the application and let them open the collection record from the reminder.
Remind them only once per issue. Reading the reminder does not mean equipment has been collected; complete the task only after the employee confirms receipt successfully. A missing reminder must not prevent collection.
```

Check the result:

- One reminder per business event and recipient.
- Reading does not complete tasks; delivery failure does not undo business writes.

## Related capabilities

[Approval](./approval/index.md) · [Notifications](./notification/usage.md)
