---
title: "Date"
description: "The Date field stores a calendar date without requiring a time value."
keywords: "Date,dateOnly,field,Field interface,NocoBase"
---

# Date

## Introduction

In NocoBase, the **Date** field stores a calendar date.

It is suitable for signing dates, birthdays, due dates, and other values where only the date matters. Use DateTime when the time of day is also required.

## Use cases

Date fields are suitable for these business scenarios:

- Signing dates and effective dates
- Birthdays and anniversary dates
- Due dates and planned dates
- Business dates without a time of day

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Date** to create this field.

![Configure a Date field](https://static-docs.nocobase.com/20260709232951.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Date uses `dateOnly`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Signing date`, `Due date`, or `Birthday`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Date uses `dateOnly` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports date-range and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Date field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `dateOnly`. |
| Default Field type | `dateOnly`. |
| Available Field types | `dateOnly`, `date`. |
| Page component | Uses a date picker in edit mode. |
| Filtering | Supports date filters such as before, after, range, is empty, and is not empty. |
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

Click **Delete** beside a Date field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Date field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Date fields are suitable for date-only entry, display, and business conditions.

![Use a Date field in a page](https://static-docs.nocobase.com/20260709232644.png)


| Scenario | Use |
| --- | --- |
| Form block | Select a date. |
| Table block | Display, sort, and filter dates. |
| Details block | Display a date value. |
| Workflows and permissions | Use the date in business conditions. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
