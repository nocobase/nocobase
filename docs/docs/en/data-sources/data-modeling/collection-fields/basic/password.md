---
title: "Password"
description: "The Password field stores password or secret values and uses a masked input component."
keywords: "Password,password,field,Field interface,NocoBase"
---

# Password

## Introduction

In NocoBase, the **Password** field stores password or secret values.

It is suitable for access passwords, connection secrets, and temporary passwords. Use it only when the value is required by business configuration; do not use it as a substitute for user authentication and authorization.

## Use cases

Password fields are suitable for these business scenarios:

- Access passwords and temporary passwords
- Connection secrets
- Configuration values requiring masked input
- Service account credential settings

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Password** to create this field.

![Configure a Password field](https://static-docs.nocobase.com/20240512175917.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Password uses `password`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Access password`, `Connection secret`, or `Temporary password`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Password uses `password` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports length, regular-expression, and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Password field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `password`. |
| Default Field type | `password`. |
| Available Field types | `password`, `string`. |
| Page component | Uses a masked password input in edit mode. |
| Filtering | It is usually not used as a primary filter field. |
| Sorting | It is usually not used for sorting. |
| Validation | Supports length, regular-expression, and required validation. |

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

Click **Delete** beside a Password field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Password field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Password fields are suitable for protected configuration values in forms.

![Use a Password field in a page](https://static-docs.nocobase.com/20260709225244.png)


| Scenario | Use |
| --- | --- |
| Form block | Enter or change a password value. |
| Details block | Display a masked value where supported. |
| Configuration pages | Store protected configuration values. |
| Workflows and APIs | Use only when business logic requires the value. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
