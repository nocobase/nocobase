---
title: "Attachment"
description: "The Attachment field uploads files and relates file records to the current business record."
keywords: "Attachment,attachment,field,Field interface,NocoBase"
---

# Attachment

## Introduction

In NocoBase, **Attachment** uploads files and relates file records to the current business record.

It normally relates to a File collection. The file binary is stored by a file-storage engine, while metadata such as file name, size, URL, and MIME type is stored in the File collection. Use Attachment URL for external file links.

## Use cases

Attachment fields are suitable for these business scenarios:

- Contract attachments
- Invoice files
- Product images
- Files uploaded for business records

## Create and configure

On the collection's **Configure fields** page, click **Add field** and select **Attachment** to create this field.

![Configure a Attachment field](https://static-docs.nocobase.com/20251031000729.png)

| Setting | Description |
| --- | --- |
| Field interface | The field interface. Attachment uses `attachment`, which determines how the field is entered and displayed in pages. |
| Field display name | The name displayed for the field, such as `Contract attachments`, `Invoice files`, or `Product images`. Use a name that business users can recognize. |
| Field name | The field identifier used internally by APIs, relation fields, permissions, and workflows. It usually cannot be changed after creation. It supports only letters, numbers, and underscores, and must begin with a letter. |
| Field type | The data-layer type. Attachment uses `association` by default. |
| Default value | The default value. When a new record has no value, NocoBase can fill this value automatically. |
| Validation rules | Validation rules. Required validation is supported; file count, size, and type are controlled by upload-component or file-storage settings. |
| Description | A field description. Record the field meaning, entry requirements, data source, or maintainer. |

:::warning Note

Field names are referenced by page blocks, permissions, workflows, and APIs after creation. Confirm the name before creating the field to avoid later configuration changes.

:::

## Field behavior

The default behavior of a Attachment field is as follows:

| Behavior | Description |
| --- | --- |
| Default Field interface | `attachment`. |
| Default Field type | `association`. |
| Available Field types | A relation field associated with file records. |
| Page component | Uses an upload component in edit mode. |
| Filtering | Attachment filtering depends on the relation field and block capabilities. |
| Sorting | It is usually not used for sorting. |
| Validation | Required validation is supported; file count, size, and type are controlled by upload-component or file-storage settings. |

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

Click **Delete** beside a Attachment field to delete it. You can also select multiple fields and delete them in the main data source.

Deleting a Attachment field created in the main database usually also deletes the actual database column and its values. For a synchronized or external-data-source field, the impact depends on the corresponding data source and field origin.

:::danger Warning

Deleting a field can affect page blocks, forms, filters, permissions, workflows, APIs, imports and exports, and existing data. Confirm that the field is no longer referenced by business configuration before deleting it.

:::

## Use in pages

Attachment fields are suitable for file upload, preview, and download in business records.

![Use a Attachment field in a page](https://static-docs.nocobase.com/20260709231642.png)


| Scenario | Use |
| --- | --- |
| Form block | Upload attachments for a business record. |
| Details block | Display, preview, or download attachments. |
| Table block | Display attachment values in lists. |
| Workflows and APIs | Use related file metadata in business logic. |

## Related links

- [Fields](../data-modeling/collection-fields/index.md) - Learn about field categories and mapping.
- [General collection](../data-source-main/general-collection.md) - Create and manage fields in a collection.
- [File collection](../file-manager/file-collection.md) - Manage file metadata.
- [Attachment URL](../field-attachment-url/index.md) - Store external file addresses.
