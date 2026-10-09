---
title: '2. Build list and detail pages'
description: 'Connect an order form, list, and detail page to the database.'
---

# 2. Build list and detail pages

Connect the tables to pages so you can select a customer, create an order, and open its detail URL.

## Goal and starting point

Confirm that the previous chapter's tables and customer data exist. Finish this chapter by opening the list from the menu, creating an order, visiting its detail URL, and refreshing to check persistence.

## How pages and APIs fit together

The list lets you compare orders; a detail page focuses on one. Its URL contains the order ID, so you can bookmark it or open it from an approval notification later.

The form shows customer names but sends a customer ID when saving. The server must check that this customer exists; a dropdown is not a replacement for server validation.

Distinguish an empty list from a failed request. An empty list allows creation; a failure needs a useful access or API error. Preserve input after a failed save so the user does not have to re-enter everything.

## Ask your AI Agent to add pages and APIs

```text
Read the installed Skills for client routes, pages, i18n, and server APIs. Continue using tutorialCustomers and tutorialOrders.

Add a “Tutorial orders” menu item at /tutorial-orders and a detail page at /tutorial-orders/:id. Read the real database, not fixed arrays or local storage. Use lazy routes and do not hard-code /main.

List order number, customer name, amount, and status. Add a create form for order number, customer selection, and amount in CNY. The detail page shows the customer, contact, amount, status, revision, and approval comment, with a link back to the list.

On the server, validate a unique order number, an existing customer, and a positive amount. Set ownerId from the authenticated identity; initialize draft, version=0, and an empty comment. Reject client-supplied ownerId, status, or version. Require authentication on every endpoint.

Display amounts in CNY and store integer cents. Handle empty lists, loading failures, denied access, and missing orders. Use English and Chinese translation resources for interface text.
```

Use the administrator to check the initial wiring, then configure ordinary users in the next chapter. If the administrator lacks a required grant, register and configure the resource; do not remove the server's permission checks.

## Create an order

Enter these values in the form:

| Field        | Value    |
| ------------ | -------- |
| Order number | `SO-001` |
| Customer     | 远山科技 |
| Amount (CNY) | `1280`   |

Create the order. Its status should be Draft. Open its number and check the detail fields.

![Order detail showing SO-001 for CNY 1280 in Draft status; Chinese interface](https://static-docs.nocobase.com/nb3-docs-20260916-tutorial-detail.png)

## Check persistence and routing

1. Refresh the detail URL and verify that the same order opens.
2. Return to the list and check that the record remains.
3. Try creating another `SO-001`; the duplicate must be rejected.
4. Try a negative amount; both the form and a direct API request must reject it.
5. Open a nonexistent detail ID; do not continue displaying the previous order.

Ask the AI Agent to verify that the database stores `amountCents: 128000`, rather than relying on the formatted screen value.

Next: [Add permissions](./permissions).
