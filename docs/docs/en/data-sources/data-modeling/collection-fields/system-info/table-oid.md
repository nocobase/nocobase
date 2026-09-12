---
title: "Table OID"
description: "The Table OID field identifies the collection to which a record belongs."
keywords: "Table OID,tableoid,field,Field interface,NocoBase"
---

# Table OID

## Introduction

In NocoBase, **Table OID** identifies the collection to which a record belongs.

It is commonly used by inheritance collections or scenarios that need to distinguish the source collection of a record. It is mainly a system and metadata capability; ordinary business collections usually do not need it.

## Use cases

Table OID fields are suitable for these business scenarios:

- Inheritance collections
- Distinguishing a record source collection
- System metadata
- Collection-level record identification

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Table OID** to create this field.

![Configure a Table OID field](https://static-docs.nocobase.com/20240512174746.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Table OID uses `tableoid`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Table OID` or `Source collection`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Table OID uses `virtual` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Is normally maintained by the system. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Table OID field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `tableoid`. |
| Default Field type | `virtual`. |
| Available Field types | `virtual`. |
| Page component | Is maintained as a virtual system field. |
| Filtering | Supports filtering where supported by system metadata. |
| Sorting | It is usually not used for sorting. |
| Validation | Is normally maintained by the system. |

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

Click **Delete** beside a Table OID field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Table OID field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Table OID fields are suitable for system metadata and inheritance scenarios.




| Scenario | Use |
| --- | --- |
| Details block | Display source-collection metadata where needed. |
| System configuration | Distinguish a record source collection. |
| Workflows | Use collection metadata in advanced logic. |
| APIs | Return collection-source metadata where needed. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
