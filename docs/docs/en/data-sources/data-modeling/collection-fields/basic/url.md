---
title: "URL"
description: "The URL field stores website, document, and other external addresses."
keywords: "URL,url,field,Field interface,NocoBase"
---

# URL

## Introduction

In NocoBase, the **URL** field stores URL addresses.

It is suitable for official websites, document links, and external addresses. Compared with a normal Input field, it provides clearer URL semantics and URL-format validation.

## Use cases

URL fields are suitable for these business scenarios:

- Official websites
- Document and help links
- External system addresses
- Product and service URLs

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **URL** to create this field.

![Configure a URL field](https://static-docs.nocobase.com/20240512175641.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. URL uses `url`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Official website`, `Document link`, or `External address`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. URL uses `string` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports URL-format, length, and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a URL field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `url`. |
| Default Field type | `string`. |
| Available Field types | `string`. |
| Page component | Uses an Input component with URL-format validation in edit mode. |
| Filtering | Supports text filters such as contains, equals, is empty, and is not empty. |
| Sorting | Supports sorting in Table blocks. |
| Validation | Supports URL-format, length, and required validation. |

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

Click **Delete** beside a URL field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a URL field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

URL fields are suitable for forms, details, and external navigation.

![Use a URL field in a page](https://static-docs.nocobase.com/20260709224747.png)


| Scenario | Use |
| --- | --- |
| Form block | Enter a URL address. |
| Details block | Display and open a URL. |
| Filter block | Filter records by URL value. |
| Workflows and APIs | Pass an external address to business logic. |

## Related links

- [Fields](../index.md) - Learn about field categories and mapping.
- [General collection](../../../data-source-main/general-collection.md) - Create and manage fields in a collection.
- [Input](./input.md) - Store ordinary short text.
