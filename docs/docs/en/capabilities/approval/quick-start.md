---
title: 'Quick start'
description: 'Outline a first purchase approval from business description to acceptance.'
---

# Quick start

:::warning Documentation in progress
This chapter establishes the structure and scope. Full walkthroughs and scenario examples will be added here.
:::

Start with one purchase request: its applicant submits it, and their manager approves, rejects, or returns it for correction. Add finance review and payment later.

## Before you start

Use an application where you can develop with an Agent; see [Create an application](../../get-started/create-app.md). Ask the Agent to inspect `@nocobase/app-plugin-approval`, its installed Skill, organization services, lifecycle storage, configuration, and migrations.

## Step 1: Describe the approval

```text
Use the approval plugin (@nocobase/app-plugin-approval) to implement purchase requests in this application. Check dependencies and the installed plugin Skill first.

A request contains purchase details, amount, and applicant. Applicants submit their own drafts to their direct manager and cannot approve their own requests. Managers may approve, reject, or return for correction; rejection and return require reasons. Rejection ends the request. A corrected request returns to the manager for a fresh decision. Reviewed content and amount cannot be edited during review. Block submission if no eligible manager exists.

Before coding, provide the complete process diagram, stage table, operation permissions, and missing business decisions. This first version handles approval only.
```

## Step 2: Confirm the process and stage table

Check draft, manager review, correction, approval, and rejection. Confirm identity sources, missing-reviewer handling, resumption, withdrawal, and record visibility before implementation.

## Step 3: Implement records and pages

```text
Implement the confirmed rules, migrations, routes, permissions, tests, and pages. Applicants see only their own requests; managers see requests they are authorized to access. Withdrawal is disabled for this version.

Provide a request list, submission form, and detail showing reviewed content, progress, history, and offered actions. Prepare applicant, manager, and unrelated-user identities in development and explain how to try them.
```

## Step 4: Try the pages

| Case                             | Expected result                                          |
| -------------------------------- | -------------------------------------------------------- |
| Manager approves                 | Request ends approved with actor and time recorded       |
| Manager rejects                  | Request ends rejected with a reason                      |
| Return, correction, resubmission | Old opinions remain; new review tasks are created        |
| Unrelated user reads or acts     | Access is refused according to the confirmed permissions |
| Direct edits during review       | Reviewed fields cannot be changed                        |

## Step 5: Accept the result

```text
Test applicant-only submission, missing managers, authorized review, required reasons, fresh tasks after correction, stale task refusal, frozen content, duplicate requests, concurrent operations, and permissions when calling routes directly. Run lint, typecheck, test, and build for affected packages and provide the results.
```

## Next steps

Add rules through [Develop with an Agent](./develop.md) and the business categories in [Scenarios](./scenarios.md).
