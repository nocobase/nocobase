---
title: "DateTime (without time zone)"
description: "The DateTime (without time zone) field stores a local date and time without time-zone conversion."
keywords: "DateTime (without time zone),datetimeNoTz,field,Field interface,NocoBase"
---

# DateTime (without time zone)

## Introduction

In NocoBase, **DateTime (without time zone)** stores a local date and time without time-zone conversion.

It is suitable for local schedules, business hours, and values that must remain unchanged as entered. Use DateTime when the same instant must be interpreted consistently across time zones.

## Use cases

DateTime (without time zone) fields are suitable for these business scenarios:

- Local schedules and business hours
- Local appointment times
- Store opening and closing times with a date
- Time values imported without time-zone data

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **DateTime (without time zone)** to create this field.

![Configure a DateTime (without time zone) field](https://static-docs.nocobase.com/20260709232834.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. DateTime (without time zone) uses `datetimeNoTz`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Local schedule`, `Business time`, or `Appointment time`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. DateTime (without time zone) uses `datetimeNoTz` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports date-range and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a DateTime (without time zone) field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `datetimeNoTz`. |
| Default Field type | `datetimeNoTz`. |
| Available Field types | `datetimeNoTz`. |
| Page component | Uses a date-time picker in edit mode. |
| Filtering | Supports date-time filters such as before, after, range, is empty, and is not empty. |
| Sorting | Supports chronological sorting in Table blocks. |
| Validation | Supports date-range and required validation. |

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

Click **Delete** beside a DateTime (without time zone) field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a DateTime (without time zone) field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

DateTime (without time zone) fields are suitable for local schedules and business time values.

![Use a DateTime (without time zone) field in a page](https://static-docs.nocobase.com/20260709232511.png)


| Scenario | Use |
| --- | --- |
| Form block | Select a local date and time. |
| Table block | Display, sort, and filter local date-time values. |
| Details block | Display a local time value. |
| Workflows and permissions | Use the value in time-based conditions. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
