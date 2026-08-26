---
title: "Workflow Management"
description: "The Workflow Management Skill creates, edits, enables, and diagnoses NocoBase workflows."
keywords: "AI Builder,workflow,triggers,nodes,approval,automation"
---

# Workflow Management

## Introduction

The Workflow Management Skill creates, edits, enables, and diagnoses NocoBase workflows — from trigger selection to node chain building to execution result troubleshooting, covering the complete workflow lifecycle.

## Installation

```bash
npx skills add nocobase/skills --skill nocobase-workflow-manage -y
```

## Capabilities

Can do:

- Create workflows: Select trigger types and add processing nodes one by one
- Edit workflows: Modify trigger configuration, add/remove/update nodes, move and copy nodes
- Version management: Versions that have been executed will automatically create a new revision without affecting historical records
- Enable and manually execute workflows
- Diagnose failed executions: Locate failed nodes and error messages

Cannot do:

- Cannot design data models (use the [Data Modeling Skill](./data-modeling))
- Cannot install MCP or handle environment issues (use the [Installation & Upgrade Skill](./env-bootstrap))
- Cannot delete an entire workflow (a high-risk operation requiring separate confirmation)
- Cannot fabricate node types or trigger types

## Prompt Examples

### Scenario A: Creating a new workflow

```
Help me set up a workflow that automatically deducts product inventory after an order is created
```

The Skill will first confirm the trigger type and node chain design, then create them step by step after confirmation.

![20260419234303](https://static-docs.nocobase.com/20260419234303.png)

### Scenario B: Editing an existing workflow

```
In the order creation workflow, add a notification node when inventory is insufficient, sending a message to the administrator
```

If the current version has been executed, a new revision will be created first before editing, without affecting historical execution records.

![20260419234419](https://static-docs.nocobase.com/20260419234419.png)

### Scenario C: Diagnosing execution failures

```
The order creation inventory deduction workflow failed on its last execution, help me find out what went wrong
```

It will find the most recent failed execution, locate the failed node and error message, and provide fix recommendations.

![20260419234532](https://static-docs.nocobase.com/20260419234532.png)

### Scenario D: Analyzing or summarizing workflow logic

```
Help me analyze the processing logic of the "order creation inventory deduction" workflow
```

Output:

```markdown
# Workflow Analysis: Order Creation & Inventory Deduction

## Workflow Overview
**Type:** Order Creation and Inventory Deduction

### Trigger
- **Type:** Action-based event
- **Trigger Condition:** Triggered when a "Create" operation is performed on the `orders` collection (Global trigger).
- **Associated Data:** Carries `details` (order line items) as the payload.
- **Execution Mode:** Asynchronous

---

### Node Execution Chain

**[Trigger] Order Created**
        │
        ▼
**[1] Loop (Looping through order details)**
    *   **Target:** `{{$context.data.details}}`
    *   *Action: Iterating through each line item:*
        │
        ▼
    **branchIndex=0 (Loop Body)**
        │
        ▼
    **[2] Query Product Inventory (Query)**
    *   **Collection:** `products`
    *   **Filter:** `id = {{$scopes.5u6lsjzf8vh.item.productId}}`
        │
        ▼
    **[3] Check Sufficient Inventory (Condition)**
    *   **Engine:** `formula.js`
    *   **Expression:** `{{$jobsMapByNodeKey.n6rf8lf2lum.inventory}} < {{$scopes.5u6lsjzf8vh.item.quantity}}`
        │
        ├── **YES (branchIndex=1, Insufficient Stock, Condition is TRUE):**
        │   ▼
        │   **[4] Notify Super Administrator (Notification)**
        │   *Sends notification to users with the 'root' role, including:*
        │   *Product Name, Product ID, Current Inventory, and Requested Quantity.*
        │
        └── **NO (branchIndex=0, Sufficient Stock, Empty Branch)**
        │
        ▼
    **[5] Deduct Inventory (SQL)**
    *   **Statement:** `UPDATE products SET inventory = inventory - :quantity`

---

### Key Logic Summary

| Phase | Description |
| :--- | :--- |
| **Trigger** | Upon order creation, the system initiates the workflow with the complete list of order details. |
| **Loop** | Processes each line item individually; each item corresponds to a specific product and its purchase quantity. |
| **Query** | Retrieves the current inventory level for the specific product using `productId`. |
| **Condition** | Evaluates if `inventory < quantity` (i.e., checking for insufficient stock). |
| **Notification** | If stock is insufficient, an in-app message is sent to users with the 'root' role. |
| **Deduction** | Performs a direct SQL update to subtract inventory; this step executes regardless of the condition outcome. |

---

### ⚠️ Potential Design Issues

The `downstreamId` of the Condition node points to the "Deduct Inventory" node, meaning both branches (Sufficient Stock / Insufficient Stock) converge to execute the deduction. This results in the following behavior:

- **Sufficient Stock** $\rightarrow$ Inventory is deducted (Normal). ✓
- **Insufficient Stock** $\rightarrow$ Administrator is notified, **and then** inventory is still deducted (which may result in negative stock).

**Analysis:** This could either be an intentional "allow overselling with warning" design pattern, or a logical error (where the system should have prevented deduction if stock was insufficient). This requires verification with the business stakeholders to confirm the intended logic.

---

### Current Status

- **Enabled:** `false` (Disabled)
- **Execution History:** Has been executed 1 time.
- **Version Control:** The version is currently frozen. To make modifications, a new version must be created.
```

## FAQ

**Why isn't the workflow triggering after creation?**

Newly created workflows are disabled by default (`enabled: false`). You need to confirm the trigger configuration is correct before manually enabling it.

**Will editing a workflow affect historical execution records?**

No. If the current version already has execution records, the Skill will automatically create a new revision. Historical execution records are bound to the old version and are not affected.

## Related Links

- [AI Builder Overview](./index.md) — Overview and installation guide for all AI Builder Skills
- [Data Modeling](./data-modeling) — Create and manage data tables with AI
- [Installation & Upgrade](./env-bootstrap) — Environment checks, installation, deployment, and troubleshooting
