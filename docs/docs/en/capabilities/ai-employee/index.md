---
title: 'AI employees overview'
---

# AI employees overview

An AI employee is an application assistant with a defined responsibility. It can use page context, query business data, call permitted actions following working instructions, and answer with company knowledge. Ask your development Agent to connect these capabilities and build the conversation and result views your users need.

## Available capabilities

| Capability | Purpose |
| --- | --- |
| [Page context](./page-context.md) | Answer about the order, customer or form currently open. |
| [Business queries](./business-data.md) | Find records using natural language and link results to application pages. |
| [Business actions](./business-actions.md) | Connect business actions with server-side authorization and execution records. |
| [Responsibilities and working rules](./work-rules.md) | Define tasks, response style and permitted operations. |
| [Company knowledge](../ai-knowledge-base/answers.md) | Find supporting material and link answers to readable sources. |

Conversations can appear on a dedicated page, in a business block or beside the current page.

## Prepare an AI employee

The application needs the Agents capability and an available model service. A development Agent can connect the model, instructions and business actions; a separate employee creation form is optional.

```text
Connect a Transport assistant to the Northstar application using my configured model service.
It explains orders, finds records awaiting dispatch and offers advice using transport procedures.
Connect order-reading actions within the current user's access scope. Start with queries; do not automatically change orders or send notifications.
Provide conversation entry points on order lists and details, with follow-up questions and links to returned orders.
```

Model services can use cloud providers or an available local service. Specify the endpoint, available models and credential configuration. Business actions enforce access on the server.

Start with [page context](./page-context.md), then [business queries](./business-data.md).
