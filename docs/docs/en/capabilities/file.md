---
title: 'Files'
description: 'Add purchase documents to orders and see how to upload, save, preview, and download attachments with a complete business prompt.'
keywords: 'NocoBase 3,files,attachments,upload,preview,download,storage'
---

# Files

NocoBase 3 provides file upload, preview, download, and storage management. Use these capabilities to add attachments and image storage to your application. Attachments can be associated with business records so users can access relevant documents. Image storage supports uses such as employee avatars and product images.

Tell your Agent which business feature needs files, how many files each record can have, and who can access them. The Agent connects the file capability to the appropriate pages.

## Before you start

This example adds attachments to an existing order management application. Prepare an order and purchase documents to upload, such as a supplier quotation and product specifications.

Tell your Agent where attachments should appear, which formats to support, who can upload and view them, and whether to retain files when removing an attachment.

## Example: add purchase documents to orders

Purchasing staff need to keep quotations and product specifications with an order. Reviewers should be able to read these documents while reviewing the order.

```text
Add purchase attachments to my existing order management application.

Add an attachment area to order details. Each order can have multiple files, including PDF, images, and DOCX.
Show filenames and sizes, with actions to preview, download, and remove attachments.
After uploading, let users save the attachments to the current order. Keep them available when the order is reopened.
Anyone with access to an order can view and download its attachments. Applicants and reviewers can add or remove attachments.
Removing an attachment only unlinks it from the current order; retain the file.
```

### See the result

1. Open order details, click **Choose files** in the attachment area, and select the purchase documents. Click **Save attachments** to associate them with the order. The files remain available when you reopen the order.

![Upload and save purchase documents in order details](../../../cn/capabilities/assets/file-order-attachments.png)

2. Click **Preview** beside an attachment to read its contents in the application.

![Preview product specifications in the application](../../../cn/capabilities/assets/file-preview-attachment.png)

3. Click **Download** to download the original file. Click **Remove** and save to unlink an attachment from the current order.

![Download a supplier quotation from an order](../../../cn/capabilities/assets/file-download-attachment.png)

## Further use

### Employee avatars and product images

An employee avatar or product cover usually needs one file. Uploading a replacement updates the association. Product galleries and order attachments can contain multiple files. For example:

```text
Add an avatar to each employee, with one image per employee.
Support uploading and replacing the avatar, and show it in employee lists and details.
Use the new avatar after replacement and keep it visible after refreshing the page.
```

### File storage

Filenames, sizes, and business associations are stored in the database. File contents are stored in the location configured for the application. The default application uses local storage and also supports S3-compatible object storage.

For object storage, the storage administrator prepares the bucket, endpoint, region, and access credentials. The application's developer or deployment administrator configures these on the server. The Agent can then connect the relevant business feature to that storage configuration. Application backups need to include both the database and the file contents.

After switching storage, newly uploaded files use the new configuration. Specify a separate migration scope if existing files also need to move.

### Attachment access

Business attachments should follow the access rules of their parent records. For example, employees can view attachments for orders they can access, and reviewers can read purchase documents for orders they handle.

Ask the Agent to apply authentication and business permission checks to upload, file listing, preview, and download endpoints. See [Authorization](./authorization/index.md) for the related rules.

## Developer reference

A file table stores metadata, while the storage service manages the contents. Integration needs to preserve the standard file fields and save the association between business records and files.

<details>
<summary>Standard file fields</summary>

| Field                         | Purpose                                      |
| ----------------------------- | -------------------------------------------- |
| `id`                          | UUID file identifier                         |
| `disk`, `key`                 | Storage configuration name and file location |
| `filename`, `ext`, `mimeType` | Filename, extension, and type                |
| `size`                        | File size in bytes                           |
| `createdAt`, `updatedAt`      | Creation and update timestamps               |

Field names are fixed and the file capability fills them during upload. `contentUrl` is derived from the file identifier and extension, so it does not need a database field. Additional business fields should be nullable or have defaults; save the business association after uploading.

</details>

## Common questions

### Which formats can be previewed?

File components support images, PDF, text, Markdown, audio, and video. DOCX, XLSX, and PPTX can be previewed locally in the browser. Other formats can offer a download action. Legacy Office formats can also use Office Online, which requires a publicly reachable file URL.

### Why is an uploaded file missing from the order?

Uploading creates a file record. Saving attachments associates files with the order. In this example, click **Save attachments** after choosing files, then reopen the order to view them.

### Does removing an attachment delete the file?

This example only unlinks the attachment from the current order, retaining the file record and contents. For permanent cleanup, specify which files to remove and how to handle references from other business records. The Agent can implement that behavior.

### How can I change upload limits?

Tell the Agent which formats are allowed, the maximum size of each file, and the number of attachments per record. It can configure both page guidance and server limits. Built-in endpoints default to 5 MiB per single-file upload request and 20 MiB per batch request, including the entire request body.
