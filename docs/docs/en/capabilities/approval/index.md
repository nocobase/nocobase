---
title: 'Overview'
description: 'Approval rules, business processes, user experiences, and a guide to this chapter.'
---

# Overview

:::warning Documentation in progress
This chapter establishes the structure and scope. Full walkthroughs and scenario examples will be added here.
:::

Leave, expenses, purchases, and contracts need clear rules about who reviews, in what order, and what counts as approval. Simple submission, approval, and rejection can use a [workflow](../workflow/index.md). The approval plugin coordinates several people within a business step and preserves their opinions and responsibility history.

The application record identifies the complete process: draft, review, correction, execution, and final states. Partial opinions update tasks; only the stage's conclusion moves the record to its next state.

## What the plugin provides

| Capability                             | Business decisions                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| Multiple levels and conditional routes | Review order and amount or category thresholds                                   |
| Collective decisions                   | All, any, first answer, sequential, and minimum approval count                   |
| People and responsibility              | Manager chains, roles, team pools, claims, and missing reviewers                 |
| Operations                             | Approve, reject, return, transfer, added signers, and material requests          |
| Copies                                 | Read-only participation and read confirmation, without voting                    |
| Time                                   | Reminders, escalation, claim expiry, and optional working calendars              |
| Evidence                               | Reviewed snapshots, opinions, responsibility changes, and explicit opinion reuse |

A percentage rule needs a population and rounding rule before calculating the minimum approval count. Itemized review, partial approval, abstention, and veto rules belong in [Scenarios](./scenarios.md) and [Extension](./extension.md).

## What users see

Before submission, a route preview shows expected reviewers; people are resolved again when a stage is entered. Applicants see their requests and permitted withdrawal or resubmission. Reviewers see to-do and completed tasks, reviewed content, available actions, and refusal reasons. Copy recipients see progress and read confirmation. Details show opinions, history, and execution results. Authorized administrators can appoint or reassign reviewers and retry failed execution.

The plugin supplies tasks and data contracts. An Agent implements business pages, routes, and permissions, either inside existing record details or in an approval center. Installing the plugin does not generate these pages automatically.

## After approval

Approval and execution have separate results. An approved payment can fail at the bank and be retried without repeating human approval when its content is unchanged. A proposed contract or price change is separate from effective data; check the effective record's baseline version before applying the change.

## Changing rules

Rules live in application source. Have an Agent update and test them locally, then redeploy. Decide how open requests are handled and retain the states and exits they still need.

## Chapter structure

| Page                                  | Content                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| [Quick start](./quick-start.md)       | A purchase request from submission to review, correction, and acceptance       |
| [Develop with an Agent](./develop.md) | Business design, people, operations, pages, tests, and rollout                 |
| [Scenarios](./scenarios.md)           | Leave, purchases, contracts, expenses, payments, and reusable prompt outlines  |
| [Extension](./extension.md)           | Existing applications, custom policies and actions, UI, and reliable execution |
