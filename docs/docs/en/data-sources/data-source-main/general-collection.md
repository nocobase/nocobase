---
pkg: "@nocobase/plugin-data-source-main"
title: "General collection"
description: "Use a General collection for common business data such as customers, orders, contracts, work orders, projects, and tasks."
keywords: "General collection,system fields,collection,NocoBase"
---

# General collection

## Introduction

A **General collection** is the most common collection type. Use it for customers, orders, contracts, work orders, expense claims, projects, tasks, and other business records that do not need a special structure.

General collections can come from a new table created in the main database, an existing main-database table synchronized into NocoBase, an external-database table, a resource mapped from a REST API, or a collection in an external NocoBase application.

All of these are used as general collections in NocoBase. The difference is that NocoBase can create and maintain the real table structure for a main-database collection, while an external source normally exposes an existing structure maintained by the external system.

## Use cases

- CRM data such as customers, contacts, opportunities, and contracts.
- Transaction data such as orders, deliveries, returns, and invoices.
- Collaboration data such as work orders, tasks, projects, and requirements.
- Process data such as expense claims, purchase orders, and payment requests.
- Master data such as equipment, assets, products, and stores.

## Create and configure

In the main data source, click **Create collection** and select **General collection**.

![Create a general collection](https://static-docs.nocobase.com/20240324085739.png)

| Setting | Description |
| --- | --- |
| Collection display name | The name displayed in the interface, such as Customers, Orders, or Contract attachments. Use a name business users can understand. |
| Collection name | The internal identifier used by APIs, relation fields, permissions, and workflows. It is generated automatically but can be changed before creation. It supports letters, numbers, and underscores and must start with a letter. |
| Categories | Organizes collections in data-source management without changing the collection structure. Use business modules such as Customer management, Projects, or Finance when many collections exist. |
| Description | Document what the collection stores, who maintains it, and the related business processes. |
| Use simple pagination mode | Skips total-record counting when table blocks paginate. Use it for very large collections to reduce query pressure. |
| Preset fields | Adds common fields such as ID, created at, created by, updated at, and last updated by. Keep them for normal business collections. |

### Built-in fields

Use `Preset fields` to add common system fields when creating the collection.

| Field | Field name | Description |
| --- | --- | --- |
| ID | `id` | The default primary key that uniquely identifies a record. Its default primary-key interface is `Snowflake ID (53-bit)`. |
| Created at | `createdAt` | Records when a record was created. Use it for sorting, filtering, auditing, and workflow conditions. |
| Created by | `createdBy` | Records the user who created the record. Use it for creator filtering, permissions, and ownership tracking. |
| Updated at | `updatedAt` | Records when the record was last updated. |
| Last updated by | `updatedBy` | Records the user who last updated the record. |
| [Space](../../multi-app/multi-space/index.md) | `space` | Available when the multi-space plugin is enabled. It isolates data by space and is not shown in preset fields otherwise. |

### Primary key field

**Primary key** identifies a record uniquely at the database level. Keep the ID preset field when creating a collection; its default primary-key interface is `Snowflake ID (53-bit)`.

![Primary key field](https://static-docs.nocobase.com/20251209210153.png)

Hover over the ID field interface to select another primary-key type.

![Select a primary-key interface](https://static-docs.nocobase.com/20251209210517.png)

Available primary-key types are [Single line text](../data-modeling/collection-fields/basic/input.md), [Integer](../data-modeling/collection-fields/basic/integer.md), [Snowflake ID (53-bit)](../data-modeling/collection-fields/advanced/snowflake-id.md), [UUID](../data-modeling/collection-fields/advanced/uuid.md), and [Nano ID](../data-modeling/collection-fields/advanced/nano-id.md).

:::warning Note

A collection without a primary key must set a **Record unique key** when editing the collection. Otherwise, blocks cannot be created and records cannot be viewed or edited reliably.

:::

## Use in pages

General collections can be used by most data and filter blocks.

| Block | Use |
| --- | --- |
| [Table](../../interface-builder/blocks/data-blocks/table.md) | View, filter, sort, and batch-process records. |
| [Form](../../interface-builder/blocks/data-blocks/form.md) | Create or edit one record. |
| [Details](../../interface-builder/blocks/data-blocks/details.md) | View one record in detail. |
| [List](../../interface-builder/blocks/data-blocks/list.md) | Display records as a list. |
| [Grid card](../../interface-builder/blocks/data-blocks/grid-card.md) | Display images, files, products, assets, and other records as cards. |
| [Kanban](../../interface-builder/blocks/data-blocks/kanban.md) | Group records by status, stage, owner, or another field. |
| [Calendar](../../interface-builder/blocks/data-blocks/calendar.md) | Display records by date or time range. |
| [Chart](../../interface-builder/blocks/data-blocks/chart.md) | Create statistics charts from records. |
| [Map](../../interface-builder/blocks/data-blocks/map.md) | Display records by geographic location. |
| [Gantt](../../plugins/@nocobase/plugin-gantt/index.md) | Display project plans and task schedules by start and end time. |
| [Form filter](../../interface-builder/blocks/filter-blocks/form.md) | Filter data blocks with form conditions. |
| [Tree filter](../../interface-builder/blocks/filter-blocks/tree.md) | Filter data blocks by hierarchy, such as category, organization, or region. |

## Edit configuration

Click **Edit** beside the collection to change collection metadata and selected runtime configuration. Use **Configure fields** to add fields, change Field types or interfaces, or delete fields.

![Edit a collection](https://static-docs.nocobase.com/edit_collection.png)

![Edit collection configuration](https://static-docs.nocobase.com/edit_collection_configure.png)

| Setting | Can be edited | Description |
| --- | --- | --- |
| Collection display name | Yes | Changes only the name displayed in the interface. |
| Collection name | No | The internal identifier cannot be changed after creation. |
| Inherits | Conditional | Available only when the main database is PostgreSQL and the setting is displayed. Check fields, blocks, permissions, and workflows before changing inheritance for an existing collection. |
| Categories | Yes | Organizes the management interface without changing the schema. |
| Description | Yes | Document the collection purpose, maintainer, source, and related processes. |
| Use simple pagination mode | Yes | Skips total-count queries in table blocks. |
| Record unique key | Yes | Locates records in blocks. It normally uses a primary key or unique field. |

:::warning Note

Editing a collection does not adjust existing fields automatically. `Preset fields` apply only at creation. Add created-at, created-by, updated-at, or updated-by fields later through **Configure fields**.

:::

## Delete a collection

Click **Delete** beside a general collection to delete it. Main-database collections can also be selected and deleted in batches.

![Delete a collection](https://static-docs.nocobase.com/delete_collection.png)

After confirmation, NocoBase removes the collection metadata and the real table and data in the main database.

![Delete confirmation](https://static-docs.nocobase.com/delete_collection_second_confirmation.png)

The confirmation dialog can automatically delete database objects that depend on the collection, such as database views built from it and objects that depend on those views.

:::danger Warning

Deleting a general collection is high risk. It can remove the table structure, table data, field metadata, and dependent page blocks, relation fields, permissions, workflows, and API calls. Confirm that dependent objects can be deleted before enabling automatic deletion.

:::
