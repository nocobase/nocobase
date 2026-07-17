---
title: "Checkbox"
description: "The Checkbox field stores a true or false value for a binary business state."
keywords: "Checkbox,checkbox,field,Field interface,NocoBase"
---

# Checkbox

## Introduction

In NocoBase, the **Checkbox** field stores a true or false value.

It is suitable for business states such as enabled, completed, and invoiced. Use a Select or Radio group when the field needs more than two states.

## Use cases

Checkbox fields are suitable for these business scenarios:

- Whether a record is enabled
- Whether a task is complete
- Whether an invoice has been issued
- Other binary business states

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Checkbox** to create this field.

![Configure a Checkbox field](https://static-docs.nocobase.com/20240512180122.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Checkbox uses `checkbox`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Enabled`, `Completed`, or `Invoiced`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Checkbox uses `boolean` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports required validation and default values. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Checkbox field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `checkbox`. |
| Default Field type | `boolean`. |
| Available Field types | `boolean`. |
| Page component | Uses a Checkbox or Switch component in edit mode. |
| Filtering | Supports boolean filters such as is true, is false, is empty, and is not empty. |
| Sorting | Supports sorting in Table blocks. |
| Validation | Supports required validation and default values. |

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

Click **Delete** beside a Checkbox field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Checkbox field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Checkbox fields are suitable for binary states in forms, lists, and workflows.

![Use a Checkbox field in a page](https://static-docs.nocobase.com/20260709225738.png)


| Scenario | Use |
| --- | --- |
| Form block | Select or clear a binary state. |
| Table block | Display, sort, and filter a state. |
| Details block | Display the state of one record. |
| Workflows and permissions | Use the value in true-or-false conditions. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
