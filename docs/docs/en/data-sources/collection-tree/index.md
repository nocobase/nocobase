---
pkg: "@nocobase/plugin-collection-tree"
title: "Tree collection"
description: "Use a Tree collection for hierarchical data such as organizational structures, product categories, regional hierarchies, and department directories. It uses the adjacency-list model to store parent-child relationships."
keywords: "Tree collection,tree collection,adjacency list,hierarchical data,NocoBase"
---

# Tree collection

## Introduction

Tree collections are suitable for data with parent-child relationships, such as organizational structures, product categories, regional hierarchies, department directories, and knowledge-base directories. A Tree collection uses the adjacency-list model to store parent-child relationships, and each record can point to its own parent node.

You can create Tree collections only from the main data source. External databases, REST API data sources, and External NocoBase data sources do not support creating Tree collections.

## Use cases

Tree collections are suitable for these business scenarios:

- Company organizational structures and department hierarchies
- Product categories, knowledge-base directories, and document directories
- Province, city, and district hierarchies; sales territories; and service-outlet hierarchies
- BOM categories, equipment categories, and asset categories

## Create and configure

In the main data source, click **Create collection** and select **Tree collection** to create a Tree collection.

![Create a Tree collection](https://static-docs.nocobase.com/20240324143228.png)

The creation settings for a Tree collection are mostly the same as those for a general collection.

| Setting | Description |
| --- | --- |
| Collection display name | The name displayed for the collection, such as `Organization`, `Product categories`, or `Regional hierarchy`. |
| Collection name | The collection identifier used internally by APIs, relation fields, permissions, and workflows. |
| Inherits | Select a parent collection to inherit. This setting is visible only when the main database is PostgreSQL. |
| Categories | Collection categories affect only organization in Data source management; they do not change the collection structure. |
| Description | A description of the collection. State which hierarchy data it stores, who maintains it, and which page filters use it. |
| Preset fields | Preset fields. Keep system fields and Tree collection built-in fields when creating a Tree collection. |

### Built-in fields

After a Tree collection is created, it usually includes the following built-in fields. `parentId`, `parent`, and `children` store the hierarchy.

| Field | Field name | Description |
| --- | --- | --- |
| ID | `id` | The default primary key that uniquely identifies a record. |
| Created at | `createdAt` | Automatically records when the record was created. |
| Created by | `createdBy` | Automatically records the user who created the record. |
| Updated at | `updatedAt` | Automatically records when the record was last updated. |
| Updated by | `updatedBy` | Automatically records the user who last updated the record. |
| Parent ID | `parentId` | Stores the parent-node ID. It is usually empty for root nodes. |
| Parent | `parent` | A many-to-one relation field that points to a parent node in the current collection. |
| Children | `children` | A one-to-many relation field representing child nodes of the current node. |
| Space | `space` | Available after enabling the [Multi-space plugin](../../multi-app/multi-space/index.md). It isolates data by space and does not appear when Multi-space is not enabled. |

![Tree collection built-in fields](https://static-docs.nocobase.com/20240324143555.png)

:::warning Note

Avoid circular relationships in Tree collection data. For example, do not make B the parent of A and A the parent of B. Circular relationships cause incorrect tree displays and filter results.

:::

### Primary key field

Like a general collection, a Tree collection needs a primary key. Tree relation fields use the parent-node ID to relate to the primary-key record in the same collection.

If a Tree collection has no primary key, set **Record unique key** when editing the collection. Otherwise, blocks might not view or edit records correctly, and tree displays might not locate nodes reliably.

## Use in pages

A Tree collection can use most of the data blocks for a [general collection](../data-source-main/general-collection.md) to create, read, update, and delete records. It can also work with tree-specific features:

| Block | Use |
| --- | --- |
| [Table block](../../interface-builder/blocks/data-blocks/table.md#enable-tree-table) | Displays hierarchical records for viewing and maintaining parent-child structures. |
| [Form block](../../interface-builder/blocks/data-blocks/form.md) | Creates or edits one Tree node record. |
| [Details block](../../interface-builder/blocks/data-blocks/details.md) | Views details of one Tree node. |
| [Tree Filter block](../../interface-builder/blocks/filter-blocks/tree.md) | Filters other data blocks with a tree structure. It is commonly used for category, organization, regional, and other hierarchical filters. |

## Edit configuration

In the collection list, click **Edit** next to a Tree collection to change its display name, category, description, simple pagination mode, **Record unique key**, and other settings.

Do not delete Tree collection parent-child relation fields or repurpose them casually. To adjust the hierarchy, update parent-node relations in the record data first.

## Delete a collection

In the collection list, click **Delete** next to a Tree collection to delete it.

Deleting a Tree collection deletes its collection metadata, actual database table, and hierarchy data. Before deleting it, confirm whether page blocks, Tree Filter blocks, relation fields, permissions, workflows, or APIs still depend on it.

:::danger Warning

Tree collections are often used as filter conditions for other blocks. After deleting a Tree collection, related Tree Filter blocks and page configurations that depend on its category hierarchy might stop working.

:::

## Related links

- [General collection](../data-source-main/general-collection.md) - General configuration and block usage.
- [Table block](../../interface-builder/blocks/data-blocks/table.md) - Enable Tree collection display in a table.
- [Tree Filter block](../../interface-builder/blocks/filter-blocks/tree.md) - Filter data with a tree structure.
- [Multi-space](../../multi-app/multi-space/index.md) - Learn about the Space field and data isolation by space.
