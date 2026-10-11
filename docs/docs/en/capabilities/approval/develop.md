---
title: 'Develop with an Agent'
description: 'Design approvals by business requirements, decision rules, recovery, page permissions, execution, and rollout.'
---

# Develop with an Agent

Use this page to design and develop your own approval business. For a first integration, complete the minimum cycle in [Quick start](./quick-start.md), then choose the topics your business needs. Each topic explains decisions to make, page behavior, and prompts you can adapt. These examples express different choices; you do not need to combine them all into one process.

## Start the conversation

Describe the requests you want to manage, who handles them, the pages you need, and the employee, department, or business information already available. The Agent handles the technical checks for integration and operation. Business users do not need to identify missing packages or configuration first.

### Example prompt

```text
I want purchase approval in this application. Employees enter purchase details and an amount, then managers and finance review. See whether we can use the existing purchasing pages and employee and department information. Help me identify the business information and pages we need to add, without changing existing data yet.
```

## Business design

| Explain                     | Examples or decisions                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| Requests and effective data | New purchase request or changes to an existing contract; fields frozen after submission          |
| Initiation and visibility   | Who creates, submits for others, or submits; what applicants, reviewers, and copy recipients see |
| Complete process            | Draft, review stages, correction, execution, execution failure, and completion                   |
| Conditional routes          | Amount threshold for director review; explicit exemptions                                        |
| Endings and recovery        | Meaning of rejection, return, withdrawal, and termination; where resubmission resumes            |
| Resources and follow-up     | Budget reservation at submission; payment, registration, or official data changes after approval |

Ask the Agent for a process diagram, stage table, and follow-up table. Follow-up work should cover submission, every exit, and execution failures, including notifications, resource reservation and release, and external calls.

### Example prompt

```text
Purchase requests go to the direct manager, then require approval from two finance reviewers. Amounts above 100000 also need the VP. Managers and finance may reject. Finance may return to the manager for review or to the applicant for correction. Applicants can edit drafts and returned requests, but not content or amount under review. Withdrawal ends the request.

Show me a diagram explaining who handles each stage, what counts as approval, the available operations, and what happens after approval, rejection, return, or withdrawal. Leave payment out for now. List unclear rules for me to confirm.
```

## Participants and decision rules

### How groups decide

