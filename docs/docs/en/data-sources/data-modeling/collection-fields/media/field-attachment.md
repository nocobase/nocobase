# Attachment Field

## Introduction

The system has a built-in "Attachment" field type to support file uploads in custom collections.

Under the hood, the attachment field is a many-to-many relationship field that points to the system's built-in "Attachments" (`attachments`) collection. When you create an attachment field in any collection, a many-to-many junction table is automatically generated. The metadata of uploaded files is stored in the "Attachments" collection, and the file information referenced in your collection is linked through this junction table.

## Field Configuration


![20240512180916](https://static-docs.nocobase.com/20251031000729.png)


### MIME Type Whitelist

Used to restrict the types of files allowed for upload, using [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) syntax. For example, `image/*` represents image files. Multiple types can be separated by commas, such as `image/*,application/pdf`, which allows both image and PDF files.

### Storage

Select the storage engine for uploaded files. If left blank, the system's default storage engine will be used.