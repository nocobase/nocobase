---
title: "China region"
description: "The China region field selects administrative divisions such as provinces, cities, and districts in China."
keywords: "China region,china region,address,choice field,NocoBase"
---

# China region (deprecated)

## Introduction

:::warning Note

The China region field is deprecated. Use a relation field connected to a Tree collection instead.

:::

In NocoBase, **China region** selects Chinese administrative divisions such as provinces, cities, and districts.

It is suitable for customer addresses, store addresses, service areas, and other scenarios that need a structured region selection. It is easier to filter and aggregate than a manually entered address.

To store a complete street address, use [Input](../basic/input.md) or [Textarea](../basic/textarea.md) for street and building information.

## Use cases

China region is suitable for these business scenarios:

- Customer province, city, and district
- Store service area
- Project implementation area
- Administrative divisions in shipping addresses

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **China region** to create the field.

![Create a China region field](https://static-docs.nocobase.com/20240512180305.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. China region uses `chinaRegion`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Region`, `Service area`, or `Shipping region`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. China region values are normally stored as structured values; the actual Field type depends on field configuration. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Configure required validation and selection level as needed. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

| Behavior | Description |
| --- | --- |
| Default Field interface | `chinaRegion`. |
| Default Field type | `json`. |
| Available Field types | `json`, `string`, depending on actual field configuration. |
| Page component | Uses an administrative-region selector in edit mode. |
| Filtering | Supports filtering by region value; capabilities depend on field configuration. |
| Sorting | It is usually not used for sorting. |
| Validation | Supports base validation such as required. |

## Edit configuration

After creation, click **Edit** beside the field to edit its configuration. Edit fields to adjust how they display and are used in NocoBase, such as the display name, description, default value, validation rules, or field-specific settings.

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

Click **Delete** beside a China region field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a China region field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

China region fields are suitable for addresses, regions, and statistical scenarios.

| Scenario | Use |
| --- | --- |
| Form block | Select a province, city, or district. |
| Details block | Display an administrative division. |
| Filter block | Filter records by region. |
| Chart block | Aggregate business data by region. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [Input](../basic/input.md) - Store detailed street addresses.
- [Textarea](../basic/textarea.md) - Store longer address descriptions.
- [Relation fields](../associations/index.md) - Relate a Tree collection for region data.
