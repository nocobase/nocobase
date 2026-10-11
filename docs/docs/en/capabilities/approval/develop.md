---
title: 'Develop with an Agent'
description: 'Organize approval development from business design to rollout and troubleshooting.'
---

# Develop with an Agent

:::warning Documentation in progress
This chapter establishes the structure and scope. Full walkthroughs and scenario examples will be added here.
:::

You provide business rules and key decisions. The Agent inspects the application, implements the feature, and supplies test evidence. Confirm the process diagram and stage table first, then add one class of rules at a time.

## Step 1: Describe the business and complete process

Specify the request and any effective business data it changes, frozen fields, applicants, visibility, draft and review states, correction, execution and failure states, conditional routes, withdrawal, termination, resources held, and post-approval work. Ask for a process diagram, stage table, and side-effect table covering every exit.

## Step 2: Define how each stage concludes

Distinguish all-approve, any-approve, first-answer, sequential, and minimum-count policies. Decide whether rejection ends countersigning immediately, and whether every voter must answer. Distinguish multiple business stages from sequential people inside one stage; see [Scenarios](./scenarios.md).

## Step 3: Resolve people and missing reviewers

Define manager chains, roles, departments, pools, and claim requirements. Specify applicant exclusion, inactive people, delegation, and duplicate responsibility rules. Missing eligible people either refuse entry or wait for appointment. Exemption is an explicit conditional route.

## Step 4: Define operations and recovery

Register each stage's allowed approval, rejection, return, transfer, signer, material, comment, and copy operations. Restrict recipient scopes, signer modes, and depth. Define return targets, reasons, and resubmission routes. Fresh review is the default; specify conditions if old opinions may stand. A material request can wait within the current stage.

:::tip Return and rejection
Return immediately ends the stage and moves to its declared target. Rejection is an opinion counted by the stage's policy. Confirm the authority this gives an individual before offering return in a voting stage.
:::

## Step 5: Time, copies, and execution

Define reminders, escalation, claim expiry, and natural or working hours. Choose whether copies are sent on submission, approval, or completed execution. Copies do not vote; confirmation that makes a notice effective has its own process. Specify resource reservation and release on every exit, external failures, retries, and reconciliation before retrying an unknown payment result.

## Step 6: Pages and processing

Choose business detail integration, an approval center, or both. Cover preview, my requests, to-do, done, copies, details, and administration where needed. Show reviewed content, counts, responsibility changes, execution progress, and server-offered operations.

## Step 7: Acceptance

| Area                       | Evidence                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Permissions                | Allowed and refused read, submit, process, and administer cases, including direct route calls                |
| Decisions                  | Every route and policy; partial opinions do not move records; conclusion and next allocation commit together |
| People                     | Missing people, exclusion, delegation, claims, transfers, and signer restrictions                            |
| Recovery                   | New tasks on re-entry, stale tasks refused, and reuse only when eligible                                     |
| Content                    | Decisions apply to the displayed content; stale pages cannot approve changed content                         |
| Time                       | Calendars, reminders, escalation, claim expiry, and restart recovery                                         |
| Data and execution         | Baseline conflict, release on all exits, and no duplicate external execution                                 |
| Repetition and concurrency | Duplicate requests and simultaneous operations do not overwrite results                                      |

Request test cases, results, and builds for affected packages.

## Rollout, changes, and troubleshooting

Apply migrations and verify organization services, jobs, notification channels, and permissions. List open requests before changing rules, decide whether they retain old rules or need fresh review, manage semantic rule versions, and preserve live states and exits.

Inspect the request, current stage, tasks, history, and external execution records. Missing reviewers, signers, material, changed content, changed rules, and external failures need different recovery actions. Appointment, reassignment, and retry use authorized operations.
