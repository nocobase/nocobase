---
title: "Multiple select"
description: "The Multiple select field stores multiple values from a fixed option set, such as tags and applicable scenarios."
keywords: "Multiple select,multipleSelect,field,Field interface,NocoBase"
---

# Multiple select

## Introduction

In NocoBase, the **Multiple select** field stores multiple selected option values.

It is suitable for customer tags, applicable scenarios, issue categories, and other values where a record can have more than one option. Use Select when only one option is allowed.

## Use cases

Multiple select fields are suitable for these business scenarios:

- Customer tags
- Applicable scenarios
- Issue categories
- Multiple business labels

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Multiple select** to create this field.

![Configure a Multiple select field](https://static-docs.nocobase.com/20240512180236.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Multiple select uses `multipleSelect`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Customer tags`, `Applicable scenarios`, or `Issue categories`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Multiple select uses `array` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports required validation and configured option ranges. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Multiple select field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `multipleSelect`. |
| Default Field type | `array`. |
| Available Field types | `array`, `json`. |
| Page component | Uses a multi-select component in edit mode. |
| Filtering | Supports option filters for selected values and empty values. |
| Sorting | Supports sorting in Table blocks where supported by the data source. |
| Validation | Supports required validation and configured option ranges. |

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

Click **Delete** beside a Multiple select field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Multiple select field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Multiple select fields are suitable for tags, labels, and multi-choice business data.

![Use a Multiple select field in a page](https://static-docs.nocobase.com/20260709230017.png)


| Scenario | Use |
| --- | --- |
| Form block | Select multiple options. |
| Table block | Display and filter selected options. |
| Details block | Display selected option values. |
| Workflows and permissions | Use selected values in business conditions. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
