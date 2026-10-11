---
title: 'Perform business actions'
---

# Perform business actions

AI employees can call business actions connected by the application, turning natural-language requests into work such as assigning a driver, creating a follow-up record, or preparing a notification. The application defines allowed actions, required inputs, confirmation, and how results are displayed.

For data changes, an employee can present an operation plan before execution. Business actions still pass server-side permission checks, and reported results must match the actual records.

## Example: assign a driver after confirmation

A Northstar dispatcher wants to assign driver Li Ming to **NS-2026-001** in the order conversation. The transport assistant first summarizes the order, driver, and status change, leaving the record unchanged until confirmation. After confirmation, it assigns the driver and changes the order from Awaiting dispatch to Awaiting acceptance.

Describe the requirement to your development Agent:

```text
Connect a driver-assignment action to Northstar's transport assistant.
Use the current order context and check user permissions, order status, and driver availability.
Show the order number, driver, and status change before writing; require user confirmation.
After confirmation, execute and show the actual order and operation record. Explain failures without reporting success.
```

## See the result

In the NS-2026-001 conversation, enter:

```text
Prepare to assign driver Li Ming to this order. Ask me to confirm first.
```

Review the plan and reply “Confirm execution.” The illustrated result shows Li Ming as the driver, Awaiting acceptance as the status, and Alice as the person who confirmed the completed operation.

![The transport assistant presents a plan and shows the driver assignment after confirmation](../assets/northstar-ai-business-actions-en.png)

**Confirmation in the conversation becomes a business record change that users can verify in the order and operation record.**

:::tip Important

Driver assignment requires an action provided by the application. Instructions or a prompt do not grant write access, and confirmation cannot bypass permissions, driver availability, or order-state checks. Assignment does not mean the driver has accepted the order and does not automatically send a notification.

:::
