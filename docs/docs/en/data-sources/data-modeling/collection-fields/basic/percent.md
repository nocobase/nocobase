---
title: "Percent"
description: "The Percent field stores percentage values such as completion, discount, and conversion rates."
keywords: "Percent,percent,field,Field interface,NocoBase"
---

# Percent

## Introduction

In NocoBase, the **Percent** field stores percentage values.

It is suitable for completion rates, discount rates, conversion rates, and other ratios. Use Number when the business value is not a percentage.

## Use cases

Percent fields are suitable for these business scenarios:

- Task completion rates
- Discount and tax rates
- Conversion and pass rates
- Progress and utilization rates

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Percent** to create this field.

![Configure a Percent field](https://static-docs.nocobase.com/20240512175847.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Percent uses `percent`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Completion rate`, `Discount rate`, or `Conversion rate`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Percent uses `double` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports minimum, maximum, and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Percent field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `percent`. |
| Default Field type | `double`. |
| Available Field types | `double`, `decimal`. |
| Page component | Uses a percentage-aware number input in edit mode. |
| Filtering | Supports numerical filters such as greater than, less than, equals, and is empty. |
| Sorting | Supports sorting in Table blocks. |
| Validation | Supports minimum, maximum, and required validation. |

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

Click **Delete** beside a Percent field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Percent field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Percent fields are suitable for percentage entry, display, statistics, and conditions.

![Use a Percent field in a page](https://static-docs.nocobase.com/20260709225150.png)


| Scenario | Use |
| --- | --- |
| Form block | Enter a percentage value. |
| Table block | Display, sort, and filter percentages. |
| Details block | Display a percentage value. |
| Workflows and permissions | Use the value in percentage conditions and calculations. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
- [Number](./number.md) - Store ordinary numerical values.
