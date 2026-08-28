---
title: "Textarea"
description: "The Textarea field stores longer plain-text content such as notes, opinions, and detailed addresses."
keywords: "Textarea,textarea,field,Field interface,NocoBase"
---

# Textarea

## Introduction

In NocoBase, the **Textarea** field stores multi-line text.

It is suitable for customer notes, processing opinions, detailed addresses, and other text that might span multiple lines. Use Input for short text and Rich text or Markdown for formatted content.

## Use cases

Textarea fields are suitable for these business scenarios:

- Customer notes and internal remarks
- Processing opinions and descriptions
- Detailed addresses and supplementary information
- Long plain-text content

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Textarea** to create this field.

![Configure a Textarea field](https://static-docs.nocobase.com/20240512165017.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Textarea uses `textarea`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Customer notes`, `Processing opinion`, or `Detailed address`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Textarea uses `text` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports minimum length, maximum length, fixed length, case, regular-expression, and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Textarea field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `textarea`. |
| Default Field type | `text`. |
| Available Field types | `text`, `string`, `json`. |
| Page component | Uses a multi-line textarea in edit mode. |
| Filtering | Supports text filters such as contains, equals, is empty, and is not empty. |
| Sorting | Supports sorting in Table blocks where supported by the data source. |
| Validation | Supports minimum length, maximum length, fixed length, case, regular-expression, and required validation. |

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

Click **Delete** beside a Textarea field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Textarea field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Textarea fields are suitable for forms, details, and long plain-text content.

![Use a Textarea field in a page](https://static-docs.nocobase.com/20260709224428.png)


| Scenario | Use |
| --- | --- |
| Form block | Enter or edit multi-line text. |
| Details block | Display long plain-text content. |
| Table block | Display a shortened value in lists. |
| Workflows and permissions | Use the value in text conditions and business rules. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
- [Input](./input.md) - Store short text.
- [Rich text](../media/rich-text.md) - Store formatted content.
