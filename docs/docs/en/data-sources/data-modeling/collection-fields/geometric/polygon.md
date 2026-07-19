---
title: "Polygon"
description: "The Polygon field stores a geographic area such as a sales territory, delivery area, or risk area."
keywords: "Polygon,polygon,field,Field interface,NocoBase"
---

# Polygon

## Introduction

In NocoBase, the **Polygon** field stores a geographic area.

It is suitable for sales territories, delivery areas, risk areas, and other polygonal geographic data.

## Use cases

Polygon fields are suitable for these business scenarios:

- Sales territories
- Delivery areas
- Risk areas
- Other polygonal geographic data

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Polygon** to create this field.

![Configure a Polygon field](https://static-docs.nocobase.com/20240512181547.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Polygon uses `polygon`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Sales territory`, `Delivery area`, or `Risk area`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Polygon uses `polygon` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports base validation such as required. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Polygon field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `polygon`. |
| Default Field type | `polygon`. |
| Available Field types | `polygon`. |
| Page component | Uses a map-drawing component in edit mode. |
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

Click **Delete** beside a Polygon field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Polygon field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Polygon fields are suitable for map display and area-based geographic data.

![Use a Polygon field in a page](https://static-docs.nocobase.com/20260710145218.png)


| Scenario | Use |
| --- | --- |
| Form block | Draw or edit a polygon on a map. |
| Details block | Display a geographic area. |
| Map and geographic blocks | Show an area in a map context. |
| Workflows and APIs | Pass polygon data to business logic. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
