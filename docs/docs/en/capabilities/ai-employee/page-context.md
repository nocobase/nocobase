---
title: 'Page context'
---

# Page context

Users often ask questions about the record they are handling. An application can provide its identifier and necessary context to an AI employee, so users can ask what to do next without copying the customer, route and status again.

## Example: an assistant beside order details

```text
Add a Transport assistant panel beside Northstar order details.
Associate the conversation with the current order and use authorized business actions to read its customer, route, cargo, status, owner and driver.
Summarize the order and explain the next action for its stage. Include the corresponding business entry point.
Update context when the order changes; do not reuse the previous order's information.
Use the existing blue theme and keep the order and conversation visible together.
```

## View the result

Open the assistant beside **NS-2026-001** and ask:

```text
Summarize this order. What should I do next?
```

Order details remain on the left. The conversation identifies the associated order and explains the next step for Awaiting dispatch, with an entry point for driver assignment.

![Order details and the Transport assistant shown together](../assets/northstar-ai-order-context-en.png)

**The conversation follows the current order and connects to its business actions.**

:::tip Important

Context helps interpret a question; the server controls access. An order identifier does not grant permission to read that order. Define permitted actions and confirmation requirements before connecting writes, messages or approvals.

:::
