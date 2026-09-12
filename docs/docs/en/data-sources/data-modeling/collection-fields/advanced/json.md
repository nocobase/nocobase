---
title: "JSON"
description: "The JSON field stores structured or semi-structured data such as configuration objects and API-response fragments."
keywords: "JSON,json,field,Field interface,NocoBase"
---

# JSON

## Introduction

In NocoBase, the **JSON** field stores structured or semi-structured data.

It is suitable for external API response fragments, extended configuration, dynamic attributes, and other data with an unstable structure. It is flexible, but harder to filter, validate, and display than ordinary fields. When the structure is stable, split it into explicit fields first.

## Use cases

JSON fields are suitable for these business scenarios:

- Raw external API responses
- Dynamic extended attributes
- Complex configuration objects
- Temporary data that cannot yet be split into structured fields

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **JSON** to create this field.

![Configure a JSON field](https://static-docs.nocobase.com/20240512173905.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. JSON uses `json`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Extended information`, `API response`, or `Configuration`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. JSON uses `json` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports valid-JSON and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a JSON field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `json`. |
| Default Field type | `json`. |
| Available Field types | `json`, `jsonb`. |
| Page component | Uses a JSON editor or text-input component in edit mode. |
| Filtering | Filtering depends on the database and field mapping; it is usually not a primary filter field. |
| Sorting | It is usually not used for sorting. |
| Validation | Supports valid-JSON and required validation. |

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

Click **Delete** beside a JSON field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a JSON field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

JSON fields are suitable for integration and extended-configuration scenarios.

![Use a JSON field in a page](https://static-docs.nocobase.com/20260710151854.png)


| Scenario | Use |
| --- | --- |
| Form block | Enter or edit JSON data. |
| Details block | Display structured content. |
| Workflows | Store or read external API response fragments. |
| APIs | Pass or return extended objects. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
