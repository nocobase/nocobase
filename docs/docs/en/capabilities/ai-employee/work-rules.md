---
title: 'Responsibilities and work rules'
---

# Responsibilities and work rules

An AI employee's instructions can define who it serves, its tasks, response priorities, and work rules. Work methods can be included in these instructions. Runtime modes that support skills can also reuse them, allowing different assistants to approach the same business question according to their responsibilities.

Instructions and skills guide how work is done. Application actions and permissions determine what can be executed. An employee's additional instructions cannot override application rules or the current task.

## Example: transport and customer assistants

Northstar wants its transport assistant to focus on orders and dispatch, and its customer assistant to focus on communication and follow-up. Asked what to prepare next for **NS-2026-001**, one organizes dispatch work and the other prepares customer communication. Order changes and message sending require confirmation according to application rules.

Describe the requirement to your development Agent:

```text
Prepare transport and customer assistants for Northstar using an existing available model service.
The transport assistant handles orders and dispatch, checking the route, delivery time, and drivers first. Require confirmation before changing orders.
The customer assistant handles communication and follow-up, preparing a delivery-message draft without taking over dispatch or sending automatically.
Connect reads and actions appropriate to each responsibility. Explain missing information rather than inventing conclusions.
Show the active assistant and associated order in conversations so their priorities are clear.
```

## See the result

Ask each assistant:

```text
What should we prepare next for this order?
```

The transport assistant lists route checks, driver lookup, and an assignment plan. The customer assistant lists contact checks, drafting a message, and waiting for confirmation before sending.

![Transport and customer assistants answer for the same order according to their responsibilities](../assets/northstar-ai-work-rules-en.png)

**The same question produces preparation for different responsibilities, showing employees who handles each task and where confirmation is needed.**

:::tip Important

Instructions do not replace access control. An assistant limited to preparing drafts should not receive sending actions. For actual operations, define inputs, permissions, confirmation, and result records together. Methods in skills should follow the same rules.

:::
