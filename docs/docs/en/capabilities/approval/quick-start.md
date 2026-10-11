---
title: 'Quick start'
description: 'Complete a first submission, approval, and return-for-correction cycle with a fixed purchase request.'
---

# Quick start

This page walks through a fixed purchase approval process. Give the prompts to the Agent in order, then submit as an applicant, act as the manager, and verify that a returned request can be corrected and resubmitted. Add group decisions, extra reviewers, deadlines, and payments later as the business needs them.

## Prepare the application

You need a NocoBase application you can develop with an Agent. If you do not have one yet, see [Create an application](../../get-started/create-app.md). Describe the purchasing rules and pages you need; the Agent checks the application and implements them. To try existing pages first, see [Scenarios](./scenarios.md#install-and-try-the-examples).

```text
I want purchase request approval in this application. Employees enter what they want to purchase and the amount, then their direct manager reviews it. Help me organize the process and questions we need to settle first. Leave payments and other follow-up work for later.
```

## Step 1: Confirm the fixed process

Use the following rules for this case. Ask the Agent for a design and check that it matches the table.

| Item            | Rule for this case                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Request content | Purchase details, amount, and applicant                                                              |
| Route           | Draft → manager review → approved or rejected                                                        |
| Return          | Manager returns it to the applicant for correction; resubmission requires fresh manager review       |
| Operations      | Approve, reject, and return; rejection and return require reasons                                    |
| Editing         | Only the applicant may edit drafts or returned requests; content and amount are frozen during review |
| Visibility      | Applicants see their requests; managers see requests assigned to them                                |
| Participants    | Applicants cannot approve themselves; submission is blocked without a qualified manager              |
| Scope           | No withdrawal, group decisions, extra reviewers, deadlines, ordering, or payments                    |

```text
Purchase requests contain purchase details and an amount. After the applicant submits, their direct manager can approve, reject, or return for correction. Rejection and return both require a reason. Approval or rejection ends the request; after a return, the applicant edits and resubmits for a fresh manager review.

Applicants see only their own requests, managers see requests assigned to them, and others cannot view or act on them. Applicants cannot approve themselves. If there is no suitable manager, prevent submission and explain why. Content and amount cannot change after submission unless the request is returned. No withdrawal, group decisions, extra reviewers, reminders, ordering, or payments in this version.

Show me a process diagram and what each role can do. Start building after we confirm the design.
```

Check that the design includes draft, manager review, correction, approved, and rejected states, with resubmission from correction. Confirm it before asking the Agent to implement it.

## Step 2: Build the request and pages

```text
Build purchase approval using the rules we confirmed. Applicants need My purchase requests, a new-request form, and a details page. Managers need a to-do list and a review page. Before submission, show who is expected to review; details should show the content, progress, opinions, and action history.

Each person should see only requests they may view and perform only operations they are allowed to do. If content changes after I open a page, ask me to review it again rather than approving the old content. When it is ready, tell me where to open it and how to try it as an applicant, a manager, and an unrelated user.
```

The screenshot below is from the implemented leave example and illustrates how a form relates to its route preview. For this case, the Agent builds a purchase form with purchase details and an amount. Page names and fields depend on that implementation.

![Form and route preview reference for a single-manager process](https://static-docs.nocobase.com/images/capabilities/approval/leave-new-e7d1c339ebe95fe8.png)

## Step 3: Submit and review

Sign in as the applicant, create a purchase request for “Office monitor” with an amount of 2000, check the manager preview, and submit. It should enter manager review, with content and amount no longer editable. Sign out and sign in as the manager. Open the same request from the to-do list, check that its content matches the submission, and approve. It should end as approved, preserving the manager and action time.

```text
Help me walk through this: submit “Office monitor” for 2000 as the applicant, then open the to-do and approve as the manager. Tell me where to act and what to expect at each step. Check the content, reviewer, progress, and action history with me.
```

The single-manager leave details below show submitted content, the current task, progress, history, and action buttons. Purchase details should provide the same information structure, plus the return operation specified for this case.

![Single-manager review details reference](https://static-docs.nocobase.com/images/capabilities/approval/leave-review-7e9bc99193badbbb.png)

## Step 4: Verify return and correction

Create another purchase request for 3000. The manager returns it with “Please explain the purpose of this purchase.” The applicant adds the purpose and resubmits. The manager should receive a new task, the original return record should remain visible, and the old task link must no longer allow action. Approval of the new task should end this request as approved too.

```text
Try a return: the manager enters “Please explain the purpose of this purchase” and returns the request. The applicant adds the purpose and resubmits, then the manager approves. Keep the original return reason, give the manager a new to-do, and make the old to-do unusable. Do not automatically reuse an earlier opinion.
```

## Step 5: Accept the minimum cycle

| Operation                                         | Completion criterion                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Applicant submits; manager approves               | Ends as approved, preserving opinion, actor, and time      |
| Manager rejects with a reason                     | Ends as rejected; cannot be resubmitted as though returned |
| Manager returns; applicant corrects and resubmits | New task, old task invalid, history preserved              |
| Unrelated user views or acts                      | Both the page and direct API access refuse                 |
| Content or amount edited during review            | Editing is refused                                         |

```text
Check that purchase approval matches our agreement: approval passes, rejection with a reason ends it, and returned requests can be corrected and resubmitted. Unrelated people cannot view or act, content and amount cannot change during review, submission needs a manager, and rejection or return needs a reason. Tell me the results and what I still need to confirm by trying it.
```

## Next

After this cycle works, use [Develop with an Agent](./develop.md) to choose participants, group rules, recovery operations, and follow-up execution. Try similar businesses in [Scenarios](./scenarios.md). The full checklist for permissions, concurrency, recovery, and rollout is in [Acceptance and rollout](./develop.md#acceptance-and-rollout).
