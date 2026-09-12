---
title: "Fields"
description: "Learn the purpose of NocoBase fields, how to create and manage them, field-type use cases, creating fields from pages, and field mapping for main and external data sources."
keywords: "field,Field type,Field interface,field mapping,title field,unique constraint,relation field,NocoBase"
---

# Fields

## Introduction

In NocoBase, a **Field** is a business attribute in a [Collection](../collection.md). It describes the information that can be stored in a record and how that information is entered, displayed, filtered, and used in business logic.

| Definition | Description |
| --- | --- |
| Data it stores | For example, text, numbers, dates, files, statuses, relations, or JSON. |
| How pages use it | For example, Input, DatePicker, Select, attachment upload, or a relation selector for data entry and display. |
| How it participates in business capabilities | Fields are used by blocks, filters, sorting, permissions, workflows, APIs, and data import and export. |

A Field can correspond to:

- An actual database column in the main database
- An existing database column in an external database
- A field in a database view
- A field returned by an SQL query
- A field in a REST API response
- A relation field, system field, or virtual field in a collection

Think of a Field as one attribute of a business object. For example:

| Business object | Fields |
| --- | --- |
| Customer | Customer name, mobile number, customer level, and owner |
| Order | Order number, order amount, order status, and customer |
| Contract | Contract name, signing date, contract attachments, and approval status |
| Task | Task title, due date, priority, and assignee |
| File | File name, size, MIME type, and URL |

## Use cases

The following field categories help you decide which kind of field to choose. Open the relevant field documentation for configuration, type mapping, and cautions.

| Field category | Use cases |
| --- | --- |
| [Text fields](./basic/input.md) | Store names, numbers, descriptions, contact information, links, and similar content. |
| [Rich text fields](./media/rich-text.md) | Store longer content such as article bodies, documentation, processing plans, and code snippets. |
| [Number fields](./basic/number.md) | Store quantities, amounts, scores, percentages, and other numerical values. |
| [Date and time fields](./datetime/index.md) | Store timestamps, dates, times, and timestamps from external systems. |
| [Status and option fields](./choices/select.md) | Store values from a fixed range, such as enabled state, order status, customer level, and customer tags. |
| [Attachment fields](./media/field-attachment.md) | Upload files or store external-file addresses. |
| [Relation fields](./associations/index.md) | Express connections between collections, such as an order belonging to a customer, a customer having orders, or a user being related to roles. |
| [Identifier and code fields](./advanced/uuid.md) | Store internal primary keys, synchronized external IDs, public-access identifiers, and business codes. |
| [Geometric fields](./geometric/point.md) | Store spatial or geographic information, such as store locations, delivery routes, and service areas. |
| [System fields](./system-info/created-at.md) | Store system information maintained by NocoBase or the database, such as IDs, creation time, creator, and update time. |
| [Other fields](./advanced/json.md) | Handle field needs that do not directly belong to other categories, such as sorting, formulas, and JSON. |

## Field interface types

NocoBase groups fields into the following categories from the Field interface perspective:

![Field interface types](https://static-docs.nocobase.com/20240512110352.png)

## Field data types

Each Field interface has a default data type. For example, a field with the Number interface uses `double` by default, but it can also use `float`, `decimal`, and other data types. The currently supported data types are:

![Field data types](https://static-docs.nocobase.com/20240512103733.png)

## Field type mapping

The process for adding a field to a main data source is:

1. Select a Field interface type.
2. Configure a data type available for the selected interface.

![Create a field in a main data source](https://static-docs.nocobase.com/20240512172416.png)

The field-mapping process for an external data source is:

1. Map the external database column type automatically to the corresponding Field type and UI type (Field interface).
2. Change to a more suitable data type and interface type when needed.

![Map a field from an external data source](https://static-docs.nocobase.com/20240512172759.png)
