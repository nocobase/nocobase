---
title: 'Scenarios'
description: 'Organize business approval examples and acceptance criteria.'
---

# Scenarios

:::warning Documentation in progress
This chapter establishes the structure and scope. Full walkthroughs and scenario examples will be added here.
:::

Each scenario follows “business rules → adaptable prompt → page experience → acceptance criteria.” This outline defines the scope; complete examples can be added within these sections.

## Leave: manager chains and conditional review

Direct-manager review, extra levels above a limit, exempt leave categories, missing managers, exclusion, delegation, and resubmission. Attendance registration after approval has a separate failure and retry state.

## Purchases and contracts: collective review and responsibility seats

Route purchases by amount. Legal and finance each contribute one opinion, with one person from each team filling its seat. Specify claims, transfers, added signers, return targets, and copies.

### Collective decisions

| Requirement     | Result                                                                          |
| --------------- | ------------------------------------------------------------------------------- |
| Single reviewer | One designated person decides                                                   |
| All approve     | Everyone agrees; rejection ends immediately or after all opinions are collected |
| Any approve     | One approval passes; all must reject for rejection                              |
| First answer    | The first approval or rejection decides                                         |
| Sequential      | People answer in order; rejection rejects                                       |
| Minimum count   | A specified count passes; optional abstention, veto, and waiting for everyone   |

## Expenses: itemized review and partial approval

Allocate expense lines, record approved amounts, return individual lines, and decide whether approved lines can be paid separately. Stable per-line payment keys prevent duplicates.

## Payments: reservations and failed execution

Reserve budget on submission and release it on every applicable exit. Distinguish definite refusal, temporary outage, and unknown outcome. Reconcile unknown results, retry execution without repeating approval, and seek fresh review if amounts change.

## Contract changes: proposed and effective data

Freeze the proposed change and baseline version. Check the effective contract's version in the final transaction; refuse and roll back on conflict, then create a new request. External synchronization retries separately.

## Team work: claims, material, and administration

Claim tasks with expiry, request more material, appoint missing reviewers, and preserve responsibility on reassignment. Urging and deadline extensions are authorized custom operations.

## Parallel departments and child processes

Independent department processes use child records with their own lifecycles and parent aggregation. People deciding one shared result use countersigning. Show branches and blocking reasons.

## Notices, follow-up work, and a unified inbox

Copies are informational. Notices requiring confirmation, onboarding checklists, and follow-up purchasing work have their own processes. A unified inbox combines approval and other sources, each owning its permissions and actions.
