---
title: "Space"
description: "The Space field records the space to which data belongs and supports data isolation by space."
keywords: "Space,space,field,Field interface,NocoBase"
---

# Space

## Introduction

In NocoBase, **Space** records the space to which data belongs.

It appears after the Multi-space plugin is enabled and isolates data by space. Do not use it as an ordinary business field. For a business department, region, or project dimension, create a normal relation or choice field instead.

## Use cases

Space fields are suitable for these business scenarios:

- Data isolation by space
- Multi-space access control
- Space-scoped records
- Multi-tenant data separation

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Space** to create this field.

![Configure a Space field](https://static-docs.nocobase.com/index-2025-11-01-00-50-45.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Space uses `space`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Space`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Space uses `belongsTo` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Is normally maintained by the system or space context. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Space field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `space`. |
| Default Field type | `belongsTo`. |
| Available Field types | `belongsTo`. |
| Page component | Is maintained by system and space context. |
| Filtering | Supports filtering by the current space where configured. |
| Sorting | It is usually not used for sorting. |
| Validation | Is normally maintained by the system or space context. |

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

Click **Delete** beside a Space field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Space field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Space fields are suitable only for Multi-space data isolation.




| Scenario | Use |
| --- | --- |
| Table block | Display the space where appropriate. |
| Details block | Display the record space. |
| Filters and permissions | Limit records by current space. |
| Workflows | Use space context in business logic. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
