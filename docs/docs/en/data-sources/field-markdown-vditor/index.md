---
title: "Markdown Vditor"
description: "The Markdown Vditor field uses the Vditor editor to edit Markdown content."
keywords: "Markdown Vditor,vditor,field,Field interface,NocoBase"
---

# Markdown Vditor

## Introduction

In NocoBase, **Markdown Vditor** uses the Vditor editor to edit Markdown content.

It is suitable for content needing a fuller Markdown editing experience, such as comment bodies, knowledge-base content, and proposal descriptions. Use Markdown for simple editing or Rich text for a WYSIWYG experience.

## Use cases

Markdown Vditor fields are suitable for these business scenarios:

- Comment bodies
- Knowledge-base content
- Proposal descriptions
- Long Markdown documents

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Markdown Vditor** to create this field.

![Configure a Markdown Vditor field](https://static-docs.nocobase.com/20240512180647.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Markdown Vditor uses `vditor`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Comment content`, `Knowledge-base body`, or `Proposal description`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Markdown Vditor uses `text` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports length and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Markdown Vditor field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `vditor`. |
| Default Field type | `text`. |
| Available Field types | `text`. |
| Page component | Uses the Vditor Markdown editor in edit mode. |
| Filtering | Supports text filters where supported by the data source. |
| Sorting | Supports sorting in Table blocks where supported by the data source. |
| Validation | Supports length and required validation. |

## Edit configuration

After creation, click **Edit** beside the field to edit its configuration. Edit fields to adjust how they are displayed and used in NocoBase, such as the display name, description, default value, validation rules, or field-specific settings.

When a field comes from a synchronized main-database table, editing usually maps the database field to a NocoBase Field type and Field interface.

| Setting | Can be edited | Description |
| --- | --- | --- |
| Field display name | Yes | Changes the name displayed in the interface without changing the field identifier. |
| Field name | No | The field identifier normally cannot be changed in the edit form after creation. |
| Field interface | Conditional | Main-database fields and synchronized fields can be adjusted during field mapping. Changes affect page input, display, and validation. |
| Field type | Conditional | Main-database fields and synchronized fields can be adjusted during field mapping. Confirm that existing values can be used by the new type first. |
| Default value | Yes | Adjusts the default value for new records. |
| Validation rules | Yes | Adjusts field validation rules. |
| Description | Yes | Adds the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Changing a Field type or Field interface is more than changing a display name. It affects field storage, input components, validation rules, filters, and workflow-variable usage. When the field contains substantial existing data, confirm that its data format is compatible first.

:::

## Delete field

Click **Delete** beside a Markdown Vditor field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Markdown Vditor field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Markdown Vditor fields are suitable for advanced Markdown editing in forms and details.

![Use a Markdown Vditor field in a page](https://static-docs.nocobase.com/20260709230930.png)


| Scenario | Use |
| --- | --- |
| Form block | Edit Markdown content with Vditor. |
| Details block | Render Markdown content. |
| Table block | Display a shortened content value. |
| Workflows and APIs | Pass Markdown text to business logic. |

## Related links

- [Fields](../data-modeling/collection-fields/index.md) - Learn about field categories and mapping.
- [General collection](../data-source-main/general-collection.md) - Create and manage fields in a collection.
- [Markdown](../data-modeling/collection-fields/media/markdown.md) - Store simple Markdown content.
- [Rich text](../data-modeling/collection-fields/media/rich-text.md) - Store WYSIWYG content.
