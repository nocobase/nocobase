---
title: "Point"
description: "The Point field stores a geographic point such as a store, device, or customer location."
keywords: "Point,point,field,Field interface,NocoBase"
---

# Point

## Introduction

In NocoBase, the **Point** field stores a geographic point.

It is suitable for store locations, device coordinates, customer locations, and other single-point geographic data.

## Use cases

Point fields are suitable for these business scenarios:

- Store locations
- Device coordinates
- Customer locations
- Other single-point geographic data

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Point** to create this field.

![Configure a Point field](https://static-docs.nocobase.com/20240512181420.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Point uses `point`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Store location`, `Device coordinates`, or `Customer location`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Point uses `point` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports base validation such as required. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Point field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `point`. |
| Default Field type | `point`. |
| Available Field types | `point`. |
| Page component | Uses a map or coordinate-selection component in edit mode. |
| Filtering | Spatial filtering depends on map-plugin and data-source capabilities. |
| Sorting | It is usually not used for sorting. |
| Validation | Supports base validation such as required. |

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

Click **Delete** beside a Point field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Point field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Point fields are suitable for map display and geographic business data.

![Use a Point field in a page](https://static-docs.nocobase.com/20260710144034.png)


| Scenario | Use |
| --- | --- |
| Form block | Select a location on a map or enter coordinates. |
| Details block | Display a point location. |
| Map and geographic blocks | Show a location in a map context. |
| Workflows and APIs | Pass geographic point data to business logic. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
