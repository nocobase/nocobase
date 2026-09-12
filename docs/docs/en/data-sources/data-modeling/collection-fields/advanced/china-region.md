---
title: "China region"
description: "The China region field stores Chinese administrative divisions such as provinces, cities, and districts. It supports three-level cascading selection and hierarchical display."
keywords: "China region,province city district,administrative division field,three-level cascade,NocoBase"
---

# China region

<PluginInfo name="field-china-region"></PluginInfo>

## Introduction

In NocoBase, **China region** stores Chinese administrative-division information such as provinces, cities, and districts.

The China region field uses the built-in `chinaRegions` administrative-division collection and a cascading selector for data entry. Users select province, city, and district in order; values display as a complete hierarchical path.

For street and building-number information, use [Input](../basic/input.md) or [Textarea](../basic/textarea.md).

## Use cases

China region is suitable for these business scenarios:

- Locations of customers, contacts, stores, and projects
- Address basics such as registered residence, birthplace, and shipping region
- Service areas, sales territories, and project implementation areas
- Data that needs filtering or aggregation by province, city, and district

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **China region**.

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

| Setting | Description |
| --- | --- |
| Field interface | China region uses `chinaRegion`, which determines how the field is entered and displayed. |
| Field display name | Use a business-friendly name such as `Region`, `Service area`, or `Shipping region`. |
| Field name | The internal identifier used by APIs, relation fields, permissions, and workflows. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | China region is normally stored as a related record or structured value, depending on field configuration. |
| Selection level | Controls the deepest selectable level. `Province`, `City`, and `District` are supported; the default is `District`. |
| Require the last level | When enabled, users must select the configured deepest level before submitting. Otherwise, they can complete selection at an intermediate level. |
| Validation rules | Configure required validation and selection level as needed. |
| Description | Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

| Behavior | Description |
| --- | --- |
| Default Field interface | `chinaRegion`. |
| Data source | The built-in `chinaRegions` administrative-division collection. |
| Page component | Uses a cascading selector in edit mode. |
| Selection levels | Supports Province, City, and District. |
| Display | Displays a `Province / City / District` path in read mode. |
| Filtering | Supports filtering by saved region values; capabilities depend on field configuration and blocks. |
| Multiple selection | Not supported. |

## Edit configuration

Click **Edit** beside the field to change its display name, description, validation rules, selection level, and whether the last level is required.

For a field from a synchronized main-database table, editing usually maps the database field to a NocoBase Field type and Field interface.

| Setting | Can be edited | Description |
| --- | --- | --- |
| Field display name | Yes | Changes the name displayed in the interface without changing the field identifier. |
| Field name | No | The identifier normally cannot be changed after creation. |
| Field interface | Conditional | Main-database and synchronized fields can be adjusted during mapping. |
| Field type | Conditional | Confirm that existing values are compatible before changing it. |
| Selection level | Yes | Changes the selectable deepest level to Province, City, or District. |
| Require the last level | Yes | Controls whether the configured deepest level must be selected before submission. |
| Validation rules | Yes | Adjusts required and other validation. |
| Description | Yes | Adds maintenance information for the field. |

:::warning Note

China region depends on the plugin-provided `chinaRegions` collection. Enable the **China region** field plugin before using it.

:::

## Delete field

Click **Delete** beside a China region field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a China region field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced before deleting it.

:::

## Use in pages

China region fields are suitable for addresses, regions, and statistical scenarios.

| Scenario | Use |
| --- | --- |
| Form block | Select province, city, and district with a cascading selector. |
| Details block | Display an administrative-division path. |
| Table block | Display the region of a record. |
| Filter block | Filter records by region. |
| Chart block | Aggregate business data by province, city, or district. |

### Edit mode

China region uses a cascading selector in edit mode.

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

### Read mode

China region displays as a text path in read mode, for example:

```text
Beijing / Municipal district / Dongcheng District
```

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [Input](../basic/input.md) - Store detailed street addresses.
- [Textarea](../basic/textarea.md) - Store longer address descriptions.
