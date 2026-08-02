---
pkg: "@nocobase/plugin-comments"
title: "Comment collection"
description: "A Comment collection stores comments, replies, and feedback for business records. It supports rich-text content, user tracking, multi-level comments, and Comment blocks."
keywords: "Comment collection,comments,rich text comments,multi-level comments,Collection Comment,NocoBase"
---

# Comment collection

## Introduction

Comment collections are suitable for storing discussions, feedback, and annotations around business records. For example, you can use a Comment collection for task comments, approval opinions, article comments, and customer feedback.

A Comment collection is usually not used as an independent main business collection. A more common approach is to create a Comment collection, configure a relation field in the business collection, and then add a Comment block to the details page or popup for business records.

![Comment collection workflow](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Use cases

Comment collections are suitable for these business scenarios:

- Collaboration discussions on tasks, requirements, and defects
- Processing opinions on approval forms, work orders, and contracts
- Comments on articles, knowledge bases, and announcements
- Customer feedback, after-sales follow-up, and internal notes

## Usage flow

Comment collections are typically used together with a business collection and a Comment block:

1. Create a Comment collection to store comment content, reply relations, creators, creation time, and other information.
2. Create a relation field in the business collection and relate it to the Comment collection. For example, relate a `Task comments` collection to the `Tasks` collection.
3. Add a Comment block to a details page or popup for the business collection.
4. When users post or reply in the Comment block, comment data is written to the Comment collection and related to the current business record.
5. Configure Comment collection permissions as needed to control who can view, create, or delete comments.

## Create and configure

In the main data source, click **Create collection** and select **Comment collection** to create a Comment collection.

![Create a Comment collection](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

| Setting | Description |
| --- | --- |
| Collection display name | The name displayed for the collection, such as `Task comments`, `Approval opinions`, or `Article comments`. |
| Collection name | The collection identifier used internally by APIs, relation fields, permissions, and workflows. |
| Inherits | Select a parent collection to inherit. This setting is visible only when the main database is PostgreSQL. |
| Categories | Collection categories affect only organization in Data source management; they do not change the collection structure. |
| Description | A description of the collection. State which business object it serves, who maintains it, and how comment permissions are designed. |
| Preset fields | Preset fields. Keep system fields and Comment collection built-in fields when creating a Comment collection. |

### Built-in fields

After a Comment collection is created, it usually includes the following built-in fields. Comment blocks mainly use `content`, `createdBy`, and `createdAt` to display comment text, commenter, and comment time.

| Field | Field name | Description |
| --- | --- | --- |
| ID | `id` | The default primary key that uniquely identifies a comment record. |
| Comment content | `content` | Stores the comment text entered by users. It uses the Markdown Vditor interface by default. |
| Created at | `createdAt` | Automatically records when the comment was created. Comment blocks use it to display the comment time. |
| Created by | `createdBy` | Automatically records the user who posted the comment. Comment blocks use it to display the commenter. |
| Updated at | `updatedAt` | Automatically records when the comment was last updated. |
| Updated by | `updatedBy` | Automatically records the user who last updated the comment. |
| Space | `space` | Available after enabling the [Multi-space plugin](../../multi-app/multi-space/index.md). It isolates data by space and does not appear when Multi-space is not enabled. |

:::warning Note

Comment collection built-in fields are normally maintained by Comment blocks and should not be deleted or repurposed casually. To store information such as comment category or processing status, add business fields instead.

:::

### Primary key field

Like a general collection, a Comment collection needs a primary key. Comment blocks use the primary key to locate comment records and reply relationships.

If a Comment collection has no primary key, set **Record unique key** when editing the collection. Otherwise, Comment blocks might not view, reply to, or delete comments correctly.

## Create a relation

Create a relation field in the business collection and relate it to the Comment collection.

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

## Use in pages

Comment collections are usually used through Comment blocks. Add a Comment block to a details page, popup, or record page of a business collection to let users comment on the current record.

![Enable the Comments collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

| Configuration location | Use |
| --- | --- |
| [Details block](../../interface-builder/blocks/data-blocks/details.md) | Shows a comment entry in business-record details. |
| [Form block](../../interface-builder/blocks/data-blocks/form.md) | Uses the comment relation field in business-collection editing flows. |
| Comment block | Displays the comment list and lets users post and reply to comments. |

## Edit configuration

In the collection list, click **Edit** next to a Comment collection to change its display name, category, description, simple pagination mode, **Record unique key**, and other settings.

After a Comment collection is in use, do not casually change its comment-content field or reply-relation field. Comment blocks, permissions, workflows, and APIs might depend on these fields.

## Delete a collection

In the collection list, click **Delete** next to a Comment collection to delete it.

Deleting a Comment collection deletes comment records, reply relations, and related collection metadata. Before deleting it, confirm whether relation fields in business collections, Comment blocks, permissions, workflows, or APIs still depend on it.

:::danger Warning

Deleting a Comment collection removes comment data from existing business records. Comments often contain collaboration history and processing opinions. Confirm whether the data needs to be backed up or archived before proceeding.

:::

## Related links

- [General collection](../data-source-main/general-collection.md) - General configuration and block usage.
- [Relation fields](../data-modeling/collection-fields/associations/index.md) - Learn how business collections relate to Comment collections.
- [Comments plugin](../../plugins/@nocobase/plugin-comments/index.md) - Learn about Comment blocks and commenting capabilities.
- [Multi-space](../../multi-app/multi-space/index.md) - Learn about the Space field and data isolation by space.
