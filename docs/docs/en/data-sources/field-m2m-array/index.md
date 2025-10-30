# Many-to-Many (Array)

<PluginInfo name="field-m2m-array"></PluginInfo>

## Introduction

This feature allows you to use array fields in a data Collection to store multiple unique keys from the target table, thereby creating a many-to-many relationship between the two tables. For instance, consider the entities Articles and Tags. An article can be linked to multiple tags, with the article table storing the IDs of the corresponding records from the tags table in an array field.

:::warning{title=Note}

- Whenever possible, it's recommended to use a junction Collection to establish a standard [many-to-many](../data-modeling/collection-fields/associations/m2m/index.md) relationship instead of relying on this method.
- Currently, only PostgreSQL supports filtering source Collection data using fields from the target table for many-to-many relationships established with array fields. For example, in the scenario above, you can filter articles based on other fields in the tags table, such as the title.

  :::

### Field Configuration

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Parameter Description

### Source Collection

The source Collection, where the current field resides.

### Target Collection

The target Collection with which the relationship is established.

### Foreign Key

The array field in the source Collection that stores the target key from the target table.

The corresponding relationships for array field types are as follows:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target Key

The field in the target Collection that corresponds to the values stored in the source table's array field. This field must be unique.
