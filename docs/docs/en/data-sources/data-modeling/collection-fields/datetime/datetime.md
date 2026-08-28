---
title: "DateTime"
description: "The DateTime field stores date and time values with time-zone information."
keywords: "DateTime,datetime,field,Field interface,NocoBase"
---

# DateTime

## Introduction

In NocoBase, the **DateTime** field stores a date and time with time-zone information.

It is suitable for event times, submission times, appointment times, and other time points that need consistent time-zone handling. Use DateTime (without time zone) when the value must remain a local time without conversion.

## Use cases

DateTime fields are suitable for these business scenarios:

- Meeting and appointment times
- Order submission and payment times
- System event and operation times
- Time points shared across time zones

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **DateTime** to create this field.

![Configure a DateTime field](https://static-docs.nocobase.com/20240512181142.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. DateTime uses `datetime`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Meeting time`, `Submission time`, or `Appointment time`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. DateTime uses `datetimeTz` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports date-range and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a DateTime field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `datetime`. |
| Default Field type | `datetimeTz`. |
| Available Field types | `datetimeTz`, `date`. |
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

Click **Delete** beside a DateTime field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a DateTime field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

DateTime fields are suitable for event records, schedules, and time-based business conditions.

![Use a DateTime field in a page](https://static-docs.nocobase.com/20260709232355.png)


| Scenario | Use |
| --- | --- |
| Form block | Select a date and time. |
| Table block | Display, sort, and filter date-time values. |
| Details block | Display the time of one record. |
| Workflows and permissions | Use the value in time-based conditions. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
