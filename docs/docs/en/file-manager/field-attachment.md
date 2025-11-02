# Attachment

## Introduction

The system has a built-in "Attachment" field type to support file uploads in custom collections.

The Attachment field is fundamentally a Many-to-Many association field that points to the built-in "Attachments" (`attachments`) collection. When an Attachment field is created in any collection, a junction table for the many-to-many relationship is automatically generated. The metadata of uploaded files is stored in the "Attachments" collection, and the file information referenced in the collection is associated through this junction table.

## Field Configuration


![20240512180916](https://static-docs.nocobase.com/20251031000729.png)


### MIME Type Restrictions

Used to restrict the types of files allowed for upload, using the [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) syntax format. For example: `image/*` represents image files. Multiple types can be separated by a comma, for example: `image/*,application/pdf` allows both image and PDF file types.

### Storage Engine

Select the storage engine for storing uploaded files. If left blank, the system's default storage engine will be used.