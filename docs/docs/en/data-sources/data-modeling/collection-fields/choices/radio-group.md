---
title: "Radio group"
description: "The Radio group field stores one option selected from a visible group of fixed options."
keywords: "Radio group,radioGroup,field,Field interface,NocoBase"
---

# Radio group

## Introduction

In NocoBase, the **Radio group** field stores one selected option value.

It is suitable for priorities, approval results, types, and other single-choice options that users should compare directly. Use Select when the option list is long.

## Use cases

Radio group fields are suitable for these business scenarios:

- Priority
- Approval result
- Type
- Other visible single-choice options

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Radio group** to create this field.

![Configure a Radio group field](https://static-docs.nocobase.com/20260709231205.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Radio group uses `radioGroup`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Priority`, `Approval result`, or `Type`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Radio group uses `string` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports required validation and configured option values. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Radio group field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `radioGroup`. |
| Default Field type | `string`. |
| Available Field types | `string`. |
| Page component | Uses a Radio group component in edit mode. |
| Filtering | Supports option filters such as equals, does not equal, is empty, and is not empty. |
| Sorting | Supports sorting in Table blocks. |
| Validation | Supports required validation and configured option values. |

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

Click **Delete** beside a Radio group field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Radio group field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Radio group fields are suitable for visible single-choice business values.

![Use a Radio group field in a page](https://static-docs.nocobase.com/20260709230347.png)


| Scenario | Use |
| --- | --- |
| Form block | Select one visible option. |
| Table block | Display, sort, and filter the selected option. |
| Details block | Display the selected option. |
| Workflows and permissions | Use the selected value in business conditions. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
