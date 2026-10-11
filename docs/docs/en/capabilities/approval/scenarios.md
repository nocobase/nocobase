---
title: 'Scenarios'
description: 'Approval rules, business prompts, and acceptance criteria organized by scenario.'
---

# Scenarios

These scenarios follow business rules, adaptable prompts, page behavior, and acceptance criteria. They come from `@nocobase/app-plugin-approval-example` and can be reproduced in its English interface using the steps below.

## Install and try the examples

Tell the Agent which businesses you want to try and ask it to prepare the development environment and entry point. The examples are for exploration; preserve existing business data.

```text
I want to try the existing approval examples for leave, purchasing, contracts, and payments. Prepare their pages in the current development environment with an English interface, without affecting existing business data. Tell me where to open them, how to load samples, and how to switch example roles to try them.
```

Open **Approvals → Approval lab**, act as Administrator, and choose **Load sample drafts**. This adds missing base drafts and variants prefixed with `Sxx`, without submitting them or replacing existing requests. Drafts belong to Zhang San; select the right identity before acting.

![Approval lab and sample drafts](https://static-docs.nocobase.com/images/capabilities/approval/lab-80ffa9b918d02f14.png)

The example identity selector does not switch signed-in accounts. Production applications derive actors from signed-in users and implement visibility for records, tasks, and attachments. The example's organization, notifications, and external services are simulations.

## Try a manager review and a return

On **Leave**, create a two-day request as Zhang San, check its preview, and submit. Switch to Li Si and approve. Ordinary leave of up to three days needs only manager review, followed by registration; refresh to inspect the result. This example does not offer a return operation.

![Manager handles a single-reviewer request](https://static-docs.nocobase.com/images/capabilities/approval/leave-review-7e9bc99193badbbb.png)

For returns, create **Application-bound approval** on **Contracts**. Zhang San submits, Li Si reviews, finA and finB both review finance, and amounts above 100000 require VP approval. Finance can return to manager or correction. After return to correction, Zhang San edits and resubmits; old tasks remain historical. Withdrawal ends the request and does not permit direct resubmission.

![Group review progress and available return operation](https://static-docs.nocobase.com/images/capabilities/approval/contract-review-b7f46ef1a3bf8b0e.png)

This existing contract example includes group review and conditional routing. To develop a purchase process with only manager review from scratch, use [Quick start](./quick-start.md).

## Leave: manager hierarchy and conditional review

A direct manager reviews, with higher-level review above a day threshold and explicit exemptions for certain leave types. Define missing managers, applicant exclusion, delegation, and return/resubmission. Registration in attendance follows approval; failures show separately and can be retried.

### Walk through the example

On **Leave**, create ordinary three-day and four-day requests. Li Si's approval sends the three-day request to registration. Four days also requires Wang Wu and HR. Try one-day and two-day compensatory leave: one day takes an explicit exemption route, while two needs manager review. Exemption is a business condition, not a consequence of failing to find a reviewer.

**Versioned leave** compares rule and organization changes. Submit under v1 in the lab, then switch to v2 as Administrator and submit another request. The v1 route is manager → HR; v2 adds department review. Organization changes do not alter already allocated tasks; later stage entry resolves current participants.

```text
I need leave approval. Up to three days requires the direct manager; longer leave also needs the department manager and HR. Compensatory leave of one day or less needs no review. Applicants cannot approve their own leave. Confirm what to do when a manager is missing, has left, or someone acts on their behalf.

After approval, register it in attendance. Show registration failure separately and let HR retry without another approval. Help me check three versus four days, one versus two days, and behavior after a manager changes.
```

Check the preview, tasks allocated on actual entry, and final registration separately. Registration in the example is simulated external execution.

## Purchasing and contracts: group decisions and responsibility seats

Purchase amounts choose routes. Contracts may need one opinion from legal and one from finance, with one team member representing each responsibility. Define rejection behavior, claims, transfers, added reviewers, return targets, and copies.

### Walk through the example

On **Purchasing**, choose purchase by amount. The 5000 sample goes to Li Si and Wang Wu in order; 120000 also goes to VP and CEO. Each stage creates the next stage's tasks after it ends rather than asking all superiors at once.

On **Contracts**, choose a countersignature request for legalA, legalB, and legalC. Ordinary countersignature ends on one rejection. **S06 Collect all opinions** still collects the other two opinions after the first rejection, then rejects. Duplicate input in **S06 Repeated legal reviewer** creates only two member tasks.

On **Payments**, compare **Finance, first answer** and **Finance, any approval**. First-answer mode ends on the first rejection. Any-approval mode can receive two rejections and then pass on the third finance member's approval.

![Group decision rules and opinions](https://static-docs.nocobase.com/images/capabilities/approval/countersign-72c16c62c9806e38.png)

Choose the voting rule for a committee request on **Purchasing**. Three approvals with a chair veto still waits for the chair once three approvals are in; the chair's abstention waives the veto. Without a veto, the chair's rejection is just a negative vote. Two thirds of a fixed five-person group rounds up to four approvals; three cannot pass, and abstention is not approval. Recalculating the denominator after membership changes is outside this example.

![Committee voting](https://static-docs.nocobase.com/images/capabilities/approval/committee-57b1f274c991521f.png)

```text
Contracts need one opinion from legal and one from finance. One member of each team claims the work, and both must approve. Confirm whether rejection ends immediately or waits for all opinions.

Transfers and added reviewers must use qualified people, and returns must use allowed stages. Once work is claimed, other candidates cannot handle it again. Confirm whether one person may represent both teams. Show each team representative, their opinions, and overall progress.
```

Do not check only whether the request passed. Also check closure of unfinished tasks, preservation of responsibilities and actual actors, and unchanged business state after partial opinions.

### How groups decide

| Business requirement | Result rule                                                                |
| -------------------- | -------------------------------------------------------------------------- |
| Single reviewer      | One designated person decides                                              |
| Everyone approves    | All must approve; reject immediately or after collecting all opinions      |
| Any approval         | One approval passes; rejection only after everyone opposes                 |
| First response       | First approval or rejection decides                                        |
| Sequential review    | Each person acts in order; an opposing answer rejects                      |
| Minimum vote count   | Required count passes; optional abstention, veto, and waiting for everyone |

## Expenses: itemized review and partial approval

Assign review by expense line, record approved amounts, line returns, and partial results, and decide whether approved items can be paid early. Each payment uses a stable business identifier to prevent duplicate payment on retry.

### Walk through the example

On **Expenses**, create an itemized claim containing Flight and Hotel by default. Finance reviews travel and administration reviews hotel. Enter an approved amount or return a line for correction. Inspect opinions, approved amounts, the claim's partial result, and per-line payment records.

![Expense lines and approved amounts](https://static-docs.nocobase.com/images/capabilities/approval/reimbursement-ee7e3b5fec014db4.png)

```text
I need itemized expenses. Finance reviews travel and administration reviews hotel. Each item may be approved for less than requested or returned separately for correction. Amounts must be accurate to cents.

Confirm whether approved items can be paid before the others, and which items need fresh review after changes. Pay each item at its approved amount, without duplicate payment on repeated clicks or retries. Show requested and approved amounts, opinions, and payment progress for every item.
```

Check requested and approved values, task identities, and payment evidence per line. Whole-request approval cannot replace line authorization.

## Payments: budget reservation and execution failure

Reserve budget on submission and release it at ending exits. Execute approved payments as scheduled. Distinguish bank rejection, temporary failure, and unknown results. Reconcile unknown results before retrying; retries do not repeat approval, while changed amounts require resubmission.

### Walk through the example

On **Payments**, create immediate, scheduled, or installment payments and submit for finA's review. Scheduling and execution have states after approval. Administrator can simulate a payment outage in the lab. Restore the service, retry as an authorized person, and refresh to inspect the result. This simulation does not connect to a real bank.

![Approval and payment execution recorded separately](https://static-docs.nocobase.com/images/capabilities/approval/payment-1b9f594274ba488d.png)

```text
Reserve budget when a payment request is submitted. Confirm release rules for each way the request ends. Approved payments can be immediate, scheduled, or installments. Show approval and payment results separately.

Handle bank rejection, temporary failure, and uncertain payment results differently. For unknown results, check before deciding to retry. Retries must not pay twice or require another approval; changed amounts must be submitted again.
```

Acceptance covers reservation and release, installment keys, failure permissions, and reconciliation. Approval does not mean the bank has paid.

## Contract changes: requests and effective data

A change request records the original contract version and freezes proposed changes. The concluding decision checks that version before updating the official contract. A changed version refuses and rolls back the conclusion; create a fresh request against the current version. External synchronization retries separately.

### Walk through the example

On **Contracts**, create **Contract change**, preserving official contract ID, baseline version, and proposed content. Submit two proposals against the same contract version. After the first takes effect, the second's final confirmation must refuse the baseline conflict rather than overwrite the contract. External synchronization failures appear and retry separately.

```text
Contract changes need a request before the official contract changes on approval. Proposed changes cannot be edited during review. If someone else changes the official contract meanwhile, report the conflict rather than overwrite their changes; a new request must use the latest contract.

Synchronize to the external system after approval. Show synchronization failure separately and allow retries without repeating approval or changing the contract twice.
```

Check official and request versions, whether the opinion was consumed, and synchronization results, not just the displayed conclusion.

## Team handling: claims, materials, and administration

Candidates claim team tasks, with expiry releasing them. Reviewers can request applicant materials. When nobody qualifies, wait for administrator appointment, preserving responsibility history for reassignment. Extend reminders and deadline changes as business operations with explicit permissions.

### Walk through the example

Claim a team task on **Payments** as finA. finB and finC cannot vote while it is claimed. Release as finA to restore the other candidates; sup may assign. Administrator can reassign an inactive reviewer, but administrative status does not automatically grant voting authority.

On **Contracts**, the materials example lets a reviewer ask Zhang San for information, holding the original task until Zhang San responds. This is applicant material collection, not independent expert consultation.

![Team claim and responsibility operations](https://static-docs.nocobase.com/images/capabilities/approval/pool-df5ee81820d8ce33.png)

```text
A finance team member must claim a task before reviewing. Others cannot review a claimed task, but can take over after release or the specified timeout. Keep the current stage while waiting for materials; the original reviewer continues after the applicant supplies them.

Authorized administrators can appoint or reassign reviewers, but cannot approve for finance simply because they are administrators. Preserve a record of every handover and reassignment.
```

Try legal transfers and added reviewers before, after, or alongside in the contract examples. Before mode waits for the added reviewer first. After mode still needs their completion after the original member approves. Alongside adds an independent opinion. Candidate scope and depth are declared per stage.

## Parallel departments and subprocesses

Use child records and parent aggregation when departments have independent processes and results. Use group approval when several people decide one stage's result together. Pages should show every branch and blocking reason.

### Walk through the example

On **Purchasing**, create a parallel purchase. Server and Software categories trigger IT and security child requests. The four-department variant also includes legal and facilities. Branches act independently; the parent waits for required branches. Stationery is explicitly exempt and creates no review branch.

![Parallel purchasing with department branches](https://static-docs.nocobase.com/images/capabilities/approval/purchase-parallel-263f702b6113e790.png)

On **Onboarding**, inspect IT, facilities, and HR child work; facilities is optional for remote employees. On **Launches**, inspect security and legal review chains, finance opinions, and operations preparation. Preparation is not an approval vote.

```text
Route purchase items to departments by category for separate review. Each department has its own progress, and the whole purchase completes only after all required departments approve.

Confirm mappings for new categories and explicit exemptions. Do not pass a request just because no department was found. Show each department's progress, return reasons, and what is blocking the overall request.
```

Distinguish multiple people deciding one result from aggregation of independent department processes. Check child returns, cancellation, and compensation.

## Notices, follow-up work, and unified to-dos

Copies convey information rather than votes. Notices requiring everyone's confirmation, onboarding checklists, and purchase ordering use their own business processes. Unified to-dos aggregate approvals and other work, with each source retaining its permissions and operations.

### Walk through the example

**Notices** supports notification only, read receipts, and everyone confirms. Notification and read-receipt modes become effective on publication, with reads tracked separately. Everyone-confirms mode waits for each recipient. Contract copies likewise do not count as opinions.

![Notices and receipts](https://static-docs.nocobase.com/images/capabilities/approval/notice-4bb88c25862626e5.png)

The **To-do center** combines pending, handled, started, and copied work, claim pools, materials, and child work. Details preserve a `record` query parameter for links to a specific request. Switching persona changes whose data is read. Pages do not poll; refresh after other people or background tasks act.

```text
I need one to-do page for approvals, materials, and follow-up work, separating pending, handled, started by me, and copied to me.

People see only what they may view and handle only work assigned to them. Copies are informational, not votes. Notices requiring everyone's confirmation need separate confirmation progress. Details can be shared by link, but recipients still need viewing permission.
```

## Other implemented examples

| Example                        | Where to try it                                  | Focus                                                                                                  |
| ------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Proxy travel request           | Assistant submits for Zhang San on Travel        | Use the beneficiary's manager hierarchy; distinguish creator, beneficiary, submitter, and actual actor |
| Delegated expenses             | Delegation scenario on Expenses                  | Preserve actual actor and principal; delegation differs from transfer                                  |
| Supplier onboarding            | Suppliers, with lab risk and service controls    | Legal opinion, registry check, risk routing, deposit, and account execution have separate states       |
| External-event order           | Simulate readiness and payment events in the lab | Events advance to shipment; no real payment webhook                                                    |
| Multiple matters on one object | Matter requests on Contracts                     | Same subjectKey excludes duplicate open requests; different matters are independent                    |
| Limited authorization          | Apply, use, check validity, and revoke on Grants | Grants are business data with amount, usage, and object-version limits                                 |

## Reproduce the screenshots

Screenshots come from a development application with both approval plugins registered and migrations applied. The system language is English, the viewport is 1440×900, pixel density is 2, and original PNGs are 2880×1800. Load drafts in the lab, then act through business pages as the relevant personas. New data uses English titles and reasons; details show actual process results.

Screenshots demonstrate their pages and example rules. Production identities and permissions, real attachments, organization and external services, dynamic vote denominators, arbitrary in-flight process migration, and large-scale to-do queries require separate design and verification.
