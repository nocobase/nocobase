---
title: "Collection select"
description: "The Collection select field selects one or more NocoBase collections."
keywords: "Collection select,collectionSelect,field,Field interface,NocoBase"
---

# Collection select

## Introduction

In NocoBase, **Collection select** selects one or more collections.

It is suitable for plugin configuration, rule configuration, and metadata management. It stores collection identifiers rather than business records. To select records from a collection, use a relation field instead.

## Use cases

Collection select fields are suitable for these business scenarios:

- Selecting target collections in plugin configuration
- Specifying collection scope in rule configuration
- Metadata management and template configuration
- Feature configuration that references collection identifiers

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Collection select** to create this field.

![Configure a Collection select field](https://static-docs.nocobase.com/20240512174047.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Collection select uses `collectionSelect`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Target collection`, `Affected collection`, or `Data scope`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Collection select uses `string` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports base validation such as required and selection range. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Collection select field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `collectionSelect`. |
| Default Field type | `string`. |
| Available Field types | `string`, `json`. |
| Page component | Uses a collection-selector component in edit mode. |
| Filtering | It is usually not used as a business filter field. |
| Sorting | It is usually not used for sorting. |
| Validation | Supports base validation such as required and selection range. |

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

Click **Delete** beside a Collection select field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Collection select field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Collection select fields are suitable for configuration forms.




| Scenario | Use |
| --- | --- |
| Form block | Select one or more collections. |
| Details block | Display selected collections. |
| Plugin configuration | Specify the collections affected by a feature. |
| Workflows and rules | Use collection metadata in logic. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
- [Relation fields](../associations/index.md) - Select records from a collection.
