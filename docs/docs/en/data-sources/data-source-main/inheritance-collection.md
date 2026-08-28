---
pkg: "@nocobase/plugin-data-source-main"
title: "Inheritance collection"
description: "Create child collections from a parent collection. Child collections inherit parent fields and can define their own fields; this is supported only by a PostgreSQL main database."
keywords: "Inheritance collection,table inheritance,PostgreSQL,NocoBase"
---

# Inheritance collection

## Introduction

An **Inheritance collection** extends a general collection. Use it when several collections share stable common fields while each child collection also needs its own fields.

For example, create an **Assets** parent collection with asset number, asset name, purchase date, and owner. Then derive **Computer assets**, **Vehicle assets**, and **Office furniture** child collections. Each child inherits the parent fields and can add its own fields.

:::warning Note

Inheritance collections can be created only when the main database is PostgreSQL. Other main databases, external databases, REST API data sources, and external NocoBase data sources do not support them.

:::

## Use cases

- Derive Computer assets, Vehicle assets, and Office furniture from an Assets parent collection.
- Derive Employees, Contractors, and Visitors from a People parent collection.
- Derive Tasks, Defects, and Requirements from an Items parent collection.
- Derive Purchase, Sales, and Service contracts from a Contracts parent collection.

Use inheritance when the objects have stable shared fields and differ mainly in a small set of dedicated fields.

## Create and configure

In the main data source, click **Create collection** and choose a general-collection or inheritance-enabled entry. Select the parent collection in `Inherits`.

![Create an inheritance collection](https://static-docs.nocobase.com/20240324085907.png)

| Setting | Description |
| --- | --- |
| Collection display name | The name displayed in the interface, such as Computer assets, Vehicle assets, or Office furniture. |
| Collection name | The internal identifier used by APIs, relation fields, permissions, and workflows. |
| Inherits | The parent collection. The child inherits its field structure and can define additional fields. |
| Categories | Organizes collections in the management interface without changing their schema. |
| Description | Document what the child collection stores, which parent it derives from, and who maintains it. |
| Preset fields | Usually keeps ID, created-at, created-by, updated-at, and updated-by fields. |

Inheritance collections use the same blocks and field configuration as [General collections](./general-collection.md). In page blocks, they are normal collections that support record creation, reading, updating, and deletion.

:::warning Note

Use inheritance only for highly similar business objects. If objects have substantially different workflows, permissions, and pages, separate general collections connected by relation fields are usually clearer.

:::

### Built-in fields

An inheritance collection inherits fields from its parent and can add fields of its own.

| Field source | Description |
| --- | --- |
| Parent fields | Shared fields inherited by the child, such as asset number, asset name, and owner. |
| Child fields | Dedicated child fields, such as CPU model for a computer asset or license plate for a vehicle asset. |
| System fields | When `Preset fields` are retained, ID, created-at, created-by, updated-at, and updated-by fields are included. |

:::warning Note

Parent fields affect every child that inherits them. Before changing a parent field, check whether child pages, permissions, workflows, and APIs depend on it.

:::

### Primary key field

Inheritance collections require a primary key just as general collections do. Keep the ID preset field when creating the collection; its default primary-key interface is `Snowflake ID (53-bit)`.

If an imported or synchronized inheritance collection has no primary key, set a **Record unique key** when editing the collection. Otherwise page blocks might not view or edit records correctly.

## Use in pages

Inheritance collections can use most blocks supported by general collections. A common approach is to configure each child collection as its own table, form, details, or Kanban block.

| Block | Use |
| --- | --- |
| [Table](../../interface-builder/blocks/data-blocks/table.md) | View, filter, sort, and batch-process child records. |
| [Form](../../interface-builder/blocks/data-blocks/form.md) | Create or edit one child record. |
| [Details](../../interface-builder/blocks/data-blocks/details.md) | View one child record in detail. |
| [Kanban](../../interface-builder/blocks/data-blocks/kanban.md) | Group child records by status, stage, owner, or another field. |

## Edit configuration

Click **Edit** beside an inheritance collection to change its display name, category, description, simple-pagination mode, and Record unique key.

Do not change inheritance relationships frequently after business configuration is in use. Page blocks, relation fields, permissions, and workflows can depend on the current field structure.

## Delete a collection

Click **Delete** beside an inheritance collection to delete it.

Deleting an inheritance collection removes the child collection metadata and the real child table in the main database. Before deleting it, confirm that no page blocks, relation fields, permissions, workflows, or APIs still use the child collection.

:::danger Warning

Deleting a child collection does not automatically mean deleting its parent. Whether dependent objects are deleted depends on the option in the confirmation dialog. Confirm that the parent and other child collections should remain before continuing.

:::

## Related links

- [General collection](./general-collection.md) - General collection configuration.
- [Main database](./index.md) - Supported main database types.
- [Collection fields](../data-modeling/collection-fields/index.md) - Field configuration.
