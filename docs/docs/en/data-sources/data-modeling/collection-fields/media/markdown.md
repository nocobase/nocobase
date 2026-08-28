---
title: "Markdown"
description: "The Markdown field stores Markdown-formatted content such as documentation, processing plans, and knowledge-base articles."
keywords: "Markdown,markdown,field,Field interface,NocoBase"
---

# Markdown

## Introduction

In NocoBase, **Markdown** stores Markdown-formatted content.

It is suitable for documentation, processing plans, knowledge-base content, and change records. It stores text and renders it as Markdown in pages. For a WYSIWYG editing experience, use Rich text or Markdown Vditor.

## Use cases

Markdown fields are suitable for these business scenarios:

- Documentation
- Processing plans
- Knowledge-base content
- Change records

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Markdown** to create this field.

![Configure a Markdown field](https://static-docs.nocobase.com/20240512172236.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Markdown uses `markdown`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Documentation`, `Processing plan`, or `Body`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Markdown uses `text` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports length and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Markdown field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `markdown`. |
| Default Field type | `text`. |
| Available Field types | `text`. |
| Page component | Uses a Markdown editor or text input in edit mode and renders Markdown in read mode. |
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

Click **Delete** beside a Markdown field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Markdown field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Markdown fields are suitable for formatted textual content in forms and details.

![Use a Markdown field in a page](https://static-docs.nocobase.com/20260710152021.png)


| Scenario | Use |
| --- | --- |
| Form block | Enter or edit Markdown content. |
| Details block | Render Markdown content. |
| Table block | Display a shortened Markdown value. |
| Workflows and APIs | Pass Markdown text to business logic. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
- [Rich text](./rich-text.md) - Store WYSIWYG formatted content.
- [Markdown Vditor](../../../field-markdown-vditor/index.md) - Use a Vditor Markdown editor.
