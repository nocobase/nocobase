---
title: "Products, Quotations & Orders"
description: "CRM product catalog, quotations (with approval workflow), and order management guide: the complete flow from product maintenance to quotation approval to order fulfillment."
keywords: "product management,quotation,order management,approval workflow,multi-currency,NocoBase CRM"
---

# Products, Quotations & Orders

> This chapter covers the second half of the sales process: product catalog maintenance, quotation creation and approval, and order fulfillment and payment tracking. Quotations are also discussed in [Opportunity Management](./guide-opportunities) (from the opportunity perspective); this chapter focuses on the product and order perspective.

![en_03-products-orders](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/en_03-products-orders.png)

## Product Catalog

Navigate to the **Products** page from the top menu. It contains two tabs:

### Product List

The left side shows a category tree (JS filter), and the right side shows the product table. Each product includes: name, code, category, specification, unit, list price, cost, and currency.

![03-products-orders-2026-04-07-01-18-03](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-03.png)

When creating a new product, in addition to basic information, you can configure a **Tiered Pricing sub-table**:

| Field | Description |
|-------|-------------|
| Currency | Pricing currency |
| Min Quantity | Starting quantity for this price tier |
| Max Quantity | Upper limit for this price tier |
| Unit Price | Unit price for this quantity range |
| Discount Rate | Volume discount percentage |


![03-products-orders-2026-04-07-01-18-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-51.png)

When creating a quotation, the system automatically matches the tiered pricing based on the quantity after you select a product.

![03-products-orders-2026-04-07-01-19-39](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-19-39.png)

### Category Management

The second tab is a tree table for product categories, supporting multi-level nested categories. Click "Add Subcategory" to create a subcategory under the current node.

![03-products-orders-2026-04-07-01-20-19](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-20-19.png)

---

## Quotations

Quotations are typically created from the opportunity detail view (see the "Create Quotation" section in [Opportunities & Quotations](./guide-opportunities)). This section covers quotation line items and the approval workflow in more detail.

### Line Items

When you select a product in the quotation's line item sub-table, several fields are auto-populated:

| Field | Description |
|-------|-------------|
| **Product** | Select from the product catalog |
| **Specification** | Read-only, auto-populated after product selection |
| **Unit** | Read-only, auto-populated |
| **Quantity** | Enter manually |
| **List Price** | Read-only, from the product catalog |
| **Unit Price** | Read-only, auto-matched from tiered pricing based on quantity |
| **Discount Rate** | Read-only, from tiered pricing |
| **Line Amount** | Auto-calculated |

![03-products-orders-2026-04-07-01-22-22](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-22-22.gif)

The system automatically calculates the full amount chain: Subtotal → Discount → Tax → Shipping → Total Amount → USD Equivalent.

![03-products-orders-2026-04-07-01-23-13](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-23-13.gif)

### Multi-Currency Support

If a customer transacts in a non-USD currency, select the corresponding currency. The system **locks the current exchange rate** at the time of creation and automatically converts to a USD equivalent. Exchange rates are maintained on the **Settings → Exchange Rates** page.

### Approval

Quotations require approval after creation. Once approved, a new order can be created.

---

## Order Management

Navigate to the **Orders** page from the top menu. You can also create an order directly from an approved quotation by clicking "New Order" in the opportunity detail view.

### Order List

Filter buttons are available at the top of the page:

| Button | Meaning |
|--------|---------|
| **All** | All orders |
| **Processing** | Orders currently being fulfilled |
| **Pending Payment** | Awaiting customer payment |
| **Shipped** | Shipped, awaiting delivery confirmation |
| **Completed** | Process finished |

![03-products-orders-2026-04-07-01-25-09](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-09.png)

### Order Progress Column

The "Order Progress" column in the table displays the current status as a visual dot-line progress bar:

```
Pending Confirmation → Confirmed → Processing → Shipped → Completed
```

Completed steps are highlighted; steps not yet reached are grayed out.

### Summary Row

Summary information at the bottom of the table:

- **Selected / Total order amount**
- **Payment status distribution** (shown as tags)
- **Order status distribution** (shown as tags)

![03-products-orders-2026-04-07-01-25-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-51.png)

### Creating an Order

**From quotation to order (recommended)**: In the opportunity detail view, quotations with Approved status display a "New Order" button. Clicking it automatically carries over the customer, line items, amounts, currency, exchange rate, and other information.

![03-products-orders-2026-04-07-01-27-16](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-16.png)

**Manual creation**: Click "New" on the order list page and fill in the customer, line items, order amount, and payment terms.

### Order Status Progression

Click an order to open the detail popup. An interactive status flow is displayed at the top; click the next status node to advance. Every status change is recorded by the system.

![03-products-orders-2026-04-07-01-27-50](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-50.png)

### Payment Tracking

Order status and payment status run on two independent tracks:

- **Order status**: Confirmed → Processing → Shipped → Completed (fulfillment flow)
- **Payment status**: Pending → Partial Payment → Paid (collection flow)

Currently, the CRM focuses on the front-end sales process and does not enforce conditional restrictions on order status. These statuses serve as records only. If needed, you can use linkage rules or data table events for enforcement.

---

After an order is completed, the full sales cycle is closed. Next, learn about managing [Customers, Contacts & Emails](./guide-customers-emails).

## Related Pages

- [CRM User Guide](./)
- [Opportunity Management](./guide-opportunities) — Quotations from the opportunity perspective
- [Customers, Contacts & Emails](./guide-customers-emails)
- [Dashboard](./guide-overview) — Order data drill-through
