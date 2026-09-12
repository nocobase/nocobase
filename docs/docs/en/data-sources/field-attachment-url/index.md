---
title: "Attachment URL"
description: "The Attachment URL field stores external file addresses for files hosted outside NocoBase."
keywords: "Attachment URL,attachmentUrl,field,Field interface,NocoBase"
---

# Attachment URL

## Introduction

In NocoBase, **Attachment URL** stores an external file access address.

It is suitable when files are already stored in an external system, object storage, or CDN and NocoBase only needs the access address. Use Attachment when NocoBase needs to upload and manage files, or URL for an ordinary web address.

## Use cases

Attachment URL fields are suitable for these business scenarios:

- Files hosted in external systems
- Object-storage file addresses
- CDN image and document addresses
- External attachments referenced by business records

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Attachment URL** to create this field.

![Configure a Attachment URL field](https://static-docs.nocobase.com/20241017092323.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Attachment URL uses `attachmentUrl`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `File address`, `Image URL`, or `External attachment`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Attachment URL uses `string` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Supports URL-format, length, and required validation. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Attachment URL field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `attachmentUrl`. |
| Default Field type | `string`. |
| Available Field types | `string`, `text`. |
| Page component | Uses an attachment-URL component for entry and display. |
| Filtering | Supports URL and text filters where supported by the data source. |
| Sorting | Supports sorting in Table blocks where supported by the data source. |
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

Click **Delete** beside a Attachment URL field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Attachment URL field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Attachment URL fields are suitable for external-file display, preview, and download.

![Use a Attachment URL field in a page](https://static-docs.nocobase.com/20260709231803.png)

![Attachment URL configuration](https://static-docs.nocobase.com/20241017092456.png)
![Attachment URL configuration](https://static-docs.nocobase.com/20241017092759.png)

| Scenario | Use |
| --- | --- |
| Form block | Enter an external file address. |
| Details block | Display, preview, or download an external file. |
| Table block | Display external attachment values. |
| Workflows and APIs | Pass external file addresses to business logic. |

## Related links

- [Fields](../data-modeling/collection-fields/index.md) - Learn about field categories and mapping.
- [General collection](../data-source-main/general-collection.md) - Create and manage fields in a collection.
- [Attachment](../file-manager/field-attachment.md) - Upload and manage files in NocoBase.
- [URL](../data-modeling/collection-fields/basic/url.md) - Store ordinary web addresses.
