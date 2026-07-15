---
title: "File collection"
description: "A File collection stores file titles, names, sizes, MIME types, paths, URLs, preview addresses, storage locations, and extended metadata for use with attachment fields."
keywords: "File collection,File Collection,attachments,metadata,NocoBase"
---

# File collection

<PluginInfo name="file-manager"></PluginInfo>

## Introduction

File collections are suitable for file metadata, such as file names, extensions, sizes, MIME types, paths, URLs, preview addresses, storage locations, and custom metadata. The file binary is stored by the file-storage engine; the File collection stores the file metadata.

You can create File collections only from the main data source. External databases, REST API data sources, and External NocoBase data sources do not support creating File collections.

## Use cases

File collections are suitable for these business scenarios:

- Contract attachments, invoice files, and reimbursement receipts
- Product images, employee certificates, and project documents
- Files uploaded, previewed, and downloaded from business records
- Attachment libraries that need independent management of file metadata

## Usage flow

File collections are usually not used directly as main business collections. A common flow is:

1. Create a File collection to store metadata such as file title, file name, size, type, URL, and storage location.
2. Create a relation field in the business collection and relate it to the File collection. For example, relate a `Contract attachments` File collection to the `Contracts` collection.
3. Add the relation field to a Form block for the business collection so that users can upload files while creating or editing a business record.
4. After upload, NocoBase writes file metadata to the File collection and relates the file record to the current business record through the relation field.
5. Display the attachment field in a Details block, Table block, or List block for the business collection so that users can view, preview, or download files.

## Create and configure

In the main data source, click **Create collection** and select **File collection** to create a File collection.

![Create a File collection](https://static-docs.nocobase.com/20240324090414.png)

File collection settings are mostly the same as those for a general collection. A File collection includes file-metadata fields for storing uploaded file titles, paths, URLs, storage locations, and extended information.

| Setting | Description |
| --- | --- |
| Collection display name | The name displayed for the collection, such as `Contract attachments`, `Invoice files`, or `Product images`. |
| Collection name | The collection identifier used internally by APIs, relation fields, permissions, and workflows. |
| Categories | Collection categories affect only organization in Data source management; they do not change the collection structure. |
| Description | A description of the collection. State which files it stores, who uploads them, and which business collections use them. |
| Preset fields | Preset fields. Keep system fields and File collection built-in fields when creating a File collection. |

### Built-in fields

After a File collection is created, it usually includes the following built-in fields. File binaries are stored in file storage, while the File collection stores this metadata.

| Field | Field name | Description |
| --- | --- | --- |
| ID | `id` | The default primary key that uniquely identifies a file record. |
| Title | `title` | The file title, normally used for display in the interface. |
| File name | `filename` | The file name. |
| Extension name | `extname` | The file extension. |
| Size | `size` | The file size. |
| MIME type | `mimetype` | The file MIME type. |
| Path | `path` | The path of the file in storage. |
| URL | `url` | The file access address. |
| Preview | `preview` | The file preview address. |
| Storage | `storage` / `storageId` | The storage to which the file belongs. `storage` is a relation field and `storageId` is its corresponding foreign key. |
| Meta | `meta` | Extended file metadata. |
| Created at | `createdAt` | Automatically records when the file record was created. |
| Created by | `createdBy` | Automatically records the user who uploaded or created the file record. |
| Updated at | `updatedAt` | Automatically records when the file record was last updated. |
| Updated by | `updatedBy` | Automatically records the user who last updated the file record. |
| Space | `space` | Available after enabling the [Multi-space plugin](../../multi-app/multi-space/index.md). It isolates data by space and does not appear when Multi-space is not enabled. |

![File collection built-in fields](https://static-docs.nocobase.com/20240324090527.png)

### Primary key field

Like a general collection, a File collection needs a primary key. Attachment fields and relation fields use the primary key to relate file metadata records.

If a File collection has no primary key, set **Record unique key** when editing the collection. Otherwise, attachment records might not be related, previewed, or edited correctly.

## Create a relation

Create a relation field in the business collection and relate it to the File collection.

![Create a relation to a File collection](https://static-docs.nocobase.com/20240324091529.png)

## Use in pages

File collection data is usually created automatically when files are uploaded through attachment interfaces. Use it in Form blocks, Details blocks, or relation blocks.

![Configure an attachment field](https://static-docs.nocobase.com/20260710160424.png)

![Use a File collection in a page](https://static-docs.nocobase.com/20240324091321.png)

| Configuration location | Use |
| --- | --- |
| [Form block](../../interface-builder/blocks/data-blocks/form.md) | Upload attachments in a business-collection record. |
| [Details block](../../interface-builder/blocks/data-blocks/details.md) | Display, preview, or download attachments. |
| [Table block](../../interface-builder/blocks/data-blocks/table.md) | Display attachment fields in a list. |
| [Relation block](../../interface-builder/blocks/data-blocks/table.md) | Manage file records related to the current business record directly. |

## Edit configuration

In the collection list, click **Edit** next to a File collection to change its display name, category, description, simple pagination mode, **Record unique key**, and other settings.

File metadata fields are normally written automatically during upload. Do not repurpose fields such as `url`, `path`, or `storageId` for other business meanings. To extend file-related business information, add fields such as `File type`, `Project phase`, or `Archived`.

## Delete a collection

In the collection list, click **Delete** next to a File collection to delete it.

Deleting a File collection deletes file-metadata records and related collection metadata. Before deleting it, confirm whether attachment fields and relation fields in business collections, page blocks, permissions, workflows, or APIs still depend on it.

:::danger Warning

A File collection stores file metadata. Deleting File collection records might invalidate attachment references in business records. Whether file binaries are also deleted depends on the file storage and business configuration. Confirm that files are no longer used by the business before proceeding.

:::

## Related links

- [General collection](../data-source-main/general-collection.md) - General configuration and block usage.
- [Collection fields](../data-modeling/collection-fields/index.md) - Configure attachment fields and relation fields.
- [File manager](../../plugins/@nocobase/plugin-file-manager/index.md) - Configure file storage.
- [Multi-space](../../multi-app/multi-space/index.md) - Learn about the Space field and data isolation by space.
