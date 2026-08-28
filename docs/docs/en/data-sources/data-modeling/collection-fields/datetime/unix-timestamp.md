---
title: "Unix timestamp"
description: "The Unix timestamp field stores timestamps from external systems as integer values."
keywords: "Unix timestamp,unixTimestamp,field,Field interface,NocoBase"
---

# Unix timestamp

## Introduction

In NocoBase, the **Unix timestamp** field stores a Unix timestamp as an integer value.

It is suitable for time values from external APIs, logs, and synchronized systems. Use DateTime when users need to enter and manage ordinary date-time values directly.

## Use cases

Unix timestamp fields are suitable for these business scenarios:

- External API timestamps
- Log and event timestamps
- Synchronized system time values
- Integer-based time values

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Unix timestamp** to create this field.

![Configure a Unix timestamp field](https://static-docs.nocobase.com/20240512180432.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Unix timestamp uses `unixTimestamp`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `External timestamp`, `Event timestamp`, or `Log time`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Unix timestamp uses `integer` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports timestamp-format and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Unix timestamp field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `unixTimestamp`. |
| Default Field type | `integer`. |
| Available Field types | `integer`, `bigInt`. |
| Page component | Uses a date-time presentation component for the timestamp where configured. |
| Filtering | Supports date-time and numerical filters where supported by the field mapping. |
| Sorting | Supports chronological sorting in Table blocks. |
| Validation | Supports timestamp-format and required validation. |

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

Click **Delete** beside a Unix timestamp field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Unix timestamp field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Unix timestamp fields are suitable for external-system timestamps and integration data.

![Use a Unix timestamp field in a page](https://static-docs.nocobase.com/20260709232558.png)


| Scenario | Use |
| --- | --- |
| Form block | Enter or display a timestamp where needed. |
| Table block | Display, sort, and filter timestamps. |
| Details block | Display a converted timestamp. |
| Workflows and APIs | Pass integer-based time values to integrations. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