Specify whether one rejection ends an all-approval stage immediately, how any-approval differs from first-response decisions, and whether voting waits for everyone. Also distinguish stage order from participant order within one stage. See the rule comparison in [Scenarios](./scenarios.md#how-groups-decide).

#### Partial opinions in the example

The contract below has finished manager review and received one of two finance approvals, but still shows **Finance review**. VP review has not begun. This illustrates the requirement that partial opinions update tasks in the current round, with business progress advancing only after the decision rule is satisfied. The screenshot is from the contract example; purchase requests can use the same presentation.

![One finance approval leaves the request in finance review](https://static-docs.nocobase.com/images/capabilities/approval/contract-review-b7f46ef1a3bf8b0e.png)

#### Example prompt

```text
Both finance reviewers must approve; one rejection ends the request. After the first approval, keep waiting for the second reviewer rather than passing it to the VP early. Preserve each person's opinion, reason, and action time.

Show how many people have responded, approved, or rejected, and who reviews next. Check one approval, two approvals, and one rejection. Exactly 100000 needs no VP review; 100001 does.
```

For committee voting, you could instead require four approvals from a fixed five-person group. Specify abstention, veto seats, and whether to wait for all responses. “Two thirds approve” is incomplete without a membership basis.

### Choose reviewers

Explain whether participants come from the direct manager, manager hierarchy, roles, departments, or team candidate pools, and whether team tasks must be claimed. Define applicant exclusion, inactive people, delegation, and duplicate responsibility. When nobody qualifies, refuse entry or wait for administrator appointment. An exemption must be an explicit conditional route.

#### Team candidates in the example

Team handling differs from requiring every person to approve. The finance seat below has three candidates; the current user must choose **Take it** before acting. Decide whether one team member represents the responsibility or every member gives an opinion before defining task and claim rules.

![Finance team candidates and claim entry](https://static-docs.nocobase.com/images/capabilities/approval/pool-df5ee81820d8ce33.png)

#### Example prompt

```text
Use the employee's current direct manager, and let only qualified finance staff handle finance review. Applicants cannot approve themselves and departed employees cannot act. Prevent submission and explain why when there is no suitable manager. If finance has nobody available, let an authorized administrator arrange someone.

I also want to understand another option: give finance work to a team, with one member claiming and handling it for the team. Others cannot review once it is claimed, but can take over after release. Explain how this differs from requiring both finance reviewers to approve, and let me choose before building it.
```

## Operations and recovery

Confirm permitted operations for each stage: approve, reject, return, transfer, add reviewers, request materials, comment, and copy. Restrict transfer and added-reviewer candidates. Specify before, after, or alongside modes and allowed depth.

Returns need a target and reason; resubmission is an explicit business operation. Fresh review is the default. If old opinions can be reused, specify what must remain unchanged. Materials can be requested while waiting in the current stage without returning the whole request.

:::tip Return versus rejection
A return immediately ends the current approval stage and moves to its specified target. Rejection is an opposing opinion; the stage's decision rule determines whether it ends review. Before letting any voter return a request, confirm that this matches their business authority.
:::

### Example prompt

```text
Managers and finance can approve or reject, with a reason required for rejection. Finance can return to the manager for another review or to the applicant for correction, also with a reason. Resubmission requires fresh review by the relevant people. Keep earlier records and prevent action on old to-dos.

Finance can transfer work to another qualified finance reviewer or add one reviewer. The added person may review first, or after the original reviewer approves; allow only one level of added reviewers. When more materials are needed, pause the review until the applicant supplies them. Explain who may do this, what the page asks them to enter, and how progress changes before building it.
```

In the group-review screenshot, **Approve**, **Reject**, and **Return** are operations offered to the current finance reviewer. Application pages should likewise use operations supplied by the server rather than display every button simply because the record is in finance review.

## Deadlines, notifications, and follow-up execution

- Deadlines: when to remind, whom to escalate to, and when to release claims; elapsed or working-calendar hours.
- Copies: notification at submission, approval, or execution completion. Copies are informational; confirmation-gated effectiveness needs its own process.
- Resources: when to reserve budget or limits, and release rules for rejection, withdrawal, termination, and return.
- Execution: work after approval, retries after failure, and reconciliation of unknown outcomes to prevent duplicate payment.

### Execution after approval in the example

The payment example preserves finance approval and shows **Approved**, but the treasurer still needs to choose **Pay now** or **Choose when to pay**. Budget reservation appears separately too. Approval, execution scheduling, and payment results should be distinct rather than represented by one “approved” status.

![Treasurer schedules execution after approval, with budget reserved](https://static-docs.nocobase.com/images/capabilities/approval/payment-1b9f594274ba488d.png)

### Example prompt

```text
Remind the manager after 8 working hours without action, and pass it to their superior after 16. If finance team work is not completed within 4 working hours of claiming, others can claim it again. Count Monday–Friday 09:00–18:00 in Beijing time; let me confirm holiday handling first.

After approval, notify the applicant and purchasing lead. Copy recipients only view; they do not decide. If we add payments later, reserve budget first and release it as agreed when requests end or are cancelled. Show approval, payment scheduling, payment success, and failure separately. Only authorized treasurers may pay or retry. Do not pay again before checking an uncertain outcome, and never pay twice. Confirm the details with me first.
```

Payment is a later extension. Confirm whether the business needs it before adding it to the process. The example simulates external payments; real payments require bank integration and reconciliation.

## Pages and permissions

Choose approvals embedded in record details or an approval center as needed. Pages include a pre-submission route preview, my requests, pending, handled, copied, request details, and administrative entry points where needed. Details show submitted content, opinions, responsibility changes, and execution progress. Users see only operations they may currently perform, with reasons when they cannot act.

### Form and route preview in the example

Place business input beside its route before submission. The two-day leave below goes only to the manager, so applicants can check who will review before submitting. Purchase requests should preview manager, finance, and optional VP review according to amount. A preview explains the expected route; actual people are resolved on stage entry.

![Expected approval route beside the business form](https://static-docs.nocobase.com/images/capabilities/approval/leave-new-e7d1c339ebe95fe8.png)

### Unified to-dos in the example

The approval center groups **To do**, **Done**, **Started by me**, and **Copied to me** for the current identity. Details then show submitted content, progress, history, and operations. Applications should query for the signed-in user rather than use the demo identity selector in the screenshot.

![To-dos and related requests grouped for the current identity](https://static-docs.nocobase.com/images/capabilities/approval/inbox-8c49a6543c924c96.png)

### Example prompt

```text
Purchase approval needs my requests, pending, handled, copied, and request details. Before submission, show the expected route based on the amount. Details should show submitted content, each stage's progress, opinions, action history, and execution results where needed.

People may view and act only within their permissions. Transfers and added reviewers must use qualified people, and returns must use allowed stages. Explain why an operation is unavailable. If content changes after I open the page, ask me to review it again. Let me refresh to see progress after someone else acts.

When it is ready, explain how the applicant, manager, two finance reviewers, and VP use it, and check that unrelated people cannot view or act.
```

### Management center

When administrators need to resolve approval exceptions, ask the Agent to develop a management center as a business page. Define visible records, issues, tasks, history, and entries for reassignment, appointment, redispatch, process reset, or execution retry according to administrative responsibilities. The Agent implements pages, queries, and permissions for those business needs.

Define “redispatch” and “reset”: replacing a current actor, closing old tasks and allocating fresh ones, or ending a round and resubmitting. Decide permitted states, opinion validity, budget handling, and external execution recovery first. The Agent implements appointment, reassignment, resubmission, and reset against the agreed rules while preserving original tasks, opinions, and action history.

#### Example prompt

```text
I need an approval management center. Authorized administrators should see requests for the businesses they manage, progress, to-dos, action history, and execution results, and resolve missing reviewers, departed staff, or execution failures.

Administrators can appoint reviewers or reassign work. I also need redispatch and process reset. Confirm when these are allowed, where review restarts, which opinions remain valid, and what happens to reserved budget and completed work. Do not delete original records. Require reasons, show affected requests, and record who did what and when.

Show me the page plan and administrator permission scope before building it.
```

## Acceptance and rollout

| Area                       | What to establish                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permissions                | Allowed and refused viewing, initiation, handling, and administration; other access paths enforce the same rules                                     |
| Aggregation                | Every route and group rule; partial opinions do not advance records; conclusions match next-stage progress, with no incorrect progress after failure |
| Participants               | Missing reviewers, applicant exclusion, delegation, claims, transfer, and added-reviewer responsibilities                                            |
| Recovery                   | Resubmission creates new tasks; old tasks are invalid; reuse happens only when its conditions hold                                                   |
| Evidence                   | Displayed content matches approval evidence; stale pages cannot approve new content                                                                  |
| Time and notifications     | Working calendar, reminders, escalation, claim expiry, and continued processing after restart                                                        |
| Data and execution         | Refuse overwriting changed official data; release budgets correctly on each ending; retries do not repeat execution                                  |
| Repetition and concurrency | Repeated requests do not repeat actions; concurrent actions do not overwrite one another                                                             |

Ask the Agent for check results and trial steps; business users verify that results match the agreement.

### Example prompt

```text
Help me accept this approval process. List trial steps for applicants, reviewers, and administrators. Check amount routes, group approvals, returns and corrections, transfers, added reviewers, and materials against our agreement. The first finance approval must not advance the request, old to-dos and stale pages must not allow approval, and unrelated people cannot view or act.

Check enabled reminders, copies, budgets, and payments too. Repeated clicks or simultaneous actions must not cause repeated handling or payment. Tell me the results, what is still unverified, and what I need to help confirm.
```

### Rollout, rule changes, and troubleshooting

Before rollout, the Agent checks operational readiness while business users confirm participants, notification channels, and permissions. Before changing rules, list requests under review and decide whether they keep the old rules or are resubmitted. Rule changes must leave a valid path for ongoing requests.

Diagnose through the request, current stage, tasks, action history, and external execution records. Distinguish missing reviewers, waits for signers or materials, content changes, rule changes, and external failures. Administrator appointment, reassignment, and retries use authorized operations.

#### Example prompt

```text
We are ready for people to use this approval process. Check participants, permissions, reminders, notifications, and follow-up execution. Tell me how to enable it and recover if something goes wrong.

When changing rules later, first list requests still under review. Let me decide whether they continue under the old rules or are resubmitted, and explain what happens to earlier tasks, opinions, and deadlines.

For a stuck request, I need to see progress, whom it is waiting for, action history, and execution results. Identify whether reviewers are missing, added reviewers or materials are pending, content or rules changed, or execution failed. Let an authorized person resolve it and keep a record.
```

## Further reading

For business walkthroughs and scenario prompts, see [Scenarios](./scenarios.md). For custom policies, operations, server contracts, and background integration, see [Extensions](./extension.md).

## Reporting a problem

Identify the request, your role, what you did, what you expected, and what happened. Include the exact error message if the page shows one. The Agent can diagnose from these details; you do not need to guess which package or setting is missing.

```text
As a finance reviewer, I opened the purchase request “Office monitor” and clicked Approve. The page showed “[paste the actual error message]”. I expected my approval to be recorded while waiting for the second finance reviewer, but progress has not changed. Please find and fix the cause, preserving the request and action history.
```
